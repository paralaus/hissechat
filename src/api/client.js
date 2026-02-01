import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/v1';

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
});

/**
 * Process queued requests after token refresh
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      console.log('[Auth] No refresh token found');
      return null;
    }

    console.log('[Auth] Attempting to refresh access token');

    // Use a separate axios instance to avoid interceptor loops
    const response = await axios.post(
      `${API_URL}/auth/refresh-tokens`,
      {refreshToken},
      {headers: {'Content-Type': 'application/json'}},
    );

    const {access, refresh} = response.data.tokens || response.data;

    if (!access?.token) {
      console.error('[Auth] Invalid refresh response');
      return null;
    }

    // Save new tokens
    Cookies.set('token', access.token, {
      expires: new Date(access.expires),
    });
    Cookies.set('tokenExpires', access.expires, {
      expires: new Date(access.expires),
    });

    if (refresh?.token) {
      Cookies.set('refreshToken', refresh.token, {
        expires: new Date(refresh.expires),
      });
    }

    // Update axios headers
    apiClient.defaults.headers.common['Authorization'] =
      `Bearer ${access.token}`;

    console.log('[Auth] Access token refreshed successfully');
    return access.token;
  } catch (error) {
    console.error(
      '[Auth] Token refresh failed:',
      error?.response?.data || error.message,
    );

    // Clear invalid tokens
    clearAuthTokens();
    return null;
  }
};

/**
 * Clear all auth tokens
 */
export const clearAuthTokens = () => {
  Cookies.remove('token');
  Cookies.remove('tokenExpires');
  Cookies.remove('refreshToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Set auth token in axios headers
 */
export const setAuthToken = token => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Check if token is expired or about to expire
 */
const isTokenExpired = () => {
  const expires = Cookies.get('tokenExpires');
  if (!expires) return true;

  const expiryTime = new Date(expires).getTime();
  const now = Date.now();
  const buffer = 60 * 1000; // 1 minute buffer

  return now > expiryTime - buffer;
};

/**
 * Request interceptor
 * - Ensures auth token is set
 * - Checks token expiry before requests
 * - Proactively refreshes token if needed
 */
apiClient.interceptors.request.use(
  async config => {
    // Skip auth for login/register endpoints
    const isAuthEndpoint =
      config.url?.includes('auth/') ||
      config.url?.includes('login') ||
      config.url?.includes('register');

    if (isAuthEndpoint) {
      return config;
    }

    // Ensure token is set from cookie if not in headers
    if (!config.headers['Authorization']) {
      const token = Cookies.get('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }

    // Check token expiry
    if (isTokenExpired() && Cookies.get('refreshToken')) {
      console.log('[Auth] Token expiring soon, proactively refreshing...');

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;

          if (newToken) {
            config.headers['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);
          } else {
            processQueue(new Error('Refresh failed'), null);
          }
        } catch (e) {
          isRefreshing = false;
          processQueue(e, null);
        }
      } else {
        // Wait for ongoing refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: token => {
              if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
              }
              resolve(config);
            },
            reject: err => reject(err),
          });
        });
      }
    }

    return config;
  },
  error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  },
);

/**
 * Response interceptor
 * - Handles 401 errors with automatic token refresh
 * - Queues failed requests during refresh
 * - Retries requests after successful refresh
 */
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 Unauthorized
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Skip for auth endpoints
      const isAuthEndpoint =
        originalRequest.url?.includes('auth/') ||
        originalRequest.url?.includes('login') ||
        originalRequest.url?.includes('register');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log('[Auth] Refresh in progress, queueing request');
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      // Mark request as retry to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      console.log('[Auth] 401 received, attempting token refresh');

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Update authorization header
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          // Process queued requests
          processQueue(null, newToken);

          // Retry original request
          return apiClient(originalRequest);
        } else {
          // Token refresh failed
          processQueue(new Error('Token refresh failed'), null);

          // Redirect to login
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Redirect to login
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For 403 Forbidden, redirect to login
    if (status === 403) {
      console.warn('[Auth] 403 Forbidden - redirecting to login');
      clearAuthTokens();
      window.location.href = '/auth/login';
    }

    return Promise.reject(error);
  },
);

export default apiClient;
