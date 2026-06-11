export const Role = {
  Admin: 'admin',
  User: 'user',
  ChannelAdmin: 'channel-admin',
};

export const roles = Object.values(Role);

export const RoleLabel = {
  [Role.Admin]: 'Admin',
  [Role.User]: 'Kullanıcı',
  [Role.ChannelAdmin]: 'Kanal Admini',
};

export const MarketType = {
  Stock: 'stock',
  Crypto: 'crypto',
};

export const marketTypes = Object.values(MarketType);

export const MarketTypeLabel = {
  [MarketType.Stock]: 'Hisse',
  [MarketType.Crypto]: 'Kripto',
};

export const env = {
  // baseUrl: "http://localhost:3000",
};

export const ChannelType = {
  Vip: 'vip',
  Market: 'market',
  Private: 'private',
};

export const channelTypes = Object.values(ChannelType);

export const PolicyType = {
  Privacy: 'privacy',
  Terms: 'terms',
  Consent: 'consent',
  About: 'about',
  AppSettings: 'app-settings',
};

export const PolicyTypeLabel = {
  [PolicyType.Privacy]: 'Gizlilik',
  [PolicyType.Terms]: 'Şartlar',
  [PolicyType.Consent]: 'Rıza',
  [PolicyType.About]: 'Hakkımızda',
  [PolicyType.AppSettings]: 'Uygulama Ayarları',
};

export const policyTypes = Object.values(PolicyType);

export const SuggestionType = {
  Suggestion: 'suggestion',
  Headline: 'headline',
};

export const SuggestionTypeLabel = {
  [SuggestionType.Suggestion]: 'Öneri',
  [SuggestionType.Headline]: 'Manşet',
};

export const suggestionTypes = Object.values(SuggestionType);

export const ReportType = {
  User: 'user',
  General: 'general',
  Complaint: 'complaint',
  Spam: 'spam',
  Channel: 'channel',
};

export const ReportTypeLabel = {
  [ReportType.User]: 'Kullanıcı Şikayeti',
  [ReportType.General]: 'Genel',
  [ReportType.Complaint]: 'Şikayet',
  [ReportType.Spam]: 'Spam Bildirimi',
  [ReportType.Channel]: 'Kanal Şikayeti',
};

export const BlacklistValueType = {
  UserId: 'user-id',
  Email: 'email',
  Ip: 'ip',
  Text: 'text',
  DeviceId: 'device-id',
};

export const blacklistValueTypes = Object.values(BlacklistValueType);

export const BlacklistScope = {
  Register: 'register',
  ChannelMessage: 'channel-message',
  BannedText: 'banned-text',
  Access: 'access',
};

export const blacklistScopes = Object.values(BlacklistScope);

export const BlacklistValueLabel = {
  [BlacklistValueType.UserId]: 'Kullanıcı ID',
  [BlacklistValueType.Email]: 'E-posta',
  [BlacklistValueType.Ip]: 'IP Adresi',
  [BlacklistValueType.Text]: 'Metin',
  [BlacklistValueType.DeviceId]: 'Cihaz ID',
};

export const BlacklistScopeLabel = {
  [BlacklistScope.Register]: 'Kayıt Olma',
  [BlacklistScope.ChannelMessage]: 'Kanala Mesaj Gönderme',
  [BlacklistScope.BannedText]: 'Yasaklı Mesaj',
  [BlacklistScope.Access]: 'Uygulamaya Giriş',
};

export const BlacklistValueConfig = {
  [BlacklistScope.Access]: {
    values: [
      BlacklistValueType.UserId,
      BlacklistValueType.Email,
      BlacklistValueType.Ip,
      BlacklistValueType.DeviceId,
    ],
    resource: {
      enabled: false,
    },
  },
  [BlacklistScope.Register]: {
    values: [
      BlacklistValueType.Email,
      BlacklistValueType.Ip,
      BlacklistValueType.DeviceId,
    ],
    resource: {
      enabled: false,
    },
  },
  [BlacklistScope.ChannelMessage]: {
    values: [
      BlacklistValueType.UserId,
      BlacklistValueType.Email,
      BlacklistValueType.Ip,
      BlacklistValueType.DeviceId,
    ],
    resource: {
      enabled: true,
      label: 'Kanal ID',
    },
  },
  [BlacklistScope.BannedText]: {
    values: [BlacklistValueType.Text],
    resource: {
      enabled: false,
    },
  },
};

export const NotificationReceiverType = {
  All: 'all',
  Channel: 'channel',
};

export const notificationReceiverTypes = Object.values(
  NotificationReceiverType,
);

export const NotificationReceiverTypeLabel = {
  [NotificationReceiverType.All]: 'Tüm Kullanıcılar',
  [NotificationReceiverType.Channel]: 'Kanal Üyeleri',
};
