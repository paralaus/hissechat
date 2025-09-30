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
  sendPushNotification: {
    path: '/dashboard/send-push-notification',
  },
  blacklist: {
    path: '/dashboard/blacklist',
  },
  editBlacklist: {
    getPath: id => `/dashboard/blacklist/${id}`,
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
};
