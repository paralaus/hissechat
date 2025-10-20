import apiClient from './client';

export const login = async params => {
  return apiClient.post('/auth/login/admin', params);
};

export const forgotPassword = async params => {
  return apiClient.post('/auth/forgot-password', params);
};

export const verifyResetPassword = async params => {
  return apiClient.post('/auth/verify-reset-password', params);
};

export const resetPassword = async params => {
  return apiClient.post('/auth/reset-password', params);
};

export const getUsers = async params => {
  return apiClient.get('/users', {params});
};

export const getUser = async userId => {
  return apiClient.get(`/users/${userId}`);
};

export const deleteUser = async userId => {
  return apiClient.delete(`/users/${userId}`);
};

export const manageUser = async (userId, body) => {
  return apiClient.patch(`/users/${userId}/manage`, body);
};

export const updateUser = async (userId, body) => {
  return apiClient.patch(`/users/${userId}`, body);
};

export const createUser = async body => {
  return apiClient.post('/users', body);
};

export const getMarketDetails = async params => {
  return apiClient.get('/market-details', {params});
};

export const getMarketDetail = async code => {
  return apiClient.get(`/market-details/${code}`);
};

export const deleteMarketDetail = async code => {
  return apiClient.delete(`/market-details/${code}`);
};

export const updateMarketDetail = async (code, body) => {
  return apiClient.patch(`/market-details/${code}`, body);
};

export const createMarketDetail = async body => {
  return apiClient.post('/market-details', body);
};

export const uploadFile = async file => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/upload/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadImage = async file => {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post(`/upload/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const createVipChannel = async body => {
  return apiClient.post('/channels/vip', body);
};

export const getVipChannels = async params => {
  return apiClient.get('/channels/vip', {params});
};

export const getAllChannels = async params => {
  return apiClient.get('/channels/all', {params});
};

export const getChannel = async id => {
  return apiClient.get(`/channels/${id}`);
};

export const deleteChannel = async id => {
  return apiClient.delete(`/channels/${id}`);
};

export const updateChannel = async (id, body) => {
  return apiClient.patch(`/channels/${id}`, body);
};

export const createProduct = async body => {
  return apiClient.post('/products', body);
};

export const getProducts = async params => {
  return apiClient.get('/products', {params});
};

export const getProduct = async id => {
  return apiClient.get(`/products/${id}`);
};

export const deleteProduct = async id => {
  return apiClient.delete(`/products/${id}`);
};

export const updateProduct = async (id, body) => {
  return apiClient.patch(`/products/${id}`, body);
};

export const createPolicy = async body => {
  return apiClient.post('/policies', body);
};

export const getPolicies = async params => {
  return apiClient.get('/policies', {params});
};

export const getPolicy = async id => {
  return apiClient.get(`/policies/${id}`);
};

export const deletePolicy = async id => {
  return apiClient.delete(`/policies/${id}`);
};

export const updatePolicy = async (id, body) => {
  return apiClient.patch(`/policies/${id}`, body);
};

export const createSuggestion = async body => {
  return apiClient.post('/suggestions', body);
};

export const getSuggestions = async params => {
  return apiClient.get('/suggestions', {params});
};

export const getSuggestion = async id => {
  return apiClient.get(`/suggestions/${id}`);
};

export const deleteSuggestion = async id => {
  return apiClient.delete(`/suggestions/${id}`);
};

export const updateSuggestion = async (id, body) => {
  return apiClient.patch(`/suggestions/${id}`, body);
};

export const sendPushNotification = async body => {
  return apiClient.post(`/notifications/push`, body);
};

export const getStatistics = async () => {
  return apiClient.get(`/admin/statistics`);
};

export const getReports = async params => {
  return apiClient.get('/reports', {params});
};

export const getReport = async id => {
  return apiClient.get(`/reports/${id}`);
};

export const getBlacklists = async params => {
  return apiClient.get(`/blacklist/`, {params});
};

export const getBlacklist = async id => {
  return apiClient.get(`/blacklist/${id}`);
};

export const deleteBlacklist = async id => {
  return apiClient.delete(`/blacklist/${id}`);
};

export const updateBlacklist = async (id, body) => {
  return apiClient.patch(`/blacklist/${id}`, body);
};

export const createBlacklist = async body => {
  return apiClient.post('/blacklist', body);
};

export const getChannelsOfUser = async (id, params) => {
  return apiClient.get(`/users/${id}/channels`, {params});
};

export const kickOutFromChannel = async (userId, channelId) => {
  return apiClient.post(`/channels/${channelId}/kick-out/${userId}`);
};
