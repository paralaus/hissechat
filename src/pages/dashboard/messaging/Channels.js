import React, {useState, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
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
import {FiSearch, FiMessageCircle, FiTrendingUp, FiStar, FiFilter, FiChevronDown, FiPieChart, FiActivity, FiCpu, FiUser} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {formatDistanceToNow} from 'date-fns';
import {tr} from 'date-fns/locale';
import {useUserStore} from '../../../store';

const ChannelItem = ({channel, onClick, currentUserId, price}) => {
  const lastMessageTime = channel.lastMessageAt 
    ? formatDistanceToNow(new Date(channel.lastMessageAt), {addSuffix: true, locale: tr})
    : '';

  let channelName = channel.name;
  let channelThumbnail = channel.thumbnail;

  if (channel.type === 'private' && currentUserId) {
    if ((channel.privateUser1?.id || channel.privateUser1?._id) === currentUserId) {
      channelName = channel.privateUser2?.fullname || 'Bilinmeyen Kullanıcı';
      channelThumbnail = channel.privateUser2?.thumbnail;
    } else if ((channel.privateUser2?.id || channel.privateUser2?._id) === currentUserId) {
      channelName = channel.privateUser1?.fullname || 'Bilinmeyen Kullanıcı';
      channelThumbnail = channel.privateUser1?.thumbnail;
    }
  }

  const displayPrice = price || channel.subscribeText;

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
      borderLeftColor={channel.type === 'vip' ? 'purple.400' : channel.type === 'market' ? 'green.400' : channel.type === 'private' ? 'pink.400' : 'blue.400'}
    >
      <HStack spacing="4">
        <Avatar
          size="md"
          name={channelName}
          src={getCombinedLogoUrl(channelThumbnail)}
          bg={channel.type === 'vip' ? 'purple.100' : channel.type === 'market' ? 'green.100' : channel.type === 'private' ? 'pink.100' : 'blue.100'}
        />
        <Box flex="1" minW="0">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing="0" flex="1" minW="0">
              <HStack>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {channelName}
                </Text>
                {channel.type === 'vip' && (
                  <Badge colorScheme="purple" size="sm">VIP</Badge>
                )}
                {channel.type === 'market' && (
                  <Badge colorScheme="green" size="sm">Market</Badge>
                )}
                {channel.type === 'private' && (
                  <Badge colorScheme="pink" size="sm">Kişisel</Badge>
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
                <Badge colorScheme="green" variant="solid" fontSize="xs" borderRadius="md" px="2">
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
        <Text mt="4" color="gray.500">Kanallar yükleniyor...</Text>
      </Box>
    );
  }

  if ((!channels || channels.length === 0) && !hasNextPage) {
    return (
      <Box textAlign="center" py="10">
        <Icon as={FiMessageCircle} boxSize="12" color="gray.300" />
        <Text mt="4" color="gray.500">{emptyMessage || 'Kanal bulunamadı'}</Text>
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

      {channels.map((channel) => (
        <ChannelItem
          key={channel.id || channel._id}
          channel={channel}
          onClick={() => onChannelClick(channel)}
          currentUserId={currentUserId}
          price={priceMap?.[channel.id || channel._id]}
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
            leftIcon={<Icon as={FiChevronDown} />}
          >
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
};

const PAGE_SIZE = 50;

const Channels = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.MOST_MESSAGES);
  const [tabIndex, setTabIndex] = useState(0);

  const user = useUserStore((state) => state.user);
  const currentUserId = user?.id;

  // Counts for Tabs (Fetched separately to be always visible)
  const { data: vipCountData } = useQuery({
    queryKey: ['vip-channels-count'],
    queryFn: () => api.getVipChannels({ limit: 1 }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: viopCountData } = useQuery({
    queryKey: ['viop-markets-count'],
    queryFn: () => api.getMarkets({ type: 'viop', limit: 1 }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cryptoCountData } = useQuery({
    queryKey: ['crypto-markets-count'],
    queryFn: () => api.getMarkets({ type: 'crypto', limit: 1 }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: stockCountData } = useQuery({
    queryKey: ['stock-markets-count'],
    queryFn: () => api.getMarkets({ type: 'stock', limit: 1 }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: fundCountData } = useQuery({
    queryKey: ['funds-count'],
    queryFn: () => api.getFunds({ limit: 1 }).then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active products for prices
  const {data: productsData} = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts({limit: 1000}), // Fetch all products
    select: (res) => res.data,
  });

  const channelPriceMap = useMemo(() => {
    const map = {};
    if (productsData?.results) {
      productsData.results.forEach(product => {
        if (product.channel) {
          const channelId = typeof product.channel === 'string' 
            ? product.channel 
            : (product.channel.id || product.channel._id);
          
          if (product.subscribeText) {
             map[channelId] = product.subscribeText;
          } else if (product.price) {
             map[channelId] = `${product.price} TL`;
          }
        }
      });
    }
    return map;
  }, [productsData]);


  // Fetch all channels with pagination
  const {
    data: allChannelsPages,
    isLoading: isLoadingAll,
    fetchNextPage: fetchNextAllChannels,
    hasNextPage: hasNextAllChannels,
    isFetchingNextPage: isFetchingNextAllChannels,
  } = useInfiniteQuery({
    queryKey: ['all-channels-messaging'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getAllChannels({ limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
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
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getVipChannels({ limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 5,
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
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getMarkets({ type: 'viop', limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 3,
  });

  const {
    data: cryptoPages,
    isLoading: isLoadingCrypto,
    fetchNextPage: fetchNextCrypto,
    hasNextPage: hasNextCrypto,
    isFetchingNextPage: isFetchingNextCrypto,
  } = useInfiniteQuery({
    queryKey: ['crypto-markets'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getMarkets({ type: 'crypto', limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 2,
  });

  const {
    data: stockPages,
    isLoading: isLoadingStock,
    fetchNextPage: fetchNextStock,
    hasNextPage: hasNextStock,
    isFetchingNextPage: isFetchingNextStock,
  } = useInfiniteQuery({
    queryKey: ['stock-markets'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getMarkets({ type: 'stock', limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 1,
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
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getFunds({ limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 4,
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
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getJoinedChannels({ limit: PAGE_SIZE, page: pageParam });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: tabIndex === 6,
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
    return privateChannelsPages.pages.flatMap(page => page.results || []).filter(c => c.type === 'private');
  }, [privateChannelsPages]);

  // Merge VİOP markets with existing channels
  const mergedViopChannels = React.useMemo(() => {
    return viopMarketsData.map(market => {
      const existingChannel = allChannelsData.find(c => c.marketCode === market.code);
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

  const mergedCryptoChannels = React.useMemo(() => {
    return cryptoMarketsData.map(market => {
      const existingChannel = allChannelsData.find(c => c.marketCode === market.code);
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
      const existingChannel = allChannelsData.find(c => c.marketCode === market.code);
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
      const existingChannel = allChannelsData.find(c => c.fundCode === fund.code);
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
  const totalVipChannels = vipCountData?.totalResults || vipChannelsPages?.pages?.[0]?.totalResults || 0;
  const totalViopResults = viopCountData?.totalResults || viopPages?.pages?.[0]?.totalResults || 0;
  const totalCryptoResults = cryptoCountData?.totalResults || cryptoPages?.pages?.[0]?.totalResults || 0;
  const totalStockResults = stockCountData?.totalResults || stockPages?.pages?.[0]?.totalResults || 0;
  const totalFundResults = fundCountData?.total || fundPages?.pages?.[0]?.total || 0; // funds usually use 'total' instead of 'totalResults' in some APIs, checking usage
  
  // For 'All', we sum them up or use list count if available
  const totalAllChannels = allChannelsPages?.pages?.[0]?.totalResults || 0; // This is 'My Channels' count
  
  const totalAllCombinedCount =
    (totalStockResults || 0) +
    (totalCryptoResults || 0) +
    (totalViopResults || 0) +
    (totalFundResults || 0) +
    (totalVipChannels || 0);

  const handleChannelClick = async (channel) => {
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
  const filterAndSortChannels = (channels) => {
    let filtered = channels || [];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
          const dateA1 = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB1 = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB1 - dateA1;

        case SORT_OPTIONS.MOST_MEMBERS:
          // Sort by member count (highest first)
          const memberDiff = (b.memberCount || 0) - (a.memberCount || 0);
          if (memberDiff !== 0) return memberDiff;
          return (b.messageCount || 0) - (a.messageCount || 0);
          
        case SORT_OPTIONS.RECENT_MESSAGE:
          // Sort by last message date (most recent first)
          const dateA2 = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB2 = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB2 - dateA2;
          
        case SORT_OPTIONS.NAME_ASC:
          // Sort by name A-Z
          return (a.name || '').localeCompare(b.name || '', 'tr');
          
        case SORT_OPTIONS.NAME_DESC:
          // Sort by name Z-A
          return (b.name || '').localeCompare(a.name || '', 'tr');
          
        default:
          return 0;
      }
    });
  };

  // Separate channels by type and sort by message count
  // We use the fetched and merged lists for VIOP and Funds now
  const isCrypto = (c) => c.type === 'market' && c.category === 'kripto';
  // Note: isViop check is less critical for the tab now as we use direct fetch, but good for "Others" exclusion
  const isViop = (c) => c.type === 'market' && (c.marketCode?.startsWith('F_') || c.name?.toUpperCase().includes('VİOP') || c.marketCode?.includes('VIOP'));
  const isFund = (c) => c.type === 'fund';
  const isStock = (c) => c.type === 'market' && !isViop(c) && !isCrypto(c);

  const stockChannels = filterAndSortChannels(mergedStockChannels);
  const cryptoChannels = filterAndSortChannels(mergedCryptoChannels);
  const viopChannels = filterAndSortChannels(mergedViopChannels); // Use merged list
  const fundChannels = filterAndSortChannels(mergedFundChannels); // Use merged list
  const vipChannels = filterAndSortChannels(vipChannelsData);
  const privateChannels = filterAndSortChannels(privateChannelsData);
  const otherChannels = filterAndSortChannels(allChannelsData?.filter(c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund'));
  const allCombined = React.useMemo(() => {
    // When on Tab 0 (All), we only want to show active channels to avoid performance issues
    // and clutter. If users want to see markets/funds, they should use specific tabs.
    // However, if we enabled other queries, we could merge them.
    // Given we disabled other queries on Tab 0, these arrays (mergedViopChannels etc) will be empty
    // except for what's already in allChannelsData.
    
    const map = new Map();
    const add = (c) => {
      const key =
        c.id
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
    (mergedFundChannels || []).forEach(add);
    (mergedCryptoChannels || []).forEach(add);
    return Array.from(map.values());
  }, [allChannelsData, mergedViopChannels, mergedFundChannels, mergedCryptoChannels]);
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <HStack spacing="2" bg="white" borderRadius="lg" px="3" py="2" boxShadow="sm">
          <Icon as={FiFilter} color="gray.500" />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="md"
            border="none"
            bg="transparent"
            fontWeight="500"
            _focus={{ boxShadow: 'none' }}
            minW="180px"
          >
            <option value={SORT_OPTIONS.MOST_MESSAGES}>📊 En Çok Mesaj</option>
            <option value={SORT_OPTIONS.MOST_MEMBERS}>👥 En Çok Üye</option>
            <option value={SORT_OPTIONS.RECENT_MESSAGE}>🕐 En Son Mesaj</option>
            <option value={SORT_OPTIONS.NAME_ASC}>🔤 İsim (A-Z)</option>
            <option value={SORT_OPTIONS.NAME_DESC}>🔤 İsim (Z-A)</option>
          </Select>
        </HStack>
      </HStack>

      {/* Tabs */}
      <Box bg="white" borderRadius="xl" boxShadow="md" p="4">
        <Tabs variant="soft-rounded" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
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
                <Text>Borsa ({totalStockResults || stockChannels?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiCpu} />
                <Text>Kripto ({totalCryptoResults || cryptoChannels?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiActivity} />
                <Text>VİOP ({totalViopResults || viopChannels?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiPieChart} />
                <Text>Fonlar ({totalFundResults || fundChannels?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiStar} />
                <Text>VIP ({totalVipChannels || vipChannels?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiUser} />
                <Text>Kişisel ({privateChannels?.length || 0})</Text>
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
                priceMap={channelPriceMap}
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
                priceMap={channelPriceMap}
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
                priceMap={channelPriceMap}
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
                priceMap={channelPriceMap}
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
                priceMap={channelPriceMap}
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
                priceMap={channelPriceMap}
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
                priceMap={channelPriceMap}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Page>
  );
};

export default Channels;
