import { FiHome, FiSettings, FiUsers, FiBell, FiSend, FiMessageCircle, FiSmartphone, FiShield, FiTrendingUp, FiCpu, FiActivity, FiPieChart, FiLayers, FiVideo, FiDatabase } from 'react-icons/fi';
import {
  AiOutlineUserAdd,
  AiOutlineProduct,
} from 'react-icons/ai';
import { BiLineChart } from 'react-icons/bi';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { FaRegFileAlt, FaAd } from 'react-icons/fa';
import { RiVipLine, RiChatPollLine } from 'react-icons/ri';
import { GoListUnordered } from 'react-icons/go';
import { IoMdAdd } from 'react-icons/io';
import { MdBlock, MdOutlineReport, MdLightbulbOutline } from 'react-icons/md';
import { routes } from './routes';

export const sidebarRoutes = [
  // Genel
  {
    name: 'Anasayfa',
    icon: FiHome,
    path: routes.dashboard.path,
    exact: true,
    group: 'Genel',
  },
  {
    name: 'DB İstatistikleri',
    icon: FiDatabase,
    path: routes.databaseStats.path,
    exact: true,
    group: 'Genel',
  },
  
  // Kullanıcı Yönetimi
  {
    name: 'Kullanıcılar',
    icon: FiUsers,
    group: 'Kullanıcı Yönetimi',
    children: [
      {
        name: 'Tüm Kullanıcılar',
        path: routes.users.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Doğrulanmamış Üyeler',
        path: routes.unverifiedUsers.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Kullanıcı Ekle',
        path: routes.createUser.path,
        icon: AiOutlineUserAdd,
        exact: true,
      },
      {
        name: 'Kullanıcı Düzenle',
        path: routes.createUser.path,
        icon: AiOutlineUserAdd,
        private: true,
      },
    ],
  },
  // İçerik Yönetimi
  {
    name: 'Piyasalar',
    icon: BiLineChart,
    group: 'İçerik Yönetimi',
    children: [
      {
        name: 'Tümü',
        path: routes.markets.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Hisse/Kripto Ekle',
        path: routes.editMarket.getPath('new'),
        icon: HiOutlineDocumentPlus,
        exact: true,
      },
    ],
  },
  {
    name: 'Kanallar',
    icon: RiChatPollLine,
    group: 'İçerik Yönetimi',
    children: [
      {
        name: 'Tüm Kanallar',
        path: routes.allChannels.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Vip Kanallar',
        path: routes.vipChannels.path,
        icon: RiVipLine,
        exact: true,
      },
      {
        name: 'Borsa Kanalları',
        path: routes.stockChannels.path,
        icon: FiTrendingUp,
        exact: true,
      },
      {
        name: 'Kripto Kanalları',
        path: routes.cryptoChannels.path,
        icon: FiCpu,
        exact: true,
      },
      {
        name: 'VİOP Kanalları',
        path: routes.viopChannels.path,
        icon: FiActivity,
        exact: true,
      },
      {
        name: 'Emtia Kanalları',
        path: routes.commodityChannels.path,
        icon: FiLayers,
        exact: true,
      },
      {
        name: 'Fon Kanalları',
        path: routes.fundChannels.path,
        icon: FiPieChart,
        exact: true,
      },
      {
        name: 'Vip Kanal Ekle',
        path: routes.editVipChannels.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },
  {
    name: 'Öneriler',
    icon: MdLightbulbOutline,
    group: 'İçerik Yönetimi',
    children: [
      {
        name: 'Tüm Öneriler',
        path: routes.suggestions.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Öneri Ekle',
        path: routes.editSuggestion.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },
  {
    name: 'Reklamlar',
    icon: FaAd,
    group: 'İçerik Yönetimi',
    children: [
      {
        name: 'Tümü',
        path: routes.ads.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Reklam Ekle',
        path: routes.editAds.getPath('new'),
        icon: HiOutlineDocumentPlus,
        exact: true,
      },
    ],
  },

  // Abonelik & VIP
  {
    name: 'Abonelikler',
    icon: AiOutlineProduct,
    group: 'Abonelik & VIP',
    children: [
      {
        name: 'Tüm Abonelikler',
        path: routes.products.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Abonelik Ekle',
        path: routes.editProduct.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },
  {
    name: 'Vip Başvurular',
    icon: RiVipLine,
    group: 'Abonelik & VIP',
    children: [
      {
        name: 'Tüm Vip Başvurular',
        path: routes.vipApplications.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Vip Başvuru Ekle',
        path: routes.editVipApplications.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },

  // Sistem
  {
    name: 'Sözleşmeler',
    icon: FaRegFileAlt,
    group: 'Sistem',
    children: [
      {
        name: 'Tüm Sözleşmeler',
        path: routes.policies.path,
        icon: GoListUnordered,
        exact: true,
      },
      {
        name: 'Sözleşme Ekle',
        path: routes.editPolicy.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },
  {
    name: 'Raporlar',
    icon: MdOutlineReport,
    path: routes.reports.path,
    group: 'Sistem',
  },
  {
    name: 'Bildirim Gönder',
    icon: FiBell,
    path: routes.sendPushNotification.path,
    group: 'Sistem',
  },
  {
    name: 'Mesajlaşma',
    icon: FiSend,
    group: 'Sistem',
    children: [
      {
        name: 'Kanallar',
        path: routes.messagingChannels.path,
        icon: FiMessageCircle,
      },
      {
        name: 'Toplu Mesaj',
        path: routes.bulkMessage.path,
        icon: FiSend,
      },
    ],
  },
  {
    name: 'Test Dağıtımı',
    icon: FiSmartphone,
    path: routes.appDistribution.path,
    group: 'Sistem',
  },
  {
    name: 'İçerik Moderasyonu',
    icon: FiShield,
    path: routes.moderation.path,
    group: 'Sistem',
  },
  {
    name: 'Video Konferanslar',
    icon: FiVideo,
    path: routes.conferences.path,
    group: 'Sistem',
  },
  {
    name: 'Ayarlar',
    icon: FiSettings,
    path: routes.settings.path,
    group: 'Sistem',
  },
];
