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

export const changePassword = async (userId, body) => {
  return apiClient.post(`/users/${userId}/password`, body);
};

export const createUser = async body => {
  return apiClient.post('/users', body);
};

// Get testers for Firebase App Distribution
export const getTesters = async (platform = 'all', chunkSize) => {
  return apiClient.get('/users/testers', {params: {platform, chunkSize}});
};

// App Distribution
export const getDistributionStatus = async () => {
  return apiClient.get('/distribution/status');
};

export const distributeApp = async (
  file,
  releaseNotes,
  groups = 'testers',
  onProgress,
) => {
  const formData = new FormData();
  formData.append('app', file);
  formData.append('releaseNotes', releaseNotes || '');
  formData.append('groups', groups);

  return apiClient.post('/distribution/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 600000, // 10 minutes for large files
    onUploadProgress: progressEvent => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// Moderation API


export const getMessagesForModeration = async params => {
  return apiClient.get('/channel-messages/moderation', {params});
};

export const getFlaggedMessages = async params => {
  return apiClient.get('/channel-messages/flagged', {params});
};

export const blockMessage = async (messageId, reason) => {
  return apiClient.post(`/channel-messages/${messageId}/block`, {reason});
};

export const unblockMessage = async messageId => {
  return apiClient.post(`/channel-messages/${messageId}/unblock`);
};

export const getMarketDetails = async params => {
  return apiClient.get('/market-details', {params});
};

export const getMarkets = async params => {
  return apiClient.get('/markets', {params});
};

export const getFunds = async params => {
  return apiClient.get('/funds', {params});
};

export const getMarketDetail = async code => {
  return apiClient.get(`/market-details/${code}`);
};

export const getChartData = async (code, type, range = '1m') => {
  return apiClient.get(`/markets/${code}/chart`, {
    params: {type, range},
  });
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

export const getAdsDetails = async params => {
  return apiClient.get('/ads-details', {params});
};

export const getAdDetail = async adDetailId => {
  return apiClient.get(`/ads-details/${adDetailId}`);
};

export const deleteAdDetail = async adDetailId => {
  return apiClient.delete(`/ads-details/${adDetailId}`);
};

export const updateAdDetail = async (adDetailId, body) => {
  return apiClient.patch(`/ads-details/${adDetailId}`, body);
};

export const createAdDetail = async body => {
  return apiClient.post('/ads-details', body);
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

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {Object} options - Additional options
 * @returns {Promise} Upload response
 */
export const uploadFileWithProgress = async (
  file,
  onProgress,
  options = {},
) => {
  const formData = new FormData();
  formData.append('file', file);

  // Determine timeout based on file size (1 minute per 10MB, min 60s)
  const sizeMB = file.size / (1024 * 1024);
  const timeout = Math.max(60000, Math.ceil(sizeMB / 10) * 60000);

  return apiClient.post(`/upload/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout,
    onUploadProgress: progressEvent => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      }
    },
    ...options,
  });
};

/**
 * Upload video with optimized settings
 * @param {File} file - Video file to upload
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {Object} options - Additional options
 * @returns {Promise} Upload response
 */
export const uploadVideo = async (file, onProgress, options = {}) => {
  const formData = new FormData();
  formData.append('file', file);

  // Videos get longer timeout (2 minutes per 10MB, min 120s)
  const sizeMB = file.size / (1024 * 1024);
  const timeout = Math.max(120000, Math.ceil(sizeMB / 10) * 120000);

  return apiClient.post(`/upload/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout,
    maxContentLength: 100 * 1024 * 1024, // 100MB
    maxBodyLength: 100 * 1024 * 1024,
    onUploadProgress: progressEvent => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      }
    },
    ...options,
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

export const createChannel = async body => {
  return apiClient.post('/channels', body);
};

export const initiateMarketChannel = async marketCode => {
  return apiClient.post('/channels/initiate/market', {marketCode});
};

export const initiateFundChannel = async fundCode => {
  return apiClient.post('/channels/initiate/fund', {fundCode});
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

// Friend APIs
export const initiatePrivateChannel = async userId => {
  return apiClient.post(`/channels/initiate/private`, {userId});
};

export const getProducts = async params => {
  return apiClient.get('/products', {params});
};

export const getProduct = async id => {
  return apiClient.get(`/products/${id}`);
};

export const getPurchases = async params => {
  return apiClient.get('/purchases', {params});
};

export const getNotifications = async params => {
  return apiClient.get('/notifications', {params});
};

export const markNotificationAsRead = async id => {
  return apiClient.patch(`/notifications/${id}`, {isOpened: true});
};

export const markAllNotificationsAsRead = async () => {
  return apiClient.post('/notifications/read-all');
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

export const getAppRatings = async params => {
  return apiClient.get('/app-ratings', {params});
};

export const deleteAppRating = async id => {
  return apiClient.delete(`/app-ratings/${id}`);
};

export const getSuggestion = async id => {
  return apiClient.get(`/suggestions/suggestions/${id}`);
};

export const deleteSuggestion = async id => {
  return apiClient.delete(`/suggestions/suggestions/${id}`);
};

export const updateSuggestion = async (id, body) => {
  return apiClient.patch(`/suggestions/suggestions/${id}`, body);
};

export const sendPushNotification = async body => {
  return apiClient.post(`/notifications/push`, body);
};

export const getAnnouncements = async params => {
  return apiClient.get('/announcements', {params});
};

export const getAnnouncement = async id => {
  return apiClient.get(`/announcements/${id}`);
};

export const createAnnouncement = async body => {
  return apiClient.post('/announcements', body);
};

export const updateAnnouncement = async (id, body) => {
  return apiClient.patch(`/announcements/${id}`, body);
};

export const deleteAnnouncement = async id => {
  return apiClient.delete(`/announcements/${id}`);
};

export const getStatistics = async () => {
  return apiClient.get(`/admin/statistics`);
};

export const approveUsers = async (emails, message) => {
  return apiClient.post('/admin/approve-users', {emails, message});
};

export const getSslPinningStatus = async () => {
  return apiClient.get('/admin/security/ssl-pinning');
};

export const setSslPinningStatus = async enabled => {
  return apiClient.put('/admin/security/ssl-pinning', {enabled});
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

export const getJoinedChannels = async params => {
  return apiClient.get('/channels/joined', {params});
};

export const getUserProfile = async userId => {
  return apiClient.get(`/users/${userId}/profile`);
};

export const getCommonJoinedChannels = async userId => {
  return apiClient.get('/channels/common', {
    params: {user: userId},
  });
};

export const addFriend = async userId => {
  return apiClient.post(`/friends/${userId}/add`);
};

export const removeFriend = async userId => {
  return apiClient.post(`/friends/${userId}/remove`);
};

export const acceptFriend = async userId => {
  return apiClient.post(`/friends/${userId}/accept`);
};

export const fetchFriends = async (userId, params) => {
  return apiClient.get(`/friends/${userId}/friends`, {params});
};

export const kickOutFromChannel = async (userId, channelId) => {
  return apiClient.post(`/channels/${channelId}/kick-out/${userId}`);
};

// VIP Application Endpoints
export const createVipApplication = async body => {
  return apiClient.post('/vip-applications', body);
};

export const updateVipApplication = async (vipApplicationId, body) => {
  return apiClient.patch(`/vip-applications/${vipApplicationId}`, body);
};

export const getVipApplications = async params => {
  return apiClient.get('/vip-applications', {params});
};

export const getVipApplication = async vipApplicationId => {
  return apiClient.get(`/vip-applications/${vipApplicationId}`);
};

export const deleteVipApplication = async vipApplicationId => {
  return apiClient.delete(`/vip-applications/${vipApplicationId}`);
};

// Bulk Messaging
export const sendBulkMessage = async (body, options = {}) => {
  return apiClient.post('/channels/bulk-message', body, {
    signal: options.signal,
  });
};

// Channel Messages
export const getChannelMessages = async (channelId, params) => {
  return apiClient.get(`/channels/${channelId}/messages`, {params});
};

export const sendChannelMessage = async (channelId, body) => {
  return apiClient.post(`/channels/${channelId}/messages`, body);
};

export const deleteChannelMessage = async (channelId, messageId) => {
  return apiClient.delete(`/channels/${channelId}/messages/${messageId}`);
};

export const deleteChannelMessageForUser = async (channelId, messageId) => {
  return apiClient.delete(
    `/channels/${channelId}/messages/${messageId}/for-user`,
  );
};

export const deleteChannelMessages = async (channelId, messageIds) => {
  // Delete multiple messages sequentially
  const results = await Promise.allSettled(
    messageIds.map(messageId =>
      apiClient.delete(`/channels/${channelId}/messages/${messageId}`),
    ),
  );
  return results;
};

// Pinned Messages
export const getPinnedMessages = async channelId => {
  const id = encodeURIComponent(channelId);
  return apiClient.get(`/pinned-messages/${id}`);
};

export const pinMessage = async ({channelId, messageId, durationMs}) => {
  const body = {channelId, messageId};
  if (durationMs && durationMs > 0) body.durationMs = durationMs;
  return apiClient.post('/pinned-messages', body);
};

export const unpinMessage = async pinId => {
  const id = encodeURIComponent(pinId);
  return apiClient.delete(`/pinned-messages/unpin/${id}`);
};

// Archives
export const archiveMessage = async ({messageId, channelId}) => {
  return apiClient.post('/archives', {messageId, channelId});
};

export const getArchivedMessages = async params => {
  return apiClient.get('/archives', {params});
};

export const deleteArchivedMessage = async archiveId => {
  const id = encodeURIComponent(archiveId);
  return apiClient.delete(`/archives/${id}`);
};

// Conference
export const createConference = async body => {
  return apiClient.post('/conferences', body);
};

export const createLiveBroadcast = async body => {
  return apiClient.post('/live-broadcast', body);
};

// Media server'a doğrudan canlı yayın session'ı kayıt eder. Bu çağrı,
// media server'ın `liveBroadcastSessions` map'ini doldurur ve böylece
// yayıncı üretmeye başladığında FFmpeg/HLS pipeline'ı otomatik başlar.
// Backend zaten kayıt yapıyor olabilir; bu yedek/idempotent bir çağrı.
// REACT_APP_MEDIA_SERVER_URL .env'de tanımlı değilse no-op şeklinde
// reject döner — caller zaten best-effort yapıyor.
export const registerMediaServerBroadcastSession = async data => {
  const base = String(
    process.env.REACT_APP_MEDIA_SERVER_URL || '',
  )
    .trim()
    .replace(/\/$/, '');
  if (!base) {
    throw new Error('media_server_url_missing');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}/live-broadcast/session`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`media_server_session_register_failed_${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

export const scheduleConference = async body => {
  return apiClient.post('/conferences/schedule', body);
};

export const getActiveConferences = async params => {
  return apiClient.get('/conferences', {params});
};

export const getConferenceByRoom = async roomId => {
  return apiClient.get(`/conferences/room/${roomId}`);
};

// Channel Polls
export const createChannelPoll = async (channelId, body) => {
  return apiClient.post(`/channels/${channelId}/polls`, body);
};

export const getChannelPolls = async (channelId, params) => {
  return apiClient.get(`/channels/${channelId}/polls`, {params});
};

export const votePoll = async (pollId, optionIndex) => {
  return apiClient.post(`/polls/${pollId}/vote`, {optionIndex});
};

export const closePoll = async pollId => {
  return apiClient.post(`/polls/${pollId}/close`);
};

// Reactions
export const addReaction = async (channelId, messageId, emoji) => {
  return apiClient.post(
    `/channels/${channelId}/messages/${messageId}/reactions`,
    {emoji},
  );
};

export const removeReaction = async (channelId, messageId, emoji) => {
  return apiClient.delete(
    `/channels/${channelId}/messages/${messageId}/reactions`,
    {data: {emoji}},
  );
};

export const getPendingUsers = async channelId => {
  return apiClient.get(`/channels/${channelId}/pending-users`);
};

export const getAllowedUsers = async channelId => {
  return apiClient.get(`/channels/${channelId}/allowed-users`);
};

export const approveUser = async (channelId, userId) => {
  return apiClient.post(`/channels/${channelId}/approve/${userId}`);
};

export const revokeUser = async (channelId, userId) => {
  return apiClient.post(`/channels/${channelId}/revoke/${userId}`);
};

// Poll Management
export const getPollsAdmin = async params => {
  return apiClient.get('/polls', {params});
};

export const closePollAdmin = async pollId => {
  return apiClient.post(`/polls/${pollId}/close-admin`);
};

export const deletePollAdmin = async pollId => {
  return apiClient.delete(`/polls/${pollId}/admin`);
};
