import React, {useState, useEffect} from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  IconButton,
  Spinner,
  Flex,
  Image as ChakraImage,
  Tooltip,
  Badge,
  Button,
  useToast,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Heading,
  Divider,
} from '@chakra-ui/react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {
  FiRefreshCw,
  FiShield,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiSearch,
  FiImage,
  FiVideo,
  FiMusic,
  FiFile,
  FiUserX,
  FiSlash,
} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {format} from 'date-fns';

import {tr} from 'date-fns/locale';
import {useLocation, useNavigate} from 'react-router-dom';

const MessageCard = ({
  message,
  onBlock,
  onUnblock,
  onBanUser,
  onUnbanUser,
  onAddToBlacklist,
  isBlocking,
  isBanning,
  isUnbanning,
}) => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const banModal = useDisclosure();
  const blacklistModal = useDisclosure();
  const [blockReason, setBlockReason] = useState('');
  const [banDuration, setBanDuration] = useState('24h');
  const [customHours, setCustomHours] = useState('6');
  const [blacklistWord, setBlacklistWord] = useState('');
  const [targetUserForBan, setTargetUserForBan] = useState(null);

  const handleBan = () => {
    const userId = targetUserForBan?.id || targetUserForBan?._id || message.user?.id || message.user?._id;
    onBanUser(userId, banDuration, customHours);
    banModal.onClose();
  };

  const openBanModalFor = (user) => {
    setTargetUserForBan(user);
    banModal.onOpen();
  };

  const handleBlacklist = () => {
    if (blacklistWord) {
      onAddToBlacklist(blacklistWord);
      blacklistModal.onClose();
      setBlacklistWord('');
    }
  };

  const handleBlock = () => {
    onBlock(message.id || message._id, blockReason);
    onClose();
    setBlockReason('');
  };

  const getMediaIcon = () => {
    if (message.image) return <FiImage />;
    if (message.video) return <FiVideo />;
    if (message.audio) return <FiMusic />;
    if (message.file) return <FiFile />;
    return null;
  };

  return (
    <>
      <Card
        borderWidth="1px"
        borderColor={
          message.isBlocked
            ? 'red.300'
            : message.isFlagged
              ? 'orange.300'
              : 'gray.200'
        }
        bg={
          message.isBlocked
            ? 'red.50'
            : message.isFlagged
              ? 'orange.50'
              : 'white'
        }>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            {/* Header */}
            <HStack justify="space-between" align="start">
              <Box flex="1">
                {message.isReport ? (
                  <VStack align="stretch" spacing={3} bg="gray.50" p={2} borderRadius="md" mb={2}>
                    <HStack>
                      <Badge colorScheme="blue" minW="100px" textAlign="center">Şikayet Eden</Badge>
                      <Avatar
                        size="xs"
                        src={getCombinedLogoUrl(message.user?.thumbnail)}
                        name={message.user?.fullname}
                      />
                      <Text fontWeight="bold" fontSize="sm">
                        {message.user?.fullname || 'Bilinmeyen Kullanıcı'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                         • {message.createdAt &&
                          format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: tr,
                          })}
                      </Text>
                    </HStack>
                    
                    {message.sub && (
                       <HStack justify="space-between">
                         <HStack>
                            <Badge colorScheme="red" minW="100px" textAlign="center">Şikayet Edilen</Badge>
                            <Avatar
                              size="xs"
                              src={getCombinedLogoUrl(message.sub?.thumbnail)}
                              name={message.sub?.fullname}
                            />
                            <Text fontWeight="bold" fontSize="sm">
                              {message.sub?.fullname || 'Bilinmeyen Kullanıcı'}
                            </Text>
                         </HStack>
                         <Button
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<FiUserX />}
                            onClick={() => openBanModalFor(message.sub)}
                            isLoading={isBanning}>
                            Banla
                          </Button>
                       </HStack>
                    )}
                  </VStack>
                ) : (
                  <HStack>
                    <Avatar
                      size="sm"
                      src={getCombinedLogoUrl(message.user?.thumbnail)}
                      name={message.user?.fullname}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">
                        {message.user?.fullname || 'Bilinmeyen Kullanıcı'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {message.createdAt &&
                          format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: tr,
                          })}
                      </Text>
                    </VStack>
                  </HStack>
                )}
              </Box>
              <HStack flexWrap="wrap" ml={2}>
                {message.isReport && (
                  <Badge colorScheme="purple">
                    {message.reportType === 'user'
                      ? 'Kullanıcı Şikayeti'
                      : message.reportType === 'work'
                        ? 'İş Şikayeti'
                        : message.reportType === 'channel'
                          ? 'Kanal Şikayeti'
                          : 'Genel Şikayet'}
                  </Badge>
                )}
                {message.isBlocked && <Badge colorScheme="red">Bloklu</Badge>}
                {message.isFlagged && !message.isBlocked && (
                  <Badge colorScheme="orange">Şikayet Edildi</Badge>
                )}
                {message.reportCount > 0 && (
                  <Badge colorScheme="yellow">
                    {message.reportCount} Şikayet
                  </Badge>
                )}
                {message.profanityWords?.length > 0 && (
                  <Badge colorScheme="purple">🚫 Uygunsuz</Badge>
                )}
              </HStack>
            </HStack>

            {/* Channel Info */}
            {message.channel && (
              <HStack>
                <Avatar
                  size="xs"
                  src={getCombinedLogoUrl(message.channel?.thumbnail)}
                  name={message.channel?.name}
                />
                <Text fontSize="xs" color="gray.600">
                  {message.channel?.name}
                </Text>
                <Badge size="sm" colorScheme="blue">
                  {message.channel?.type}
                </Badge>
              </HStack>
            )}

            {/* Message Content */}
            <Box
              p={3}
              bg={message.isBlocked ? 'red.100' : 'gray.50'}
              borderRadius="md"
              position="relative">
              {message.text && (
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {message.text}
                </Text>
              )}

              {/* Media indicator */}
              {(message.image ||
                message.video ||
                message.audio ||
                message.file) && (
                <HStack mt={2} color="gray.500">
                  {getMediaIcon()}
                  <Text fontSize="xs">
                    {message.image && 'Görsel'}
                    {message.video && 'Video'}
                    {message.audio && 'Ses'}
                    {message.file && 'Dosya'}
                  </Text>
                </HStack>
              )}

              {/* Media Preview */}
              {message.image && (
                <ChakraImage
                  src={getCombinedLogoUrl(message.image)}
                  maxH="200px"
                  mt={2}
                  borderRadius="md"
                  objectFit="cover"
                />
              )}
            </Box>

            {/* Block Reason */}
            {message.isBlocked && message.blockReason && (
              <Alert status="error" size="sm" borderRadius="md">
                <AlertIcon />
                <Text fontSize="xs">Engel Sebebi: {message.blockReason}</Text>
              </Alert>
            )}

            {/* Profanity Words Found */}
            {message.profanityWords?.length > 0 && (
              <Alert status="warning" size="sm" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontSize="xs" fontWeight="bold">
                    Tespit Edilen Uygunsuz Kelimeler:
                  </Text>
                  <Text fontSize="xs" color="orange.700">
                    {message.profanityWords.join(', ')}
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Actions */}
            <HStack justify="flex-end" spacing={2}>
              <Button
                size="sm"
                colorScheme="gray"
                variant="outline"
                leftIcon={<FiSlash />}
                onClick={blacklistModal.onOpen}>
                Kelime Yasakla
              </Button>
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                leftIcon={<FiUserX />}
                onClick={banModal.onOpen}
                isLoading={isBanning}>
                Kullanıcıyı Banla
              </Button>

              {!message.isReport && (
                <>
                  {message.isBlocked ? (
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FiCheck />}
                      onClick={() => onUnblock(message.id || message._id)}
                      isLoading={isBlocking}>
                      Engeli Kaldır
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FiX />}
                      onClick={onOpen}
                      isLoading={isBlocking}>
                      Engelle
                    </Button>
                  )}
                </>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Block Reason Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mesajı Engelle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Engelleme Sebebi (Opsiyonel)</FormLabel>
              <Textarea
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Bu mesaj neden engelleniyor?"
              />
            </FormControl>
            <Alert status="warning" mt={4} borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Bu mesaj engellendiğinde, mobil uygulamada "Bu mesaj kurallara
                aykırı olduğundan Admin tarafından engellenmiştir" şeklinde
                görünecektir.
              </Text>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              İptal
            </Button>
            <Button colorScheme="red" onClick={handleBlock}>
              Engelle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Blacklist Modal */}
      <Modal isOpen={blacklistModal.isOpen} onClose={blacklistModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Kelimeyi Kara Listeye Ekle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontSize="sm" color="gray.600">
              Bu kelimeyi içeren mesajlar gelecekte otomatik olarak
              işaretlenecek veya engellenecektir.
            </Text>
            <FormControl>
              <FormLabel>Yasaklanacak Kelime/İfade</FormLabel>
              <Input
                value={blacklistWord}
                onChange={e => setBlacklistWord(e.target.value)}
                placeholder="Örn: küfür"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={blacklistModal.onClose}>
              İptal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleBlacklist}
              isDisabled={!blacklistWord}>
              Ekle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ban User Modal */}
      <Modal isOpen={banModal.isOpen} onClose={banModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Kullanıcıyı Banla</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              <strong>
                {targetUserForBan?.fullname || message.user?.fullname}
              </strong>{' '}
              adlı kullanıcıyı banlamak üzeresiniz.
            </Text>
            <FormControl>
              <FormLabel>Ban Süresi</FormLabel>
              <Select
                value={banDuration}
                onChange={e => setBanDuration(e.target.value)}>
                <option value="1h">1 Saat</option>
                <option value="6h">6 Saat</option>
                <option value="12h">12 Saat</option>
                <option value="24h">1 Gün</option>
                <option value="3d">3 Gün</option>
                <option value="1w">1 Hafta</option>
                <option value="perm">Süresiz (Permanent)</option>
                <option value="custom">Özel (Saat)</option>
              </Select>
            </FormControl>
            {banDuration === 'custom' && (
              <FormControl mt={3}>
                <FormLabel>Özel Süre (Saat)</FormLabel>
                <Input
                  value={customHours}
                  onChange={e => setCustomHours(e.target.value)}
                  placeholder="Örn: 8"
                  type="number"
                  min={1}
                />
              </FormControl>
            )}
            <Alert status="warning" mt={4} borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Kullanıcı bu süre boyunca uygulama özelliklerini
                kullanamayacaktır.
              </Text>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={banModal.onClose}>
              İptal
            </Button>
            <Button colorScheme="purple" onClick={handleBan}>
              Banla
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

// Fetch all items with pagination
const fetchAll = async (apiFunc, params = {}) => {
  const limit = 100; // Max limit allowed by API
  const firstRes = await apiFunc({...params, limit, page: 1});

  if (!firstRes.data) return [];

  let allResults = firstRes.data.results || [];
  const totalPages = firstRes.data.totalPages || 1;

  if (totalPages > 1) {
    const promises = [];
    for (let i = 2; i <= totalPages; i++) {
      promises.push(apiFunc({...params, limit, page: i}));
    }

    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.data?.results) {
        allResults = [...allResults, ...res.data.results];
      }
    });
  }

  return allResults;
};

const BannedUserCard = ({blacklistEntry, onUnban, isUnbanning}) => {
  const {data: user, isLoading} = useQuery({
    queryKey: ['user', blacklistEntry.value],
    queryFn: () => api.getUser(blacklistEntry.value).then(res => res.data),
    enabled: !!blacklistEntry.value,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card borderWidth="1px" borderColor="red.200" bg="red.50">
        <CardBody>
          <Flex justify="center" align="center" h="100px">
            <Spinner size="sm" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  const isPermanent = !blacklistEntry.expiresAt;
  const expiresDate = blacklistEntry.expiresAt
    ? new Date(blacklistEntry.expiresAt)
    : null;
  const isExpired = expiresDate && expiresDate <= new Date();

  if (!user && !isLoading) {
    return (
      <Card borderWidth="1px" borderColor="red.300" bg="red.50">
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">
                  Bilinmeyen Kullanıcı
                </Text>
                <Text fontSize="xs" color="gray.500">
                  ID: {blacklistEntry.value}
                </Text>
              </VStack>
              <Badge colorScheme="red">Banlı</Badge>
            </HStack>
            <Alert status="error" size="sm" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontSize="xs" fontWeight="bold">
                  Ban Süresi:
                </Text>
                <Text fontSize="xs">
                  {isPermanent
                    ? 'Süresiz'
                    : expiresDate
                      ? format(expiresDate, 'dd MMM yyyy HH:mm', {locale: tr})
                      : '-'}
                </Text>
              </Box>
            </Alert>
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<FiCheck />}
              onClick={() => onUnban(blacklistEntry.value)}
              isLoading={isUnbanning}
              width="full">
              Banı Kaldır
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (!user) return null;

  return (
    <Card borderWidth="1px" borderColor="red.300" bg="red.50">
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <HStack>
              <Avatar
                size="sm"
                src={getCombinedLogoUrl(user.thumbnail)}
                name={user.fullname}
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">
                  {user.fullname}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.email}
                </Text>
              </VStack>
            </HStack>
            <Badge colorScheme="red">Banlı</Badge>
          </HStack>

          <Alert status="error" size="sm" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="xs" fontWeight="bold">
                Ban Süresi:
              </Text>
              <Text fontSize="xs">
                {isPermanent
                  ? 'Süresiz'
                  : format(expiresDate, 'dd MMM yyyy HH:mm', {locale: tr})}
              </Text>
              {isExpired && (
                <Text fontSize="xs" fontWeight="bold">
                  (Süresi Dolmuş)
                </Text>
              )}
            </Box>
          </Alert>

          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<FiCheck />}
            onClick={() => onUnban(user.id || user._id)}
            isLoading={isUnbanning}
            width="full">
            Banı Kaldır
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};
// Main Moderation Component
const Moderation = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState('');
  const [filterType, setFilterType] = useState(() => {
    const params = new URLSearchParams(location.search);
    const initial = params.get('filter');
    const allowed = ['all', 'flagged', 'blocked', 'profanity', 'reports', 'channel_reports'];
    return allowed.includes(initial) ? initial : 'profanity';
  }); // 'all', 'flagged', 'blocked', 'profanity'
  const [searchTerm, setSearchTerm] = useState('');
  const [bannedTextSearch, setBannedTextSearch] = useState('');
  const [bannedTextSearchDebounced, setBannedTextSearchDebounced] =
    useState('');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [bannedTextPage, setBannedTextPage] = useState(1);
  const [bannedTextLimit, setBannedTextLimit] = useState(50);
  const [blockingMessageId, setBlockingMessageId] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fetch all channels for selection
  const {data: channelsData} = useQuery({
    queryKey: ['all-channels-moderation'],
    queryFn: () => fetchAll(api.getAllChannels),
  });

  // Fetch VIP channels
  const {data: vipChannelsData} = useQuery({
    queryKey: ['vip-channels-moderation'],
    queryFn: () => fetchAll(api.getVipChannels),
  });

  // Fetch VIOP Markets
  const {data: viopMarketsData} = useQuery({
    queryKey: ['viop-markets-moderation'],
    queryFn: () => fetchAll(api.getMarkets, {type: 'viop'}),
  });

  // Fetch Crypto Markets
  const {data: cryptoMarketsData} = useQuery({
    queryKey: ['crypto-markets-moderation'],
    queryFn: () => fetchAll(api.getMarkets, {type: 'crypto'}),
  });

  // Fetch Stock Markets
  const {data: stockMarketsData} = useQuery({
    queryKey: ['stock-markets-moderation'],
    queryFn: () => fetchAll(api.getMarkets, {type: 'stock'}),
  });

  // Fetch Funds
  const {data: fundsData} = useQuery({
    queryKey: ['funds-list-moderation'],
    queryFn: () => fetchAll(api.getFunds),
  });

  // Merge VİOP markets with existing channels
  const mergedViopChannels = React.useMemo(() => {
    if (!viopMarketsData) return [];
    return viopMarketsData.map(market => {
      const existingChannel = channelsData?.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [viopMarketsData, channelsData]); // Merge Crypto markets with existing channels
  const mergedCryptoChannels = React.useMemo(() => {
    if (!cryptoMarketsData) return [];
    return cryptoMarketsData.map(market => {
      const existingChannel = channelsData?.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [cryptoMarketsData, channelsData]); // Merge Stock markets with existing channels
  const mergedStockChannels = React.useMemo(() => {
    if (!stockMarketsData) return [];
    return stockMarketsData.map(market => {
      const existingChannel = channelsData?.find(
        c => c.marketCode === market.code,
      );
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [stockMarketsData, channelsData]); // Merge Funds with existing channels
  const mergedFundChannels = React.useMemo(() => {
    if (!fundsData) return [];
    return fundsData.map(fund => {
      const existingChannel = channelsData?.find(c => c.fundCode === fund.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: fund.name,
        fundCode: fund.code,
        type: 'fund',
        isVirtual: true,
      };
    });
  }, [fundsData, channelsData]);
  const marketChannels = mergedStockChannels;
  const viopChannels = mergedViopChannels;
  const fundChannels = mergedFundChannels;
  const cryptoChannels = mergedCryptoChannels;
  const allChannels = React.useMemo(() => {
    const vipChannels = vipChannelsData || [];
    const otherChannels =
      channelsData?.filter(
        c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund',
      ) || [];
    return [
      ...marketChannels,
      ...viopChannels,
      ...fundChannels,
      ...cryptoChannels,
      ...vipChannels,
      ...otherChannels,
    ].sort((a, b) =>
      `${a.label ?? a.name ?? ''}`.localeCompare(
        `${b.label ?? b.name ?? ''}`,
        'tr',
      ),
    );
  }, [
    marketChannels,
    viopChannels,
    fundChannels,
    cryptoChannels,
    vipChannelsData,
    channelsData,
  ]);

  // Fetch messages for moderation
  const {
    data: messagesData,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['moderation-messages', selectedChannel, filterType],
    queryFn: async ({pageParam = 1}) => {
      const params = {
        limit: 100,
        page: pageParam,
      };

      if (filterType === 'reports' || filterType === 'channel_reports') {
        const reportParams = {
          ...params,
          sortBy: 'createdAt:desc',
        };

        if (filterType === 'channel_reports') {
          reportParams.type = 'channel';
        } else if (filterType === 'reports') {
          reportParams.type = ['user', 'general', 'complaint', 'spam'];
        }

        const res = await api.getReports(reportParams);
        const results = res.data.results || [];
        const mapped = results.map(r => ({
          ...r,
          text: r.message,
          isReport: true,
          reportType: r.type,
          id: r.id || r._id,
        }));
        return {...res.data, results: mapped};
      }

      if (selectedChannel) {
        params.channelId = selectedChannel;
      }

      if (filterType === 'blocked') {
        params.showBlocked = true;
      } else if (filterType === 'flagged') {
        params.showFlagged = true;
      } else if (filterType === 'profanity') {
        params.showProfanity = true;
      }

      const res = await api.getMessagesForModeration(params);
      return res.data;
    },
    getNextPageParam: lastPage => {
      if (!lastPage || !lastPage.totalPages) return undefined;
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const {data: profanityStatsData} = useQuery({
    queryKey: ['moderation-stats', 'profanity'],
    queryFn: () =>
      api
        .getMessagesForModeration({
          limit: 1,
          page: 1,
          showProfanity: true,
        })
        .then(res => res.data),
    staleTime: 30000,
  });

  const {data: flaggedStatsData} = useQuery({
    queryKey: ['moderation-stats', 'flagged'],
    queryFn: () =>
      api
        .getMessagesForModeration({
          limit: 1,
          page: 1,
          showFlagged: true,
        })
        .then(res => res.data),
    staleTime: 30000,
  });

  const {data: blockedStatsData} = useQuery({
    queryKey: ['moderation-stats', 'blocked'],
    queryFn: () =>
      api
        .getMessagesForModeration({
          limit: 1,
          page: 1,
          showBlocked: true,
        })
        .then(res => res.data),
    staleTime: 30000,
  });

  const {data: bannedUsersData, isLoading: isBannedUsersLoading} = useQuery({
    queryKey: ['banned-users-moderation', selectedChannel],
    queryFn: () =>
      fetchAll(api.getBlacklists, {
        sortBy: 'createdAt:desc',
      }),
    staleTime: 30000,
  });

  // Fetch banned text entries
  const {
    data: bannedTextData,
    isLoading: isBannedTextLoading,
    refetch: refetchBannedText,
  } = useQuery({
    queryKey: [
      'banned-text-blacklist',
      bannedTextPage,
      bannedTextLimit,
      bannedTextSearchDebounced,
    ],
    queryFn: async () => {
      const res = await api.getBlacklists({
        type: 'text',
        scope: 'banned-text',
        isActive: true,
        sortBy: 'createdAt:desc',
        limit: bannedTextLimit,
        page: bannedTextPage,
        value: bannedTextSearchDebounced || undefined,
      });
      return res.data;
    },
    keepPreviousData: true,
    staleTime: 30000,
  });

  // Sync filterType with query string changes - only on initial load
  useEffect(() => {
    if (initialLoadDone) return; // Skip after initial load

    const params = new URLSearchParams(location.search);
    const qFilter = params.get('filter');
    const allowed = ['all', 'flagged', 'blocked', 'profanity', 'reports', 'channel_reports'];
    if (allowed.includes(qFilter) && qFilter !== filterType) {
      setFilterType(qFilter);
    }
    setInitialLoadDone(true);
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = bannedTextSearch.trim();
      setBannedTextSearchDebounced(trimmed);
      setBannedTextPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [bannedTextSearch]);

  // Update URL when filterType changes (after initial load)
  const handleFilterTypeChange = newFilter => {
    setFilterType(newFilter);
    // Update URL without triggering re-render loop
    const params = new URLSearchParams(location.search);
    if (newFilter === 'profanity') {
      params.delete('filter'); // Default value, no need to show in URL
    } else {
      params.set('filter', newFilter);
    }
    const newSearch = params.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, {
      replace: true,
    });
  };

  // Pre-fill selectedChannel and searchTerm from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chId = params.get('channelId');
    const q = params.get('q');
    if (chId && chId !== selectedChannel) {
      setSelectedChannel(chId);
    }
    if (q && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [location.search, selectedChannel, searchTerm]);

  const messages =
    messagesData?.pages.flatMap(page => page.results || []) || [];
  const activeBannedUsers = React.useMemo(() => {
    const list = bannedUsersData || [];
    return list.filter(entry => {
      if (!entry?.isActive) return false;
      if (entry.scope === 'access' && entry.type === 'user-id') {
        return true;
      }
      if (entry.scope === 'channel-message') {
        if (!selectedChannel) {
          return true;
        }
        return !entry.resource || entry.resource === selectedChannel;
      }
      return false;
    });
  }, [bannedUsersData, selectedChannel]);

  const bannedTextEntries = React.useMemo(() => {
    const items = (bannedTextData?.results || []).filter(entry => entry?.value);
    return items;
  }, [bannedTextData]);

  const bannedTextTotal = bannedTextData?.totalResults || 0;
  const bannedTextTotalPages = bannedTextData?.totalPages || 1;

  const filteredBannedTextEntries = React.useMemo(() => {
    return bannedTextEntries;
  }, [bannedTextEntries]);

  // Filter by search term
  const filteredMessages = messages.filter(msg => {
    if (filterType !== 'reports' && filterType !== 'channel_reports') {
      if (filterType === 'blocked' && !msg.isBlocked) {
        return false;
      }
      if (
        filterType === 'flagged' &&
        !msg.isFlagged &&
        !(msg.reportCount > 0)
      ) {
        return false;
      }
      if (
        filterType === 'profanity' &&
        !(msg.profanityWords && msg.profanityWords.length > 0)
      ) {
        return false;
      }
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      msg.text?.toLowerCase().includes(term) ||
      msg.user?.fullname?.toLowerCase().includes(term) ||
      msg.channel?.name?.toLowerCase().includes(term)
    );
  });

  // Block message mutation
  const blockMutation = useMutation({
    mutationFn: ({messageId, reason}) => api.blockMessage(messageId, reason),
    onSuccess: () => {
      toast({
        title: 'Mesaj engellendi',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
      setBlockingMessageId(null);
    },
    onError: error => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Mesaj engellenemedi',
        status: 'error',
        duration: 3000,
      });
      setBlockingMessageId(null);
    },
  });

  // Unblock message mutation
  const unblockMutation = useMutation({
    mutationFn: messageId => api.unblockMessage(messageId),
    onSuccess: () => {
      toast({
        title: 'Engel kaldırıldı',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
      setBlockingMessageId(null);
    },
    onError: error => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Engel kaldırılamadı',
        status: 'error',
        duration: 3000,
      });
      setBlockingMessageId(null);
    },
  });

  const handleBlock = (messageId, reason) => {
    setBlockingMessageId(messageId);
    blockMutation.mutate({messageId, reason});
  };

  const handleUnblock = messageId => {
    setBlockingMessageId(messageId);
    unblockMutation.mutate(messageId);
  };

  const banUserMutation = useMutation({
    mutationFn: ({userId, banDuration}) =>
      api.manageUser(userId, {
        isBanned: true,
        banDuration,
      }),
    onSuccess: () => {
      toast({
        title: 'Kullanıcı banlandı',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
    },
    onError: error => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Kullanıcı banlanamadı',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleBanUser = (userId, duration, customHours) => {
    let hours = null;
    switch (duration) {
      case '1h':
        hours = 1;
        break;
      case '6h':
        hours = 6;
        break;
      case '12h':
        hours = 12;
        break;
      case '24h':
        hours = 24;
        break;
      case '3d':
        hours = 72;
        break;
      case '1w':
        hours = 168;
        break;
      case 'perm':
        hours = null;
        break;
      case 'custom': {
        const val = parseInt(String(customHours || '0'), 10);
        hours = isNaN(val) || val <= 0 ? 6 : val;
        break;
      }
      default:
        hours = 24;
    }
    banUserMutation.mutate({userId, banDuration: hours});
  };

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: userId =>
      api.manageUser(userId, {
        isBanned: false,
        banExpiresAt: null,
      }),
    onSuccess: () => {
      toast({
        title: 'Kullanıcı banı kaldırıldı',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
    },
    onError: error => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Ban kaldırılamadı',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleUnbanUser = userId => {
    unbanUserMutation.mutate(userId);
  };

  // Create Blacklist Mutation
  const createBlacklistMutation = useMutation({
    mutationFn: word =>
      api.createBlacklist({
        scope: 'banned-text',
        type: 'text',
        value: word,
        isActive: true,
      }),
    onSuccess: () => {
      toast({
        title: 'Kelime kara listeye eklendi',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['banned-text-blacklist']);
      setNewBannedWord('');
    },
    onError: error => {
      toast({
        title: 'Hata',
        description:
          error.response?.data?.message || 'Kelime kara listeye eklenemedi',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleAddToBlacklist = word => {
    createBlacklistMutation.mutate(word);
  };

  const removeBannedTextMutation = useMutation({
    mutationFn: id => api.updateBlacklist(id, {isActive: false}),
    onSuccess: () => {
      toast({
        title: 'Kelime kaldırıldı',
        status: 'success',
        duration: 2000,
      });
      if (bannedTextEntries.length === 1 && bannedTextPage > 1) {
        setBannedTextPage(prev => Math.max(1, prev - 1));
      }
      queryClient.invalidateQueries(['banned-text-blacklist']);
    },
    onError: error => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Kelime kaldırılamadı',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleRemoveBannedText = entry => {
    const id = entry?.id || entry?._id;
    if (!id) return;
    removeBannedTextMutation.mutate(id);
  };
  const profanityTotal = profanityStatsData?.totalResults || 0;
  const flaggedTotal = flaggedStatsData?.totalResults || 0;
  const blockedTotal = blockedStatsData?.totalResults || 0;

  return (
    <Page title="İçerik Moderasyonu">
      <VStack spacing={6} align="stretch">
        <SimpleGrid columns={{base: 1, md: 3}} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Uygunsuz Kelime İçeren Mesajlar</StatLabel>
                <StatNumber>{profanityTotal}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <FiAlertTriangle color="orange" />
                  <StatLabel>Şikayet Edilen Mesajlar</StatLabel>
                </HStack>
                <StatNumber color="orange.500">{flaggedTotal}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <FiShield color="red" />
                  <StatLabel>Engellenen Mesajlar</StatLabel>
                </HStack>
                <StatNumber color="red.500">{blockedTotal}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Select
                placeholder="Tüm Kanallar"
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value)}
                maxW="300px">
                {allChannels.map(channel => (
                  <option
                    key={channel.id || channel._id}
                    value={channel.id || channel._id}>
                    {channel.name}
                  </option>
                ))}
              </Select>

              <Select
                value={filterType}
                onChange={e => handleFilterTypeChange(e.target.value)}
                maxW="200px">
                <option value="profanity">🚫 Uygunsuz Kelime İçerenler</option>
                <option value="flagged">⚠️ Şikayet Edilenler</option>
                <option value="blocked">🛡️ Engellenenler</option>
                <option value="reports">📢 Kullanıcı Şikayetleri</option>
                <option value="channel_reports">📢 Kanal Şikayetleri</option>
                <option value="all">📋 Tümü</option>
              </Select>

              <InputGroup maxW="300px">
                <InputLeftElement>
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Mesaj veya kullanıcı ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Tooltip label="Yenile">
                <IconButton
                  icon={<FiRefreshCw />}
                  onClick={() => refetch()}
                  isLoading={isLoading}
                  aria-label="Yenile"
                />
              </Tooltip>
            </HStack>
          </CardBody>
        </Card>

        {/* Banned Text Section */}
        <Card>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" align="center">
                <Heading size="md" color="purple.600">
                  Yasaklı Kelimeler ({bannedTextTotal})
                </Heading>
                <Tooltip label="Yenile">
                  <IconButton
                    icon={<FiRefreshCw />}
                    onClick={() => refetchBannedText()}
                    isLoading={isBannedTextLoading}
                    aria-label="Yasaklı kelimeleri yenile"
                    size="sm"
                  />
                </Tooltip>
              </HStack>

              <HStack spacing={4} flexWrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <FiSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Yasaklı kelime ara..."
                    value={bannedTextSearch}
                    onChange={e => setBannedTextSearch(e.target.value)}
                  />
                </InputGroup>

                <InputGroup maxW="300px">
                  <Input
                    placeholder="Yeni yasaklı kelime ekle..."
                    value={newBannedWord}
                    onChange={e => setNewBannedWord(e.target.value)}
                  />
                </InputGroup>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    const trimmed = (newBannedWord || '').trim();
                    if (!trimmed) return;
                    handleAddToBlacklist(trimmed);
                  }}
                  isLoading={createBlacklistMutation.isPending}
                  isDisabled={!newBannedWord.trim()}>
                  Ekle
                </Button>

                <HStack spacing={2} align="center">
                  <Text fontSize="xs" color="gray.600">
                    Sayfa boyutu:
                  </Text>
                  <Select
                    size="sm"
                    maxW="100px"
                    value={String(bannedTextLimit)}
                    onChange={e => {
                      const value = parseInt(e.target.value, 10);
                      setBannedTextPage(1);
                      setBannedTextLimit(Number.isNaN(value) ? 50 : value);
                    }}>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                </HStack>
              </HStack>

              {isBannedTextLoading ? (
                <Flex justify="center" py={4}>
                  <Spinner size="md" />
                </Flex>
              ) : filteredBannedTextEntries.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text>Herhangi bir yasaklı kelime bulunamadı.</Text>
                </Alert>
              ) : (
                <VStack
                  align="stretch"
                  spacing={2}
                  maxH="300px"
                  overflowY="auto">
                  {filteredBannedTextEntries.map(entry => (
                    <HStack
                      key={entry.id || entry._id || entry.value}
                      justify="space-between"
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="md"
                      px={3}
                      py={2}>
                      <Text fontSize="sm">{entry.value}</Text>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FiX />}
                        onClick={() => handleRemoveBannedText(entry)}
                        isLoading={removeBannedTextMutation.isPending}>
                        Sil
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              )}

              <HStack justify="space-between" align="center" pt={2}>
                <Text fontSize="xs" color="gray.600">
                  Sayfa {bannedTextPage} / {bannedTextTotalPages} ·{' '}
                  {bannedTextTotal} kayıt
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setBannedTextPage(prev => Math.max(1, prev - 1))
                    }
                    isDisabled={bannedTextPage <= 1 || isBannedTextLoading}>
                    Önceki
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setBannedTextPage(prev =>
                        Math.min(bannedTextTotalPages, prev + 1),
                      )
                    }
                    isDisabled={
                      bannedTextPage >= bannedTextTotalPages ||
                      isBannedTextLoading
                    }>
                    Sonraki
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Banned Users Section */}
        {filterType === 'blocked' && (
          <Box>
            <Heading size="md" mb={4} color="red.600">
              Engellenen Kullanıcılar ({activeBannedUsers.length})
            </Heading>
            {isBannedUsersLoading ? (
              <Flex justify="center" py={6}>
                <Spinner size="lg" />
              </Flex>
            ) : activeBannedUsers.length === 0 ? (
              <Alert status="info" borderRadius="md" mb={6}>
                <AlertIcon />
                <Text>Aktif banlı kullanıcı bulunamadı.</Text>
              </Alert>
            ) : (
              <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={4} mb={8}>
                {activeBannedUsers.map(entry => (
                  <BannedUserCard
                    key={entry.id || entry._id || entry.value}
                    blacklistEntry={entry}
                    onUnban={handleUnbanUser}
                    isUnbanning={unbanUserMutation.isPending}
                  />
                ))}
              </SimpleGrid>
            )}
            <Divider mb={8} borderColor="gray.300" />
            <Heading size="md" mb={4} color="gray.700">
              Engellenen Mesajlar
            </Heading>
          </Box>
        )}

        {/* Messages */}
        {isLoading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" />
          </Flex>
        ) : filteredMessages.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>
              {filterType === 'profanity'
                ? 'Uygunsuz kelime içeren mesaj bulunamadı.'
                : filterType === 'flagged'
                  ? 'Şikayet edilen mesaj bulunamadı.'
                  : filterType === 'reports'
                    ? 'Kullanıcı şikayeti bulunamadı.'
                    : filterType === 'channel_reports'
                      ? 'Kanal şikayeti bulunamadı.'
                      : filterType === 'blocked'
                      ? 'Engellenen mesaj bulunamadı.'
                      : 'Mesaj bulunamadı.'}
            </Text>
          </Alert>
        ) : (
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} spacing={4}>
            {filteredMessages.map(message => (
              <MessageCard
                key={message.id || message._id}
                message={message}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
                onBanUser={handleBanUser}
                onUnbanUser={handleUnbanUser}
                onAddToBlacklist={handleAddToBlacklist}
                isBlocking={blockingMessageId === (message.id || message._id)}
                isBanning={banUserMutation.isPending}
                isUnbanning={unbanUserMutation.isPending}
              />
            ))}
          </SimpleGrid>
        )}

        {/* Load More Button */}
        {hasNextPage && (
          <Flex justify="center" mt={4} mb={8}>
            <Button
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              loadingText="Yükleniyor..."
              colorScheme="blue"
              variant="outline"
              size="md"
              width="200px">
              Daha Fazla Yükle
            </Button>
          </Flex>
        )}
      </VStack>
    </Page>
  );
};

export default Moderation;
