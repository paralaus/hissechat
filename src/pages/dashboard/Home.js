import { MiniStatistics, Page, StatisticsSkeleton } from '../../components';
import { SimpleGrid } from '@chakra-ui/react';
import { FaUserClock, FaUsers, FaChartLine } from 'react-icons/fa';
import { RiVipFill, RiMoneyDollarCircleFill } from 'react-icons/ri';
import { BiSolidMessageDetail } from 'react-icons/bi';
import { MdInsertChart, MdReport } from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';
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

      {/* Buraya ileride ek widgetlar eklenebilir */}
      {/* Örnek: Son aktiviteler, grafikler, vb. */}
    </Page>
  );
};

export default Home;
