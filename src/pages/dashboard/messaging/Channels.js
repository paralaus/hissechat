import React, {useState} from 'react';
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
import {useInfiniteQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {FiSearch, FiMessageCircle, FiTrendingUp, FiStar, FiFilter, FiChevronDown, FiPieChart, FiActivity, FiCpu} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {formatDistanceToNow} from 'date-fns';
import {tr} from 'date-fns/locale';

const ChannelItem = ({channel, onClick}) => {
  const lastMessageTime = channel.lastMessageAt 
    ? formatDistanceToNow(new Date(channel.lastMessageAt), {addSuffix: true, locale: tr})
    : '';

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
      borderLeftColor={channel.type === 'vip' ? 'purple.400' : channel.type === 'market' ? 'green.400' : 'blue.400'}
    >
      <HStack spacing="4">
        <Avatar
          size="md"
          name={channel.name}
          src={getCombinedLogoUrl(channel.thumbnail)}
          bg={channel.type === 'vip' ? 'purple.100' : channel.type === 'market' ? 'green.100' : 'blue.100'}
        />
        <Box flex="1" minW="0">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing="0" flex="1" minW="0">
              <HStack>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {channel.name}
                </Text>
                {channel.type === 'vip' && (
                  <Badge colorScheme="purple" size="sm">VIP</Badge>
                )}
                {channel.type === 'market' && (
                  <Badge colorScheme="green" size="sm">Market</Badge>
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
}) => {
  if (isLoading) {
    return (
      <Box textAlign="center" py="10">
        <Spinner size="lg" color="blue.500" />
        <Text mt="4" color="gray.500">Kanallar yükleniyor...</Text>
      </Box>
    );
  }

  if (!channels || channels.length === 0) {
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
          key={channel.id}
          channel={channel}
          onClick={() => onChannelClick(channel)}
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
  RECENT_MESSAGE: 'recent_message',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

const PAGE_SIZE = 50;

const Channels = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.MOST_MESSAGES);

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

  const fundsData = React.useMemo(() => {
    if (!fundPages?.pages) return [];
    return fundPages.pages.flatMap(page => page.results || []);
  }, [fundPages]);

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

  // Get total counts
  const totalAllChannels = allChannelsPages?.pages?.[0]?.totalResults || 0;
  const totalVipChannels = vipChannelsPages?.pages?.[0]?.totalResults || 0;
  const totalViopResults = viopPages?.pages?.[0]?.totalResults || 0;
  const totalCryptoResults = cryptoPages?.pages?.[0]?.totalResults || 0;
  const totalFundResults = fundPages?.pages?.[0]?.totalResults || 0;

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

  const stockChannels = filterAndSortChannels(allChannelsData?.filter(isStock));
  const cryptoChannels = filterAndSortChannels(mergedCryptoChannels);
  const viopChannels = filterAndSortChannels(mergedViopChannels); // Use merged list
  const fundChannels = filterAndSortChannels(mergedFundChannels); // Use merged list
  const vipChannels = filterAndSortChannels(vipChannelsData);
  const otherChannels = filterAndSortChannels(allChannelsData?.filter(c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund'));
  const allCombined = React.useMemo(() => {
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
    (mergedViopChannels || []).forEach(add);
    (mergedFundChannels || []).forEach(add);
    (mergedCryptoChannels || []).forEach(add);
    return Array.from(map.values());
  }, [allChannelsData, mergedViopChannels, mergedFundChannels, mergedCryptoChannels]);
  const allFiltered = filterAndSortChannels(allCombined);

  const isLoadingAllCombined = isLoadingAll || isLoadingViop || isLoadingFunds || isLoadingCrypto;
  const hasNextAllCombined = hasNextAllChannels || hasNextViop || hasNextFunds || hasNextCrypto;
  const isFetchingNextAllCombined =
    isFetchingNextAllChannels || isFetchingNextViop || isFetchingNextFunds || isFetchingNextCrypto;
  const fetchNextAllCombined = () => {
    if (hasNextAllChannels) fetchNextAllChannels();
    if (hasNextViop) fetchNextViop();
    if (hasNextFunds) fetchNextFunds();
    if (hasNextCrypto) fetchNextCrypto();
  };

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
            <option value={SORT_OPTIONS.RECENT_MESSAGE}>🕐 En Son Mesaj</option>
            <option value={SORT_OPTIONS.NAME_ASC}>🔤 İsim (A-Z)</option>
            <option value={SORT_OPTIONS.NAME_DESC}>🔤 İsim (Z-A)</option>
          </Select>
        </HStack>
      </HStack>

      {/* Tabs */}
      <Box bg="white" borderRadius="xl" boxShadow="md" p="4">
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb="4" flexWrap="wrap" gap="2">
            <Tab>
              <HStack spacing="2">
                <Icon as={FiMessageCircle} />
                <Text>Tümü ({allCombined?.length || totalAllChannels || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiTrendingUp} />
                <Text>Borsa ({stockChannels?.length || 0})</Text>
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
                totalCount={allCombined?.length || 0}
              />
            </TabPanel>

            {/* Stock Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={stockChannels}
                isLoading={isLoadingAll}
                onChannelClick={handleChannelClick}
                emptyMessage="Borsa kanalı bulunamadı"
                hasNextPage={hasNextAllChannels}
                isFetchingNextPage={isFetchingNextAllChannels}
                onLoadMore={fetchNextAllChannels}
                totalCount={stockChannels?.length}
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
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Page>
  );
};

export default Channels;
