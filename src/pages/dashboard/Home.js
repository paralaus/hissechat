// Force Vercel rebuild - v2
import { MiniStatistics, Page, StatisticsSkeleton } from '../../components';
import { SimpleGrid, Box, Text, Heading, Divider } from '@chakra-ui/react';
import { FaUserClock, FaUsers, FaChartLine } from 'react-icons/fa';
import { RiVipFill, RiMoneyDollarCircleFill } from 'react-icons/ri';
import { BiSolidMessageDetail } from 'react-icons/bi';
import { MdInsertChart, MdReport, MdBlock, MdShoppingCart } from 'react-icons/md';
import { FiVideo, FiAlertTriangle, FiShield, FiTrendingUp, FiActivity, FiLayers, FiPieChart, FiCpu } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { routes } from '../../config/routes';
import { api } from '../../api';
import { isValue } from '../../utils/string';
import React from 'react';

const iconProps = {
  color: 'white',
  size: 22,
};

const Home = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.getStatistics().then((res) => res.data),
  });
  
  const { data: vipApplications } = useQuery({
    queryKey: ['vip-applications', 'pending', 1],
    queryFn: () => api.getVipApplications({ status: 'pending', limit: 1, page: 1 }).then(res => res.data),
  });
  
  const { data: activeConferencesRaw } = useQuery({
    queryKey: ['conferences', 'active', 'dashboard'],
    queryFn: () => api.getActiveConferences({ isActive: true, limit: 100, page: 1 }).then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Client-side filtering for truly active conferences
  // Backend might return conferences where isActive=true but scheduledEndTime has passed
  const activeConferencesCount = React.useMemo(() => {
    const results = activeConferencesRaw?.results || [];
    const now = new Date();
    const DEFAULT_DURATION_MS = 60 * 60 * 1000; // 60 minutes default
    const SAFETY_FALLBACK_MS = 24 * 60 * 60 * 1000; // 24 hours
    
    const trulyActive = results.filter(conf => {
      const startTime = new Date(conf.startTime);
      const endTime = conf.scheduledEndTime ? new Date(conf.scheduledEndTime) : null;
      const endedAt = conf.endedAt ? new Date(conf.endedAt) : null;
      
      // Calculate effective end time
      const effectiveEndTime = endTime || new Date(startTime.getTime() + DEFAULT_DURATION_MS);
      
      // Check if conference has ended
      const hasEndedExplicitly = endedAt !== null || conf.isActive === false;
      const hasEndedByTime = effectiveEndTime < now;
      const hasEndedBySafety = (now - startTime) > SAFETY_FALLBACK_MS;
      const isFuture = startTime > now;
      
      // Conference is truly active if:
      // - Not ended by any criteria
      // - Not in the future
      // - isActive is true
      return !hasEndedExplicitly && !hasEndedByTime && !hasEndedBySafety && !isFuture && conf.isActive === true;
    });
    
    return trulyActive.length;
  }, [activeConferencesRaw]);
  
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

  // Channel Counts
  const { data: stockChannels } = useQuery({
    queryKey: ['markets', 'stock', 'count'],
    queryFn: () => api.getMarkets({ type: 'stock', limit: 1 }).then(res => res.data),
  });

  const { data: cryptoChannels } = useQuery({
    queryKey: ['markets', 'crypto', 'count'],
    queryFn: () => api.getMarkets({ type: 'crypto', limit: 1 }).then(res => res.data),
  });

  const { data: viopChannels } = useQuery({
    queryKey: ['markets', 'viop', 'count'],
    queryFn: () => api.getMarkets({ type: 'viop', limit: 1 }).then(res => res.data),
  });

  const { data: commodityChannels } = useQuery({
    queryKey: ['markets', 'commodity', 'count'],
    queryFn: () => api.getMarkets({ type: 'commodity', limit: 1 }).then(res => res.data),
  });

  const { data: fundChannels } = useQuery({
    queryKey: ['funds', 'count'],
    queryFn: () => api.getFunds({ limit: 1 }).then(res => res.data),
  });

  // Yüklenirken skeleton göster
  if (isLoading) {
    return (
      <Page title="Dashboard" subtitle="Genel bakış ve istatistikler">
        <StatisticsSkeleton count={8} />
      </Page>
    );
  }

  // Gruplandırılmış İstatistikler
  
  const userStats = [
    {
      title: 'Aktif Kullanıcı',
      value: 'activeUsers',
      amount: data?.activeUsers,
      icon: <FaUserClock {...iconProps} />,
    },
    {
      title: 'Aylık Aboneler',
      value: 'monthlySubscribers',
      amount: data?.monthlySubscribers,
      icon: <RiMoneyDollarCircleFill {...iconProps} />,
    },
    {
      title: 'Toplam Kullanıcı',
      value: 'totalUsers',
      amount: data?.totalUsers,
      icon: <FaUsers {...iconProps} />,
    },
  ];

  const marketStats = [
    {
      title: 'Atılan Mesajlar',
      value: 'totalMessages',
      amount: data?.totalMessages,
      icon: <BiSolidMessageDetail {...iconProps} />,
    },
    {
      title: 'Hisse Senedi Verileri',
      value: 'stockMarkets',
      amount: data?.stockMarkets,
      icon: <FaChartLine {...iconProps} />,
    },
    {
      title: 'Kripto Para Verileri',
      value: 'cryptoMarkets',
      amount: data?.cryptoMarkets,
      icon: <MdInsertChart {...iconProps} />,
    },
  ];

  const channelStats = [
    {
      title: 'VİP Kanallar',
      amount: data?.vipChannels,
      icon: <RiVipFill {...iconProps} />,
      path: routes.vipChannels.path,
    },
    {
      title: 'Borsa Kanalları',
      amount: stockChannels?.totalResults || 0,
      icon: <FiTrendingUp {...iconProps} />,
      path: routes.stockChannels.path,
    },
    {
      title: 'Kripto Kanalları',
      amount: cryptoChannels?.totalResults || 0,
      icon: <FiCpu {...iconProps} />,
      path: routes.cryptoChannels.path,
    },
    {
      title: 'VİOP Kanalları',
      amount: viopChannels?.totalResults || 0,
      icon: <FiActivity {...iconProps} />,
      path: routes.viopChannels.path,
    },
    {
      title: 'Emtia Kanalları',
      amount: commodityChannels?.totalResults || 0,
      icon: <FiLayers {...iconProps} />,
      path: routes.commodityChannels.path,
    },
    {
      title: 'Fon Kanalları',
      amount: fundChannels?.total || fundChannels?.totalResults || 0,
      icon: <FiPieChart {...iconProps} />,
      path: routes.fundChannels.path,
    },
  ];

  const operationStats = [
    {
      title: 'Bekleyen VIP Başvuruları',
      amount: vipApplications?.totalResults || 0,
      icon: <RiVipFill {...iconProps} />,
      path: routes.vipApplications.path,
    },
    {
      title: 'Aktif Konferanslar',
      amount: activeConferencesCount,
      icon: <FiVideo {...iconProps} />,
      path: '/dashboard/conferences',
    },
    {
      title: 'Ürünler',
      amount: products?.totalResults || 0,
      icon: <MdShoppingCart {...iconProps} />,
      path: routes.products.path,
    },
  ];

  const moderationStats = [
    {
      title: 'Son Raporlar',
      amount: data?.latelyReports,
      icon: <MdReport {...iconProps} />,
      path: routes.reports.path,
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
  ];

  const renderSection = (title, items) => (
    <Box mb={8}>
      <Heading size="md" mb={4} color="gray.600">{title}</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="6">
        {items.map((item, index) => {
          // If item has a path, make it clickable
          const content = (
            <MiniStatistics
              key={item.title || index}
              title={item.title}
              amount={item.amount}
              icon={item.icon}
            />
          );

          if (item.path) {
            return (
              <NavLink key={item.title || index} to={item.path} style={{ textDecoration: 'none' }}>
                {content}
              </NavLink>
            );
          }

          return content;
        })}
      </SimpleGrid>
      <Divider mt={6} />
    </Box>
  );

  return (
    <Page title="Dashboard" subtitle="Genel bakış ve istatistikler">
      {renderSection('Kullanıcı İstatistikleri', userStats)}
      {renderSection('Kanal İstatistikleri', channelStats)}
      {renderSection('Operasyonel Durum', operationStats)}
      {renderSection('Piyasa Verileri', marketStats)}
      {renderSection('Güvenlik ve Moderasyon', moderationStats)}
    </Page>
  );
};

export default Home;
