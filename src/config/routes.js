export const routes = {
  login: {
    path: '/auth/login',
  },
  forgotPassword: {
    path: '/auth/forgot-password',
  },
  dashboard: {
    path: '/dashboard',
  },
  users: {
    path: '/dashboard/users',
  },
  deletedUsers: {
    path: '/dashboard/users/deleted',
  },
  unverifiedUsers: {
    path: '/dashboard/users/unverified',
  },
  createUser: {
    path: '/dashboard/users/create',
  },
  editUser: {
    getPath: id => `/dashboard/users/${id}`,
  },
  settings: {
    path: '/dashboard/settings',
  },
  markets: {
    path: '/dashboard/markets',
  },
  editMarket: {
    getPath: id => `/dashboard/markets/${id}`,
  },
  ads: {
    path: '/dashboard/ads',
  },
  editAds: {
    getPath: id => `/dashboard/ads/${id}`,
  },
  vipChannels: {
    path: '/dashboard/channels/vip',
  },
  editVipChannels: {
    getPath: id => `/dashboard/channels/vip/${id}`,
  },
  editChannel: {
    getPath: id => `/dashboard/channels/${id}`,
  },
  products: {
    path: '/dashboard/products',
  },
  editProduct: {
    getPath: id => `/dashboard/products/${id}`,
  },
  policies: {
    path: '/dashboard/policies',
  },
  editPolicy: {
    getPath: id => `/dashboard/policies/${id}`,
  },
  suggestions: {
    path: '/dashboard/suggestions',
  },
  appRatings: {
    path: '/dashboard/app-ratings',
  },
  deviceTelemetry: {
    path: '/dashboard/device-telemetry',
  },
  editSuggestion: {
    getPath: id => `/dashboard/suggestions/${id}`,
  },
  vipApplications: {
    path: '/dashboard/vipapplications',
  },
  editVipApplications: {
    getPath: id => `/dashboard/vipapplications/${id}`,
  },
  sendPushNotification: {
    path: '/dashboard/send-push-notification',
  },
  announcements: {
    path: '/dashboard/announcements',
  },
  createAnnouncement: {
    path: '/dashboard/announcements/new',
  },
  editAnnouncement: {
    getPath: id => `/dashboard/announcements/${id}`,
  },
  reports: {
    path: '/dashboard/reports',
  },
  reportDetail: {
    getPath: id => `/dashboard/reports/${id}`,
  },
  allChannels: {
    path: `/dashboard/channels/all`,
  },
  normalChannels: {
    path: `/dashboard/channels/normal`,
  },
  restrictedChannels: {
    path: `/dashboard/channels/restricted`,
  },
  stockChannels: {
    path: `/dashboard/channels/stock`,
  },
  cryptoChannels: {
    path: `/dashboard/channels/crypto`,
  },
  viopChannels: {
    path: `/dashboard/channels/viop`,
  },
  commodityChannels: {
    path: `/dashboard/channels/commodity`,
  },
  fundChannels: {
    path: `/dashboard/channels/fund`,
  },
  bulkMessage: {
    path: '/dashboard/messaging/bulk',
  },
  messagingChannels: {
    path: '/dashboard/messaging/channels',
  },
  messagingChannelsNormal: {
    path: '/dashboard/messaging/channels/normal',
  },
  messagingChannelsRestricted: {
    path: '/dashboard/messaging/channels/restricted',
  },
  channelChat: {
    getPath: id => `/dashboard/messaging/channels/${id}`,
  },
  appDistribution: {
    path: '/dashboard/distribution',
  },
  moderation: {
    path: '/dashboard/moderation',
  },
  archivedMessages: {
    path: '/dashboard/messaging/archives',
  },
  conferences: {
    path: '/dashboard/conferences',
  },
  subscriptions: {
    path: '/dashboard/subscriptions',
  },
  databaseStats: {
    path: '/dashboard/database-stats',
  },
  polls: {
    path: '/dashboard/polls',
  },
  aiService: {
    path: '/dashboard/ai-service',
  },
  profanityWords: {
    path: '/dashboard/profanity-words',
  },
  priceAlerts: {
    path: '/dashboard/price-alerts',
  },
  economicCalendar: {
    path: '/dashboard/economic-calendar',
  },
  newsModeration: {
    path: '/dashboard/news-moderation',
  },
  liveBroadcasts: {
    path: '/dashboard/live-broadcasts',
  },
  purchaseManagement: {
    path: '/dashboard/purchase-management',
  },
  channelReviews: {
    path: '/dashboard/channel-reviews',
  },
  systemSettings: {
    path: '/dashboard/system-settings',
  },
  notificationTemplates: {
    path: '/dashboard/notification-templates',
  },
  scheduledNotifications: {
    path: '/dashboard/scheduled-notifications',
  },
};
