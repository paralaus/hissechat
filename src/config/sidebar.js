import {FiHome, FiSettings, FiUsers} from 'react-icons/fi';
//import {LuUsers2} from 'react-icons/lu';
import {
  AiOutlineUserAdd,
  AiOutlineProduct,
  AiOutlineNotification,
} from 'react-icons/ai';
import {BiMoney} from 'react-icons/bi';
//import {LuLineChart} from 'react-icons/lu';
import {HiOutlineDocumentPlus} from 'react-icons/hi2';
import {FaRegFileAlt, FaRegFile} from 'react-icons/fa';
import {RiVipLine, RiChatPollLine} from 'react-icons/ri';
import {GoListUnordered} from 'react-icons/go';
import {IoMdAdd} from 'react-icons/io';
import {routes} from './routes';
import {MdBlock, MdOutlineReport} from 'react-icons/md';

export const sidebarRoutes = [
  {
    name: 'Anasayfa',
    icon: FiHome,
    path: routes.dashboard.path,
    exact: true,
    // TODO: roles check
    // roles:[]
  },
  {
    name: 'Kullanıcılar',
    icon: FiUsers,
    children: [
      {
        name: 'Tüm Kullanıcılar',
        path: routes.users.path,
        icon: AiOutlineUserAdd,
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
  {
    name: 'Piyasalar',
    icon: AiOutlineUserAdd,
    children: [
      {
        name: 'Tümü',
        path: routes.markets.path,
        icon: BiMoney,
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
        name: 'Vip Kanal ekle',
        path: routes.editVipChannels.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },
  {
    name: 'Abonelikler',
    icon: AiOutlineProduct,
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
    name: 'Sözleşmeler',
    icon: FaRegFileAlt,
    children: [
      {
        name: 'Tüm Sözleşmeler',
        path: routes.policies.path,
        icon: FaRegFile,
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
    name: 'Öneriler',
    icon: FaRegFileAlt,
    children: [
      {
        name: 'Tüm Öneriler',
        path: routes.suggestions.path,
        icon: FaRegFile,
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
    name: 'Kara Liste',
    icon: MdBlock,
    children: [
      {
        name: 'Tümü',
        path: routes.blacklist.path,
        icon: FaRegFile,
        exact: true,
      },
      {
        name: 'Yeni Ekle',
        path: routes.editBlacklist.getPath('new'),
        icon: IoMdAdd,
        exact: true,
      },
    ],
  },
  {
    name: 'Raporlar',
    icon: MdOutlineReport,
    path: routes.reports.path,
  },
  {
    name: 'Bildirim Gönder',
    icon: AiOutlineNotification,
    path: routes.sendPushNotification.path,
  },
  {
    name: 'Ayarlar',
    icon: FiSettings,
    path: routes.settings.path,
  },
];
