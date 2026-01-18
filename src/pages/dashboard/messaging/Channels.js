import React, {useState, useMemo, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Icon,
  Select,
  Button,
} from '@chakra-ui/react';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {
  FiSearch,
  FiMessageCircle,
  FiTrendingUp,
  FiStar,
  FiFilter,
  FiChevronDown,
  FiPieChart,
  FiActivity,
  FiCpu,
  FiUser,
  FiLayers,
  FiUsers,
} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {formatDistanceToNow} from 'date-fns';
import {tr} from 'date-fns/locale';
import {useUserStore} from '../../../store';
import FriendManager from './FriendManager';

const ChannelItem = ({channel, onClick, currentUserId, priceMap}) => {
  const lastMessageTime = channel.lastMessageAt
    ? formatDistanceToNow(new Date(channel.lastMessageAt), {
        addSuffix: true,
        locale: tr,
      })
    : '';

  let channelName = channel.name;
  let channelThumbnail = channel.thumbnail;

  if (channel.type === 'private' && currentUserId) {
    if (
      (channel.privateUser1?.id || channel.privateUser1?._id) === currentUserId
    ) {
      channelName = channel.privateUser2?.fullname || 'Bilinmeyen Kullanıcı';
      channelThumbnail = channel.privateUser2?.thumbnail;
    } else if (
      (channel.privateUser2?.id || channel.privateUser2?._id) === currentUserId
    ) {
      channelName = channel.privateUser1?.fullname || 'Bilinmeyen Kullanıcı';
      channelThumbnail = channel.privateUser1?.thumbnail;
    }
  }

  const displayPrice =
    (channel.marketCode && priceMap?.[channel.marketCode]) ||
    (channel.fundCode && priceMap?.[channel.fundCode]);

  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      p="4"
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{
        bg: 'gray.50',
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }}
      borderLeft="4px solid"
      borderLeftColor={
        channel.type === 'vip'
          ? 'purple.400'
          : channel.type === 'market'
            ? 'green.400'
            : channel.type === 'private'
              ? 'pink.400'
              : 'blue.400'
      }>
      <HStack spacing="4">
        <Avatar
          size="md"
          name={channelName}
          src={getCombinedLogoUrl(channelThumbnail)}
          bg={
            channel.type === 'vip'
              ? 'purple.100'
              : channel.type === 'market'
                ? 'green.100'
                : channel.type === 'private'
                  ? 'pink.100'
                  : 'blue.100'
          }
        />
        <Box flex="1" minW="0">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing="0" flex="1" minW="0">
              <HStack>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {channelName}
                </Text>
                {channel.type === 'vip' && (
                  <Badge colorScheme="purple" size="sm">
                    VIP
                  </Badge>
                )}
                {channel.type === 'market' && (
                  <Badge colorScheme="green" size="sm">
                    Market
                  </Badge>
                )}
                {channel.type === 'private' && (
                  <Badge colorScheme="pink" size="sm">
                    Kişisel
                  </Badge>
                )}
              </HStack>
              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                {channel.lastMessage || 'Henüz mesaj yok'}
              </Text>
            </VStack>
            <VStack align="end" spacing="1">
              <Text fontSize="xs" color="gray.400">
                {lastMessageTime}
              </Text>
              {displayPrice && (
                <Badge
                  colorScheme="green"
                  variant="solid"
                  fontSize="xs"
                  borderRadius="md"
                  px="2">
                  {displayPrice}
                </Badge>
              )}
              {channel.messageCount > 0 && (
                <Badge colorScheme="blue" borderRadius="full" px="2">
                  {channel.messageCount}
                </Badge>
              )}
            </VStack>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

const ChannelList = ({
  channels,
  isLoading,
  onChannelClick,
  emptyMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  totalCount,
  currentUserId,
  priceMap,
}) => {
  if (isLoading) {
    return (
      <Box textAlign="center" py="10">
        <Spinner size="lg" color="blue.500" />
        <Text mt="4" color="gray.500">
          Kanallar yükleniyor...
        </Text>
      </Box>
    );
  }

  if ((!channels || channels.length === 0) && !hasNextPage) {
    return (
      <Box textAlign="center" py="10">
        <Icon as={FiMessageCircle} boxSize="12" color="gray.300" />
        <Text mt="4" color="gray.500">
          {emptyMessage || 'Kanal bulunamadı'}
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing="3" align="stretch">
      {/* Channel count info */}
      <HStack justify="space-between" px="2" mb="2">
        <Text fontSize="sm" color="gray.500">
          {channels.length} / {totalCount || channels.length} kanal gösteriliyor
        </Text>
      </HStack>

      {channels.map(channel => (
        <ChannelItem
          key={channel.id || channel._id}
          channel={channel}
          onClick={() => onChannelClick(channel)}
          currentUserId={currentUserId}
          priceMap={priceMap}
        />
      ))}

      {/* Load More Button */}
      {hasNextPage && (
        <Box textAlign="center" pt="4">
          <Button
            onClick={onLoadMore}
            isLoading={isFetchingNextPage}
            loadingText="Yükleniyor..."
            variant="outline"
            colorScheme="blue"
            size="md"
            leftIcon={<Icon as={FiChevronDown} />}>
            Daha Fazla Yükle
          </Button>
        </Box>
      )}

      {/* All loaded message */}
      {!hasNextPage && channels.length > 0 && totalCount > PAGE_SIZE && (
        <Box textAlign="center" py="4">
          <Text fontSize="sm" color="gray.400">
            — Tüm kanallar yüklendi ({channels.length}) —
          </Text>
        </Box>
      )}
    </VStack>
  );
};

const SORT_OPTIONS = {
  MOST_MESSAGES: 'most_messages',
  MOST_MEMBERS: 'most_members',
  RECENT_MESSAGE: 'recent_message',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  RISING: 'rising',
  FALLING: 'falling',
};

const PAGE_SIZE = 50;

const Channels = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.MOST_MESSAGES);
  const [tabIndex, setTabIndex] = useState(
    location.state?.initialTabIndex || 0,
  );

  useEffect(() => {
    if (location.state?.initialTabIndex !== undefined) {
      setTabIndex(location.state.initialTabIndex);
    }
  }, [location.state]);

  const user = useUserStore(state => state.user);
  const currentUserId = user?.id;

  // Counts for Tabs (Fetched separately to be always visible)
  const {data: vipCountData} = useQuery({
    queryKey: ['vip-channels-count'],
    queryFn: () => api.getVipChannels({limit: 1}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const {data: viopCountData} = useQuery({
    queryKey: ['viop-markets-count'],
    queryFn: () =>
      api.getMarkets({type: 'viop', limit: 1}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const {data: commodityCountData} = useQuery({
    queryKey: ['commodity-markets-count'],
    queryFn: () =>
      api.getMarkets({type: 'commodity', limit: 1}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const {data: cryptoCountData} = useQuery({
    queryKey: ['crypto-markets-count'],
    queryFn: () =>
      api.getMarkets({type: 'crypto', limit: 1}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const {data: stockCountData} = useQuery({
    queryKey: ['stock-markets-count'],
    queryFn: () =>
      api.getMarkets({type: 'stock', limit: 1}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const {data: fundCountData} = useQuery({
    queryKey: ['funds-count'],
    queryFn: () => api.getFunds({limit: 1}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const {data: privateCountData} = useQuery({
    queryKey: ['private-channels-count'],
    queryFn: () =>
      api.getJoinedChannels({limit: 1, type: 'private'}).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all channels with pagination
  const {
    data: allChannelsPages,
    isLoading: isLoadingAll,
    fetchNextPage: fetchNextAllChannels,
    hasNextPage: hasNextAllChannels,
    isFetchingNextPage: isFetchingNextAllChannels,
  } = useInfiniteQuery({
    queryKey: ['all-channels-messaging'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getAllChannels({limit: PAGE_SIZE, page: pageParam});
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true, // Always fetch active channels
  });

  // Fetch VIP channels with pagination
  const {
    data: vipChannelsPages,
    isLoading: isLoadingVip,
    fetchNextPage: fetchNextVipChannels,
    hasNextPage: hasNextVipChannels,
    isFetchingNextPage: isFetchingNextVipChannels,
  } = useInfiniteQuery({
    queryKey: ['vip-channels-messaging'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getVipChannels({limit: PAGE_SIZE, page: pageParam});
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 6,
  });

  // Fetch VİOP Markets
  const {
    data: viopPages,
    isLoading: isLoadingViop,
    fetchNextPage: fetchNextViop,
    hasNextPage: hasNextViop,
    isFetchingNextPage: isFetchingNextViop,
  } = useInfiniteQuery({
    queryKey: ['viop-markets'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'viop',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  const {
    data: commodityPages,
    isLoading: isLoadingCommodity,
    fetchNextPage: fetchNextCommodity,
    hasNextPage: hasNextCommodity,
    isFetchingNextPage: isFetchingNextCommodity,
  } = useInfiniteQuery({
    queryKey: ['commodity-markets'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'commodity',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  const {
    data: cryptoPages,
    isLoading: isLoadingCrypto,
    fetchNextPage: fetchNextCrypto,
    hasNextPage: hasNextCrypto,
    isFetchingNextPage: isFetchingNextCrypto,
  } = useInfiniteQuery({
    queryKey: ['crypto-markets'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'crypto',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  const {
    data: stockPages,
    isLoading: isLoadingStock,
    fetchNextPage: fetchNextStock,
    hasNextPage: hasNextStock,
    isFetchingNextPage: isFetchingNextStock,
  } = useInfiniteQuery({
    queryKey: ['stock-markets'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'stock',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  // Fetch Funds
  const {
    data: fundPages,
    isLoading: isLoadingFunds,
    fetchNextPage: fetchNextFunds,
    hasNextPage: hasNextFunds,
    isFetchingNextPage: isFetchingNextFunds,
  } = useInfiniteQuery({
    queryKey: ['funds-list'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getFunds({limit: PAGE_SIZE, page: pageParam});
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });

  // Fetch Private Channels
  const {
    data: privateChannelsPages,
    isLoading: isLoadingPrivate,
    fetchNextPage: fetchNextPrivate,
    hasNextPage: hasNextPrivate,
    isFetchingNextPage: isFetchingNextPrivate,
  } = useInfiniteQuery({
    queryKey: ['private-channels-messaging'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getJoinedChannels({
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 7,
  });

  // Flatten paginated data
  const allChannelsData = React.useMemo(() => {
    if (!allChannelsPages?.pages) return [];
    return allChannelsPages.pages.flatMap(page => page.results || []);
  }, [allChannelsPages]);

  const vipChannelsData = React.useMemo(() => {
    if (!vipChannelsPages?.pages) return [];
    return vipChannelsPages.pages.flatMap(page => page.results || []);
  }, [vipChannelsPages]);

  const viopMarketsData = React.useMemo(() => {
    if (!viopPages?.pages) return [];
    return viopPages.pages.flatMap(page => page.results || []);
  }, [viopPages]);

  const commodityMarketsData = React.useMemo(() => {
    if (!commodityPages?.pages) return [];
    return commodityPages.pages.flatMap(page => page.results || []);
  }, [commodityPages]);

  const cryptoMarketsData = React.useMemo(() => {
    if (!cryptoPages?.pages) return [];
    return cryptoPages.pages.flatMap(page => page.results || []);
  }, [cryptoPages]);

  const stockMarketsData = React.useMemo(() => {
    if (!stockPages?.pages) return [];
    return stockPages.pages.flatMap(page => page.results || []);
  }, [stockPages]);

  const fundsData = React.useMemo(() => {
    if (!fundPages?.pages) return [];
    return fundPages.pages.flatMap(page => page.results || []);
  }, [fundPages]);

  const privateChannelsData = React.useMemo(() => {
    if (!privateChannelsPages?.pages) return [];
    return privateChannelsPages.pages
      .flatMap(page => page.results || [])
      .filter(c => c.type === 'private');
  }, [privateChannelsPages]);

  // Calculate Rate Map (Change Percentage)
  const rateMap = useMemo(() => {
    const map = {};

    const addToMap = (items, isFund = false) => {
      if (!items) return;
      items.forEach(item => {
        if (item.code) {
          // For funds use dailyReturn, for markets use rate
          const rate = isFund ? item.dailyReturn : item.rate;
          if (rate !== undefined && rate !== null) {
            map[item.code] = rate;
          }
        }
      });
    };

    addToMap(stockMarketsData);
    addToMap(viopMarketsData);
    addToMap(commodityMarketsData);
    addToMap(cryptoMarketsData);
    addToMap(fundsData, true);

    return map;
  }, [
    stockMarketsData,
    viopMarketsData,
    commodityMarketsData,
    cryptoMarketsData,
    fundsData,
  ]);

  const priceMap = useMemo(() => {
    const map = {};

    const addToMap = items => {
      if (!items) return;
      items.forEach(item => {
        if (item.code && item.price !== undefined) {
          // Format price based on type or magnitude if needed
          // For now, simple appending of TL or USD could be done, but let's just show the number or assume TL
          // Most markets in this context seem to be TR based (BIST, TEFAS), Crypto might be USD?
          // Let's just store the value for now.
          // Actually, looking at mobile app behavior might be good, but user said "yahoo finance gibi apilerden alıyor".
          // Let's assume the price comes as a number and we format it.

          let formattedPrice = item.price;

          // Basic formatting
          if (typeof item.price === 'number') {
            formattedPrice = item.price.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }

          map[item.code] = `${formattedPrice} TL`; // Defaulting to TL as requested "fiyat gösterelim" context implies local usage usually.
          // If crypto is USD, we might need to check item type.
          // But 'crypto' usually implies USD or USDT.
          // Let's check if item has currency info.
        }
      });
    };

    addToMap(stockMarketsData);
    addToMap(viopMarketsData);
    addToMap(commodityMarketsData);
    addToMap(fundsData);

    // Crypto might need special handling if it's USD
    if (cryptoMarketsData) {
      cryptoMarketsData.forEach(item => {
        if (item.code && item.price !== undefined) {
          let formattedPrice = item.price;
          if (typeof item.price === 'number') {
            formattedPrice = item.price.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            });
          }
          map[item.code] = `$${formattedPrice}`;
        }
      });
    }

    return map;
  }, [
    stockMarketsData,
    cryptoMarketsData,
    viopMarketsData,
    commodityMarketsData,
    fundsData,
  ]);

  // Merge VİOP markets with existing channels
  const mergedViopChannels = React.useMemo(() => {
    return viopMarketsData.map(market => {
      const existingChannel = allChannelsData.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;

      return {
        id: null, // No channel ID yet
        name: market.name,
        marketCode: market.code,
        type: 'market',
        thumbnail: null, // Market might not have thumbnail in this response
        lastMessage: 'Kanalı başlatmak için tıklayın',
        lastMessageAt: null,
        messageCount: 0,
        isVirtual: true, // Flag to indicate this needs initiation
      };
    });
  }, [viopMarketsData, allChannelsData]);

  const mergedCommodityChannels = React.useMemo(() => {
    return commodityMarketsData.map(market => {
      const existingChannel = allChannelsData.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        thumbnail: market.logo || null,
        lastMessage: 'Kanalı başlatmak için tıklayın',
        lastMessageAt: null,
        messageCount: 0,
        isVirtual: true,
      };
    });
  }, [commodityMarketsData, allChannelsData]);

  const mergedCryptoChannels = React.useMemo(() => {
    return cryptoMarketsData.map(market => {
      const existingChannel = allChannelsData.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        thumbnail: market.logo || null,
        lastMessage: 'Kanalı başlatmak için tıklayın',
        lastMessageAt: null,
        messageCount: 0,
        isVirtual: true,
      };
    });
  }, [cryptoMarketsData, allChannelsData]);

  const mergedStockChannels = React.useMemo(() => {
    return stockMarketsData.map(market => {
      const existingChannel = allChannelsData.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        thumbnail: market.logo || null,
        lastMessage: 'Kanalı başlatmak için tıklayın',
        lastMessageAt: null,
        messageCount: 0,
        isVirtual: true,
      };
    });
  }, [stockMarketsData, allChannelsData]);

  // Merge Funds with existing channels
  const mergedFundChannels = React.useMemo(() => {
    return fundsData.map(fund => {
      const existingChannel = allChannelsData.find(
        c => c.fundCode === fund.code,
      );
      if (existingChannel) return existingChannel;

      return {
        id: null,
        name: fund.name,
        fundCode: fund.code,
        type: 'fund',
        thumbnail: null,
        lastMessage: 'Kanalı başlatmak için tıklayın',
        lastMessageAt: null,
        messageCount: 0,
        isVirtual: true,
      };
    });
  }, [fundsData, allChannelsData]);

  // Get total counts (Prioritize count queries, fall back to list queries if active)
  const totalVipChannels =
    vipCountData?.totalResults ||
    vipChannelsPages?.pages?.[0]?.totalResults ||
    0;
  const totalViopResults =
    viopCountData?.totalResults || viopPages?.pages?.[0]?.totalResults || 0;
  const totalCommodityResults =
    commodityCountData?.totalResults ||
    commodityPages?.pages?.[0]?.totalResults ||
    0;
  const totalCryptoResults =
    cryptoCountData?.totalResults || cryptoPages?.pages?.[0]?.totalResults || 0;
  const totalStockResults =
    stockCountData?.totalResults || stockPages?.pages?.[0]?.totalResults || 0;
  const totalFundResults =
    fundCountData?.total || fundPages?.pages?.[0]?.total || 0; // funds usually use 'total' instead of 'totalResults' in some APIs, checking usage
  const totalPrivateResults =
    privateCountData?.totalResults ||
    privateChannelsPages?.pages?.[0]?.totalResults ||
    0;

  const totalAllCombinedCount =
    (totalStockResults || 0) +
    (totalCryptoResults || 0) +
    (totalViopResults || 0) +
    (totalCommodityResults || 0) +
    (totalFundResults || 0) +
    (totalVipChannels || 0);

  const handleChannelClick = async channel => {
    if (channel.id) {
      navigate(`/dashboard/messaging/channels/${channel.id}`);
    } else if (channel.isVirtual) {
      try {
        let res;
        if (channel.type === 'market') {
          res = await api.initiateMarketChannel(channel.marketCode);
        } else if (channel.type === 'fund') {
          res = await api.initiateFundChannel(channel.fundCode);
        }

        if (res?.data?.id) {
          navigate(`/dashboard/messaging/channels/${res.data.id}`);
        }
      } catch (error) {
        console.error('Failed to initiate channel:', error);
        // You might want to show a toast here
      }
    }
  };

  // Filter and sort channels based on search query and selected sort option
  const filterAndSortChannels = channels => {
    let filtered = channels || [];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort based on selected option
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.MOST_MESSAGES:
          // Sort by message count (highest first)
          const countDiff = (b.messageCount || 0) - (a.messageCount || 0);
          if (countDiff !== 0) return countDiff;
          // Tie-breaker: most recent message
          const dateA1 = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : 0;
          const dateB1 = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : 0;
          return dateB1 - dateA1;

        case SORT_OPTIONS.MOST_MEMBERS:
          // Sort by member count (highest first)
          const memberDiff = (b.memberCount || 0) - (a.memberCount || 0);
          if (memberDiff !== 0) return memberDiff;
          return (b.messageCount || 0) - (a.messageCount || 0);

        case SORT_OPTIONS.RECENT_MESSAGE:
          // Sort by last message date (most recent first)
          const dateA2 = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : 0;
          const dateB2 = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : 0;
          return dateB2 - dateA2;

        case SORT_OPTIONS.NAME_ASC:
          // Sort by name A-Z
          return `${a.name ?? ''}`.localeCompare(`${b.name ?? ''}`, 'tr');

        case SORT_OPTIONS.NAME_DESC:
          // Sort by name Z-A
          return `${b.name ?? ''}`.localeCompare(`${a.name ?? ''}`, 'tr');

        case SORT_OPTIONS.RISING:
          // Sort by rate descending (Highest first)
          const codeA1 = a.marketCode || a.fundCode;
          const codeB1 = b.marketCode || b.fundCode;
          const rateA1 = codeA1 ? rateMap[codeA1] || 0 : -999999;
          const rateB1 = codeB1 ? rateMap[codeB1] || 0 : -999999;
          return rateB1 - rateA1;

        case SORT_OPTIONS.FALLING:
          // Sort by rate ascending (Lowest first)
          const codeA2 = a.marketCode || a.fundCode;
          const codeB2 = b.marketCode || b.fundCode;
          const rateA2 = codeA2 ? rateMap[codeA2] || 0 : 999999;
          const rateB2 = codeB2 ? rateMap[codeB2] || 0 : 999999;
          return rateA2 - rateB2;

        default:
          return 0;
      }
    });
  };

  const stockChannels = filterAndSortChannels(mergedStockChannels);
  const cryptoChannels = filterAndSortChannels(mergedCryptoChannels);
  const viopChannels = filterAndSortChannels(mergedViopChannels); // Use merged list
  const commodityChannels = filterAndSortChannels(mergedCommodityChannels); // Use merged list
  const fundChannels = filterAndSortChannels(mergedFundChannels); // Use merged list
  const vipChannels = filterAndSortChannels(vipChannelsData);
  const privateChannels = filterAndSortChannels(privateChannelsData);
  const allCombined = React.useMemo(() => {
    // When on Tab 0 (All), we only want to show active channels to avoid performance issues
    // and clutter. If users want to see markets/funds, they should use specific tabs.
    // However, if we enabled other queries, we could merge them.
    // Given we disabled other queries on Tab 0, these arrays (mergedViopChannels etc) will be empty
    // except for what's already in allChannelsData.

    const map = new Map();
    const add = c => {
      const key = c.id
        ? `id:${c.id}`
        : c.type === 'market' && c.marketCode
          ? `market:${c.marketCode}`
          : c.type === 'fund' && c.fundCode
            ? `fund:${c.fundCode}`
            : `name:${c.name || ''}`;
      if (!map.has(key)) map.set(key, c);
    };
    (allChannelsData || []).forEach(add);
    // We can still try to add others if they exist (e.g. if we cached them), but primarily this will be allChannelsData
    (mergedViopChannels || []).forEach(add);
    (mergedCommodityChannels || []).forEach(add);
    (mergedFundChannels || []).forEach(add);
    (mergedCryptoChannels || []).forEach(add);
    return Array.from(map.values());
  }, [
    allChannelsData,
    mergedViopChannels,
    mergedFundChannels,
    mergedCryptoChannels,
    mergedCommodityChannels,
  ]);
  const allFiltered = filterAndSortChannels(allCombined);

  // Optimized for Tab 0: only track all-channels query
  const isLoadingAllCombined = isLoadingAll;
  const hasNextAllCombined = hasNextAllChannels;
  const isFetchingNextAllCombined = isFetchingNextAllChannels;
  const fetchNextAllCombined = fetchNextAllChannels;

  return (
    <Page>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Kanallar & Mesajlaşma
        </Text>
        <Text color="gray.500" mt="1">
          Kanallara girin ve mesajlaşın.
        </Text>
      </Box>

      {/* Search and Sort */}
      <HStack mb="6" spacing="4" flexWrap="wrap">
        <InputGroup size="lg" flex="1" minW="200px">
          <InputLeftElement>
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Kanal ara..."
            bg="white"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        <HStack
          spacing="2"
          bg="white"
          borderRadius="lg"
          px="3"
          py="2"
          boxShadow="sm">
          <Icon as={FiFilter} color="gray.500" />
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            size="md"
            border="none"
            bg="transparent"
            fontWeight="500"
            _focus={{boxShadow: 'none'}}
            minW="180px">
            <option value={SORT_OPTIONS.MOST_MESSAGES}>📊 En Çok Mesaj</option>
            <option value={SORT_OPTIONS.MOST_MEMBERS}>👥 En Çok Üye</option>
            <option value={SORT_OPTIONS.RECENT_MESSAGE}>🕐 En Son Mesaj</option>
            <option value={SORT_OPTIONS.NAME_ASC}>🔤 İsim (A-Z)</option>
            <option value={SORT_OPTIONS.NAME_DESC}>🔤 İsim (Z-A)</option>
            <option value={SORT_OPTIONS.RISING}>📈 Yükselenler</option>
            <option value={SORT_OPTIONS.FALLING}>📉 Düşenler</option>
          </Select>
        </HStack>
      </HStack>

      {/* Tabs */}
      <Box bg="white" borderRadius="xl" boxShadow="md" p="4">
        <Tabs
          variant="soft-rounded"
          colorScheme="blue"
          index={tabIndex}
          onChange={setTabIndex}>
          <TabList mb="4" flexWrap="wrap" gap="2">
            <Tab>
              <HStack spacing="2">
                <Icon as={FiMessageCircle} />
                <Text>Tümü ({totalAllCombinedCount || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiTrendingUp} />
                <Text>
                  Borsa ({totalStockResults || stockChannels?.length || 0})
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiCpu} />
                <Text>
                  Kripto ({totalCryptoResults || cryptoChannels?.length || 0})
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiActivity} />
                <Text>
                  VİOP ({totalViopResults || viopChannels?.length || 0})
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiLayers} />
                <Text>
                  Emtia (
                  {totalCommodityResults ||
                    mergedCommodityChannels?.length ||
                    0}
                  )
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiPieChart} />
                <Text>
                  Fonlar ({totalFundResults || fundChannels?.length || 0})
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiStar} />
                <Text>
                  VIP ({totalVipChannels || vipChannels?.length || 0})
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiUser} />
                <Text>
                  Kişisel ({totalPrivateResults || privateChannels?.length || 0}
                  )
                </Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiUsers} />
                <Text>Arkadaşlar</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* All Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={allFiltered}
                isLoading={isLoadingAllCombined}
                onChannelClick={handleChannelClick}
                emptyMessage="Kanal bulunamadı"
                hasNextPage={hasNextAllCombined}
                isFetchingNextPage={isFetchingNextAllCombined}
                onLoadMore={fetchNextAllCombined}
                totalCount={totalAllCombinedCount}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* Stock Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={stockChannels}
                isLoading={isLoadingStock}
                onChannelClick={handleChannelClick}
                emptyMessage="Borsa kanalı bulunamadı"
                hasNextPage={hasNextStock}
                isFetchingNextPage={isFetchingNextStock}
                onLoadMore={fetchNextStock}
                totalCount={totalStockResults}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* Crypto Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={cryptoChannels}
                isLoading={isLoadingCrypto}
                onChannelClick={handleChannelClick}
                emptyMessage="Kripto kanalı bulunamadı"
                hasNextPage={hasNextCrypto}
                isFetchingNextPage={isFetchingNextCrypto}
                onLoadMore={fetchNextCrypto}
                totalCount={totalCryptoResults}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* VİOP Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={viopChannels}
                isLoading={isLoadingViop}
                onChannelClick={handleChannelClick}
                emptyMessage="VİOP kanalı bulunamadı"
                hasNextPage={hasNextViop}
                isFetchingNextPage={isFetchingNextViop}
                onLoadMore={fetchNextViop}
                totalCount={totalViopResults}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* Commodity Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={commodityChannels}
                isLoading={isLoadingCommodity}
                onChannelClick={handleChannelClick}
                emptyMessage="Emtia kanalı bulunamadı"
                hasNextPage={hasNextCommodity}
                isFetchingNextPage={isFetchingNextCommodity}
                onLoadMore={fetchNextCommodity}
                totalCount={totalCommodityResults}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* Fund Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={fundChannels}
                isLoading={isLoadingFunds}
                onChannelClick={handleChannelClick}
                emptyMessage="Fon kanalı bulunamadı"
                hasNextPage={hasNextFunds}
                isFetchingNextPage={isFetchingNextFunds}
                onLoadMore={fetchNextFunds}
                totalCount={totalFundResults}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* VIP Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={vipChannels}
                isLoading={isLoadingVip}
                onChannelClick={handleChannelClick}
                emptyMessage="VIP kanal bulunamadı"
                hasNextPage={hasNextVipChannels}
                isFetchingNextPage={isFetchingNextVipChannels}
                onLoadMore={fetchNextVipChannels}
                totalCount={totalVipChannels}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* Private Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={privateChannels}
                isLoading={isLoadingPrivate}
                onChannelClick={handleChannelClick}
                emptyMessage="Kişisel mesaj bulunamadı"
                hasNextPage={hasNextPrivate}
                isFetchingNextPage={isFetchingNextPrivate}
                onLoadMore={fetchNextPrivate}
                totalCount={privateChannels?.length}
                currentUserId={currentUserId}
                priceMap={priceMap}
              />
            </TabPanel>

            {/* Friend Manager */}
            <TabPanel p="0">
              <FriendManager
                currentUserId={currentUserId}
                navigate={navigate}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Page>
  );
};

export default Channels;
