import { MiniStatistics, Page, StatisticsSkeleton } from '../../components';
import { SimpleGrid } from '@chakra-ui/react';
import { FaUserClock, FaUsers, FaChartLine } from 'react-icons/fa';
import { RiVipFill, RiMoneyDollarCircleFill } from 'react-icons/ri';
import { BiSolidMessageDetail } from 'react-icons/bi';
import { MdInsertChart, MdReport, MdBlock, MdShoppingCart } from 'react-icons/md';
import { FiVideo, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { routes } from '../../config/routes';
import { api } from '../../api';
import { isValue } from '../../utils/string';

const iconProps = {
  color: 'white',
  size: 22,
};

const items = [
  {
    title: 'Aktif Kullanıcı',
    value: 'activeUsers',
    icon: <FaUserClock {...iconProps} />,
  },
  {
    title: 'Aylık Aboneler',
    value: 'monthlySubscribers',
    icon: <RiMoneyDollarCircleFill {...iconProps} />,
  },
  {
    title: 'Toplam Kullanıcı',
    value: 'totalUsers',
    icon: <FaUsers {...iconProps} />,
  },
  {
    title: 'VİP Kanallar',
    value: 'vipChannels',
    icon: <RiVipFill {...iconProps} />,
  },
  {
    title: 'Atılan Mesajlar',
    value: 'totalMessages',
    icon: <BiSolidMessageDetail {...iconProps} />,
  },
  {
    title: 'Hisse Senedi',
    value: 'stockMarkets',
    icon: <FaChartLine {...iconProps} />,
  },
  {
    title: 'Kripto Para',
    value: 'cryptoMarkets',
    icon: <MdInsertChart {...iconProps} />,
  },
  {
    title: 'Son Raporlar',
    value: 'latelyReports',
    icon: <MdReport {...iconProps} />,
  },
];

const Home = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.getStatistics().then((res) => res.data),
  });
  
  const { data: vipApplications } = useQuery({
    queryKey: ['vip-applications', 'pending', 1],
    queryFn: () => api.getVipApplications({ status: 'pending', limit: 1, page: 1 }).then(res => res.data),
  });
  
  const { data: activeConferences } = useQuery({
    queryKey: ['conferences', 'active', 1],
    queryFn: () => api.getActiveConferences({ isActive: true, limit: 1, page: 1 }).then(res => res.data),
  });
  
  const { data: flaggedMessages } = useQuery({
    queryKey: ['moderation', 'flagged', 1],
    queryFn: () => api.getMessagesForModeration({ showFlagged: true, limit: 1, page: 1 }).then(res => res.data),
  });
  
  const { data: blockedMessages } = useQuery({
    queryKey: ['moderation', 'blocked', 1],
    queryFn: () => api.getMessagesForModeration({ showBlocked: true, limit: 1, page: 1 }).then(res => res.data),
  });
  
  const { data: blacklists } = useQuery({
    queryKey: ['blacklists', 1],
    queryFn: () => api.getBlacklists({ limit: 1, page: 1 }).then(res => res.data),
  });
  
  const { data: products } = useQuery({
    queryKey: ['products', 1],
    queryFn: () => api.getProducts({ limit: 1, page: 1 }).then(res => res.data),
  });

  // Yüklenirken skeleton göster
  if (isLoading) {
    return (
      <Page title="Dashboard" subtitle="Genel bakış ve istatistikler">
        <StatisticsSkeleton count={8} />
      </Page>
    );
  }

  // Görüntülenecek istatistikleri filtrele
  const visibleItems = items.filter((item) => isValue(data?.[item.value]));
  
  const extraItems = [
    {
      title: 'Bekleyen VIP Başvuruları',
      amount: vipApplications?.totalResults || 0,
      icon: <RiVipFill {...iconProps} />,
      path: routes.vipApplications.path,
    },
    {
      title: 'Aktif Konferanslar',
      amount: activeConferences?.totalResults || 0,
      icon: <FiVideo {...iconProps} />,
      path: (() => {
        const first = activeConferences?.results?.[0];
        const channelId = first?.channel?.id || first?.channelId;
        const roomId = first?.roomId || (first?.jitsiUrl ? (() => {
          const parts = first.jitsiUrl.split('/');
          const last = parts[parts.length - 1] || '';
          return last.split('#')[0];
        })() : undefined);
        return channelId
          ? `${routes.channelChat.getPath(channelId)}?conference=active${roomId ? `&roomId=${encodeURIComponent(roomId)}` : ''}`
          : routes.messagingChannels.path;
      })(),
    },
    {
      title: 'Şikayet Edilen Mesajlar',
      amount: flaggedMessages?.totalResults || 0,
      icon: <FiAlertTriangle {...iconProps} />,
      path: `${routes.moderation.path}?filter=flagged`,
    },
    {
      title: 'Engelli Mesajlar',
      amount: blockedMessages?.totalResults || 0,
      icon: <FiShield {...iconProps} />,
      path: `${routes.moderation.path}?filter=blocked`,
    },
    {
      title: 'Kara Liste',
      amount: blacklists?.totalResults || 0,
      icon: <MdBlock {...iconProps} />,
      path: routes.blacklist.path,
    },
    {
      title: 'Ürünler',
      amount: products?.totalResults || 0,
      icon: <MdShoppingCart {...iconProps} />,
      path: routes.products.path,
    },
  ];

  return (
    <Page title="Dashboard" subtitle="Genel bakış ve istatistikler">
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing="6">
        {visibleItems.map((item) => (
          <MiniStatistics
            key={item.value}
            title={item.title}
            amount={data?.[item.value]}
            icon={item.icon}
          />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing="6" mt="6">
        {extraItems.map((item) => (
          <NavLink key={item.title} to={item.path} style={{ textDecoration: 'none' }}>
            <MiniStatistics
              title={item.title}
              amount={item.amount}
              icon={item.icon}
            />
          </NavLink>
        ))}
      </SimpleGrid>
    </Page>
  );
};

export default Home;
