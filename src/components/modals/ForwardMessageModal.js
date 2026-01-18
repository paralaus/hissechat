import React, {useState, useMemo} from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Badge,
  Spinner,
  Icon,
  Box,
  Button,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {
  FiSearch,
  FiSend,
  FiMessageCircle,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
  FiCpu,
} from 'react-icons/fi';
import {api} from '../../api'; // Adjust path as needed
import {getCombinedLogoUrl} from '../../utils/image'; // Adjust path as needed

const PAGE_SIZE = 50;

const ChannelItem = ({channel, onSelect, isSelected}) => {
  return (
    <Box
      onClick={() => onSelect(channel)}
      cursor="pointer"
      p="3"
      bg={isSelected ? 'blue.50' : 'white'}
      borderRadius="md"
      border="1px solid"
      borderColor={isSelected ? 'blue.400' : 'gray.100'}
      transition="all 0.2s"
      _hover={{
        bg: 'gray.50',
      }}
      mb="2">
      <HStack spacing="3">
        <Avatar
          size="sm"
          name={channel.name}
          src={getCombinedLogoUrl(channel.thumbnail)}
          bg={
            channel.type === 'vip'
              ? 'purple.100'
              : channel.type === 'market'
                ? 'green.100'
                : 'blue.100'
          }
        />
        <Box flex="1" minW="0">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing="0" flex="1" minW="0">
              <HStack>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {channel.name}
                </Text>
                {channel.type === 'vip' && (
                  <Badge colorScheme="purple" size="xs">
                    VIP
                  </Badge>
                )}
                {channel.type === 'market' && (
                  <Badge colorScheme="green" size="xs">
                    Market
                  </Badge>
                )}
                {channel.type === 'fund' && (
                  <Badge colorScheme="orange" size="xs">
                    Fon
                  </Badge>
                )}
              </HStack>
              {channel.isVirtual && (
                <Text fontSize="xs" color="gray.400">
                  Başlatmak için seçin
                </Text>
              )}
            </VStack>
            {isSelected && <Icon as={FiSend} color="blue.500" />}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

const ChannelList = ({
  channels,
  isLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  onSelect,
  selectedChannel,
  emptyMessage,
}) => {
  if (isLoading && (!channels || channels.length === 0)) {
    return (
      <Box textAlign="center" py="4">
        <Spinner size="sm" />
      </Box>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <Text textAlign="center" color="gray.500" fontSize="sm" py="4">
        {emptyMessage || 'Kanal bulunamadı'}
      </Text>
    );
  }

  return (
    <VStack spacing="0" align="stretch" maxH="400px" overflowY="auto" pb="2">
      {channels.map(channel => {
        // Unique key generation
        const key =
          channel.id ||
          (channel.type === 'market' ? channel.marketCode : channel.fundCode) ||
          channel.name;
        return (
          <ChannelItem
            key={key}
            channel={channel}
            isSelected={
              selectedChannel &&
              ((channel.id && selectedChannel.id === channel.id) ||
                (!channel.id &&
                  channel.marketCode &&
                  selectedChannel.marketCode === channel.marketCode) ||
                (!channel.id &&
                  channel.fundCode &&
                  selectedChannel.fundCode === channel.fundCode))
            }
            onSelect={onSelect}
          />
        );
      })}

      {hasNextPage && (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          w="full"
          mt="2">
          Daha fazla yükle
        </Button>
      )}
    </VStack>
  );
};

const ForwardMessageModal = ({isOpen, onClose, messageToForward}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();

  // --- 1. Fetch All Channels ---
  const {
    data: allChannelsPages,
    isLoading: isLoadingAll,
    fetchNextPage: fetchNextAllChannels,
    hasNextPage: hasNextAllChannels,
    isFetchingNextPage: isFetchingNextAllChannels,
  } = useInfiniteQuery({
    queryKey: ['channels-for-forward', searchQuery],
    queryFn: async ({pageParam = 1}) => {
      // API doesn't support search param for this endpoint yet, so we filter client side
      const params = {limit: PAGE_SIZE, page: pageParam};
      const res = await api.getAllChannels(params);
      return res.data;
    },
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isOpen,
  });

  // --- 2. Fetch VİOP ---
  const {
    data: viopPages,
    isLoading: isLoadingViop,
    fetchNextPage: fetchNextViop,
    hasNextPage: hasNextViop,
    isFetchingNextPage: isFetchingNextViop,
  } = useInfiniteQuery({
    queryKey: ['viop-markets-forward'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'viop',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isOpen,
  });

  // --- 3. Fetch Crypto ---
  const {
    data: cryptoPages,
    isLoading: isLoadingCrypto,
    fetchNextPage: fetchNextCrypto,
    hasNextPage: hasNextCrypto,
    isFetchingNextPage: isFetchingNextCrypto,
  } = useInfiniteQuery({
    queryKey: ['crypto-markets-forward'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'crypto',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isOpen,
  });

  // --- 4. Fetch Stocks ---
  const {
    data: stockPages,
    isLoading: isLoadingStock,
    fetchNextPage: fetchNextStock,
    hasNextPage: hasNextStock,
    isFetchingNextPage: isFetchingNextStock,
  } = useInfiniteQuery({
    queryKey: ['stock-markets-forward'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getMarkets({
        type: 'stock',
        limit: PAGE_SIZE,
        page: pageParam,
      });
      return res.data;
    },
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isOpen,
  });

  // --- 5. Fetch Funds ---
  const {
    data: fundPages,
    isLoading: isLoadingFunds,
    fetchNextPage: fetchNextFunds,
    hasNextPage: hasNextFunds,
    isFetchingNextPage: isFetchingNextFunds,
  } = useInfiniteQuery({
    queryKey: ['funds-list-forward'],
    queryFn: async ({pageParam = 1}) => {
      const res = await api.getFunds({limit: PAGE_SIZE, page: pageParam});
      return res.data;
    },
    getNextPageParam: lastPage =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isOpen,
  });

  // --- Data Processing & Merging ---
  const flatten = pages =>
    pages?.pages?.flatMap(page => page.results || page.channels || []) || [];

  const allChannelsData = useMemo(
    () => flatten(allChannelsPages),
    [allChannelsPages],
  );
  const viopMarketsData = useMemo(() => flatten(viopPages), [viopPages]);
  const cryptoMarketsData = useMemo(() => flatten(cryptoPages), [cryptoPages]);
  const stockMarketsData = useMemo(() => flatten(stockPages), [stockPages]);
  const fundsData = useMemo(() => flatten(fundPages), [fundPages]);

  // Helper to merge market data with existing channels
  const mergeChannels = (marketData, channels, type, codeKey) => {
    return marketData.map(item => {
      const existingChannel = channels.find(c => c[codeKey] === item.code);
      if (existingChannel) return existingChannel;

      return {
        id: null,
        name: item.name,
        [codeKey]: item.code,
        type: type,
        thumbnail: item.logo || null,
        isVirtual: true,
      };
    });
  };

  const mergedViopChannels = useMemo(
    () => mergeChannels(viopMarketsData, allChannelsData, 'market', 'marketCode'),
    [viopMarketsData, allChannelsData],
  );
  const mergedCryptoChannels = useMemo(
    () => mergeChannels(cryptoMarketsData, allChannelsData, 'market', 'marketCode'),
    [cryptoMarketsData, allChannelsData],
  );
  const mergedStockChannels = useMemo(
    () => mergeChannels(stockMarketsData, allChannelsData, 'market', 'marketCode'),
    [stockMarketsData, allChannelsData],
  );
  const mergedFundChannels = useMemo(
    () => mergeChannels(fundsData, allChannelsData, 'fund', 'fundCode'),
    [fundsData, allChannelsData],
  );

  // Combined List for "All" tab
  const allCombined = useMemo(() => {
    const map = new Map();
    const add = c => {
      const key = c.id
        ? `id:${c.id}`
        : c.type === 'market'
          ? `market:${c.marketCode}`
          : c.type === 'fund'
            ? `fund:${c.fundCode}`
            : `name:${c.name}`;
      if (!map.has(key)) map.set(key, c);
    };
    allChannelsData.forEach(add);
    mergedViopChannels.forEach(add);
    mergedFundChannels.forEach(add);
    mergedCryptoChannels.forEach(add);
    mergedStockChannels.forEach(add);
    return Array.from(map.values());
  }, [
    allChannelsData,
    mergedViopChannels,
    mergedFundChannels,
    mergedCryptoChannels,
    mergedStockChannels,
  ]);

  // Filter Logic
  const filterChannels = list => {
    if (!searchQuery) return list;
    return list.filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const displayedAll = filterChannels(allCombined);
  const displayedStock = filterChannels(mergedStockChannels);
  const displayedCrypto = filterChannels(mergedCryptoChannels);
  const displayedViop = filterChannels(mergedViopChannels);
  const displayedFunds = filterChannels(mergedFundChannels);

  // Pagination Handlers
  const fetchNextAllCombined = () => {
    if (hasNextAllChannels) fetchNextAllChannels();
    if (hasNextViop) fetchNextViop();
    if (hasNextFunds) fetchNextFunds();
    if (hasNextCrypto) fetchNextCrypto();
    if (hasNextStock) fetchNextStock();
  };

  const isLoadingCombined =
    isLoadingAll ||
    isLoadingViop ||
    isLoadingFunds ||
    isLoadingCrypto ||
    isLoadingStock;

  const handleSend = async () => {
    if (!selectedChannel || !messageToForward) return;

    try {
      setIsSending(true);
      let targetChannelId = selectedChannel.id || selectedChannel._id;

      // Initiate virtual channel if needed
      if (selectedChannel.isVirtual) {
        let res;
        if (selectedChannel.type === 'market') {
          res = await api.initiateMarketChannel(selectedChannel.marketCode);
        } else if (selectedChannel.type === 'fund') {
          res = await api.initiateFundChannel(selectedChannel.fundCode);
        }

        if (res?.data?.id) {
          targetChannelId = res.data.id;
        } else {
          throw new Error('Kanal oluşturulamadı');
        }
      }

      // Prepare message content
      const messageData = {
        text: messageToForward.text,
        image: messageToForward.image,
        video: messageToForward.video,
        audio: messageToForward.audio,
        file: messageToForward.file,
      };

      await api.sendChannelMessage(targetChannelId, messageData);

      toast({
        title: 'Mesaj iletildi',
        description: `Mesaj "${selectedChannel.name}" kanalına iletildi.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setSelectedChannel(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Forward error:', error);
      toast({
        title: 'İletme başarısız',
        description: error.message || 'Bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Mesajı İlet</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="6">
          {messageToForward && (
            <Box
              bg="gray.50"
              p="3"
              borderRadius="md"
              mb="4"
              borderLeft="3px solid"
              borderColor="blue.400">
              <Text fontSize="xs" color="gray.500" mb="1">
                İletilecek Mesaj:
              </Text>
              <Text fontSize="sm" noOfLines={3}>
                {messageToForward.text ||
                  (messageToForward.image ? '📷 Görsel' : '📎 Ek')}
              </Text>
            </Box>
          )}

          <InputGroup mb="4">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Kanal ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Tabs variant="soft-rounded" colorScheme="blue" size="sm" isLazy>
            <TabList
              mb="3"
              overflowX="auto"
              py="1"
              css={{'&::-webkit-scrollbar': {display: 'none'}}}>
              <Tab flexShrink={0}>
                <HStack>
                  <Icon as={FiMessageCircle} />
                  <Text>Tümü</Text>
                </HStack>
              </Tab>
              <Tab flexShrink={0}>
                <HStack>
                  <Icon as={FiTrendingUp} />
                  <Text>Borsa</Text>
                </HStack>
              </Tab>
              <Tab flexShrink={0}>
                <HStack>
                  <Icon as={FiCpu} />
                  <Text>Kripto</Text>
                </HStack>
              </Tab>
              <Tab flexShrink={0}>
                <HStack>
                  <Icon as={FiActivity} />
                  <Text>VİOP</Text>
                </HStack>
              </Tab>
              <Tab flexShrink={0}>
                <HStack>
                  <Icon as={FiPieChart} />
                  <Text>Fonlar</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px="0" py="0">
                <ChannelList
                  channels={displayedAll}
                  isLoading={isLoadingCombined}
                  hasNextPage={hasNextAllChannels}
                  fetchNextPage={fetchNextAllCombined}
                  isFetchingNextPage={isFetchingNextAllChannels}
                  onSelect={setSelectedChannel}
                  selectedChannel={selectedChannel}
                />
              </TabPanel>
              <TabPanel px="0" py="0">
                <ChannelList
                  channels={displayedStock}
                  isLoading={isLoadingStock}
                  hasNextPage={hasNextStock}
                  fetchNextPage={fetchNextStock}
                  isFetchingNextPage={isFetchingNextStock}
                  onSelect={setSelectedChannel}
                  selectedChannel={selectedChannel}
                />
              </TabPanel>
              <TabPanel px="0" py="0">
                <ChannelList
                  channels={displayedCrypto}
                  isLoading={isLoadingCrypto}
                  hasNextPage={hasNextCrypto}
                  fetchNextPage={fetchNextCrypto}
                  isFetchingNextPage={isFetchingNextCrypto}
                  onSelect={setSelectedChannel}
                  selectedChannel={selectedChannel}
                />
              </TabPanel>
              <TabPanel px="0" py="0">
                <ChannelList
                  channels={displayedViop}
                  isLoading={isLoadingViop}
                  hasNextPage={hasNextViop}
                  fetchNextPage={fetchNextViop}
                  isFetchingNextPage={isFetchingNextViop}
                  onSelect={setSelectedChannel}
                  selectedChannel={selectedChannel}
                />
              </TabPanel>
              <TabPanel px="0" py="0">
                <ChannelList
                  channels={displayedFunds}
                  isLoading={isLoadingFunds}
                  hasNextPage={hasNextFunds}
                  fetchNextPage={fetchNextFunds}
                  isFetchingNextPage={isFetchingNextFunds}
                  onSelect={setSelectedChannel}
                  selectedChannel={selectedChannel}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Box
            mt="4"
            pt="4"
            borderTop="1px solid"
            borderColor="gray.100"
            display="flex"
            justifyContent="flex-end">
            <Button mr="3" variant="ghost" onClick={onClose}>
              İptal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSend}
              isDisabled={!selectedChannel}
              isLoading={isSending}
              rightIcon={<FiSend />}>
              Gönder
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ForwardMessageModal;
