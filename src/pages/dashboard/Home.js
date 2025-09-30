import {MiniStatistics, Page} from '../../components';
import {SimpleGrid} from '@chakra-ui/react';
import {FaUserClock, FaUsers, FaChartLine} from 'react-icons/fa';
import {RiVipFill, RiMoneyDollarCircleFill} from 'react-icons/ri';
import {BiSolidMessageDetail} from 'react-icons/bi';
import {MdInsertChart, MdReport} from 'react-icons/md';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../api';
import {isValue} from '../../utils/string';

const iconProps = {
  color: 'white',
  size: 24,
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
  const {data, isLoading} = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.getStatistics().then(res => res.data),
  });
  return (
    <Page>
      <SimpleGrid columns={{sm: 1, md: 2, xl: 4}} spacing="24px">
        {items.map(item => {
          const dataItem = data?.[item.value];
          if (!isValue(dataItem)) return null;
          return (
            <MiniStatistics
              key={item.value}
              title={item.title}
              amount={data?.[item.value]}
              icon={item.icon}
            />
          );
        })}
      </SimpleGrid>
    </Page>
  );
};

export default Home;
