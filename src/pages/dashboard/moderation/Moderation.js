import React, {useState} from 'react';
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
} from '@chakra-ui/react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
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
} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {format} from 'date-fns';
import {add} from 'date-fns';
import {tr} from 'date-fns/locale';

const MessageCard = ({message, onBlock, onUnblock, onBanUser, onUnbanUser, isBlocking, isBanning, isUnbanning}) => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const banModal = useDisclosure();
  const [blockReason, setBlockReason] = useState('');
  const [banDuration, setBanDuration] = useState('24h'); // 1h, 12h, 24h, 3d, 1w, perm

  const handleBan = () => {
    onBanUser(message.user?.id || message.user?._id, banDuration);
    banModal.onClose();
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
        borderColor={message.isBlocked ? 'red.300' : message.isFlagged ? 'orange.300' : 'gray.200'}
        bg={message.isBlocked ? 'red.50' : message.isFlagged ? 'orange.50' : 'white'}
      >
        <CardBody>
          <VStack align="stretch" spacing={3}>
            {/* Header */}
            <HStack justify="space-between">
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
                    {message.createdAt && format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', {locale: tr})}
                  </Text>
                </VStack>
              </HStack>
              <HStack flexWrap="wrap">
                {message.isBlocked && (
                  <Badge colorScheme="red">Bloklu</Badge>
                )}
                {message.isFlagged && !message.isBlocked && (
                  <Badge colorScheme="orange">Şikayet Edildi</Badge>
                )}
                {message.reportCount > 0 && (
                  <Badge colorScheme="yellow">{message.reportCount} Şikayet</Badge>
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
                <Badge size="sm" colorScheme="blue">{message.channel?.type}</Badge>
              </HStack>
            )}

            {/* Message Content */}
            <Box 
              p={3} 
              bg={message.isBlocked ? 'red.100' : 'gray.50'} 
              borderRadius="md"
              position="relative"
            >
              {message.text && (
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {message.text}
                </Text>
              )}
              
              {/* Media indicator */}
              {(message.image || message.video || message.audio || message.file) && (
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
                  <Text fontSize="xs" fontWeight="bold">Tespit Edilen Uygunsuz Kelimeler:</Text>
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
                colorScheme="purple"
                variant="outline"
                leftIcon={<FiUserX />}
                onClick={banModal.onOpen}
                isLoading={isBanning}
              >
                Kullanıcıyı Banla
              </Button>
              
              {message.isBlocked ? (
                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<FiCheck />}
                  onClick={() => onUnblock(message.id || message._id)}
                  isLoading={isBlocking}
                >
                  Engeli Kaldır
                </Button>
              ) : (
                <Button
                  size="sm"
                  colorScheme="red"
                  leftIcon={<FiX />}
                  onClick={onOpen}
                  isLoading={isBlocking}
                >
                  Engelle
                </Button>
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
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Bu mesaj neden engelleniyor?"
              />
            </FormControl>
            <Alert status="warning" mt={4} borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Bu mesaj engellendiğinde, mobil uygulamada "Bu mesaj kurallara aykırı olduğundan Admin tarafından engellenmiştir" şeklinde görünecektir.
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

      {/* Ban User Modal */}
      <Modal isOpen={banModal.isOpen} onClose={banModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Kullanıcıyı Banla</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              <strong>{message.user?.fullname}</strong> adlı kullanıcıyı banlamak üzeresiniz.
            </Text>
            <FormControl>
              <FormLabel>Ban Süresi</FormLabel>
              <Select value={banDuration} onChange={(e) => setBanDuration(e.target.value)}>
                <option value="1h">1 Saat</option>
                <option value="12h">12 Saat</option>
                <option value="24h">1 Gün</option>
                <option value="3d">3 Gün</option>
                <option value="1w">1 Hafta</option>
                <option value="perm">Süresiz (Permanent)</option>
              </Select>
            </FormControl>
            <Alert status="warning" mt={4} borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                Kullanıcı bu süre boyunca uygulama özelliklerini kullanamayacaktır.
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

  // Helper to fetch all items with pagination
  const fetchAll = async (apiFunc, params = {}) => {
    const limit = 100; // Max limit allowed by API
    const firstRes = await apiFunc({ ...params, limit, page: 1 });
    
    if (!firstRes.data) return [];
    
    let allResults = firstRes.data.results || [];
    const totalPages = firstRes.data.totalPages || 1;
    
    if (totalPages > 1) {
      const promises = [];
      for (let i = 2; i <= totalPages; i++) {
        promises.push(apiFunc({ ...params, limit, page: i }));
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

const Moderation = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState('');
  const [filterType, setFilterType] = useState('profanity'); // 'all', 'flagged', 'blocked', 'profanity'
  const [searchTerm, setSearchTerm] = useState('');
  const [blockingMessageId, setBlockingMessageId] = useState(null);

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
    queryFn: () => fetchAll(api.getMarkets, { type: 'viop' }),
  });

  // Fetch Crypto Markets
  const {data: cryptoMarketsData} = useQuery({
    queryKey: ['crypto-markets-moderation'],
    queryFn: () => fetchAll(api.getMarkets, { type: 'crypto' }),
  });

  // Fetch Stock Markets
  const {data: stockMarketsData} = useQuery({
    queryKey: ['stock-markets-moderation'],
    queryFn: () => fetchAll(api.getMarkets, { type: 'stock' }),
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
      const existingChannel = channelsData?.find(c => c.marketCode === market.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [viopMarketsData, channelsData]);

  // Merge Crypto markets with existing channels
  const mergedCryptoChannels = React.useMemo(() => {
    if (!cryptoMarketsData) return [];
    return cryptoMarketsData.map(market => {
      const existingChannel = channelsData?.find(c => c.marketCode === market.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [cryptoMarketsData, channelsData]);

  // Merge Stock markets with existing channels
  const mergedStockChannels = React.useMemo(() => {
    if (!stockMarketsData) return [];
    return stockMarketsData.map(market => {
      const existingChannel = channelsData?.find(c => c.marketCode === market.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [stockMarketsData, channelsData]);

  // Merge Funds with existing channels
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
  const vipChannels = vipChannelsData || [];
  const otherChannels = channelsData?.filter(c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund') || [];

  // Combine all channels for dropdown
  const allChannels = React.useMemo(() => {
    return [
      ...marketChannels,
      ...viopChannels,
      ...fundChannels,
      ...cryptoChannels,
      ...vipChannels,
      ...otherChannels
    ].filter(c => c.id); // Only show initiated channels in moderation filter
  }, [marketChannels, viopChannels, fundChannels, cryptoChannels, vipChannels, otherChannels]);

  // Fetch messages for moderation
  const {data: messagesData, isLoading, refetch} = useQuery({
    queryKey: ['moderation-messages', selectedChannel, filterType],
    queryFn: async () => {
      const params = {
        limit: 100,
        page: 1,
      };
      
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
  });

  const messages = messagesData?.results || [];

  // Filter by search term
  const filteredMessages = messages.filter(msg => {
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
    onError: (error) => {
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
    mutationFn: (messageId) => api.unblockMessage(messageId),
    onSuccess: () => {
      toast({
        title: 'Engel kaldırıldı',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
      setBlockingMessageId(null);
    },
    onError: (error) => {
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

  const handleUnblock = (messageId) => {
    setBlockingMessageId(messageId);
    unblockMutation.mutate(messageId);
  };

  const banUserMutation = useMutation({
    mutationFn: ({userId, banExpiresAt}) => api.manageUser(userId, {
      isBanned: true,
      banExpiresAt: banExpiresAt
    }),
    onSuccess: () => {
      toast({
        title: 'Kullanıcı banlandı',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Kullanıcı banlanamadı',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleBanUser = (userId, duration) => {
    let banExpiresAt = null;
    const now = new Date();
    
    switch (duration) {
      case '1h': banExpiresAt = add(now, {hours: 1}); break;
      case '12h': banExpiresAt = add(now, {hours: 12}); break;
      case '24h': banExpiresAt = add(now, {hours: 24}); break;
      case '3d': banExpiresAt = add(now, {days: 3}); break;
      case '1w': banExpiresAt = add(now, {weeks: 1}); break;
      case 'perm': banExpiresAt = null; break;
      default: banExpiresAt = add(now, {hours: 24});
    }

    banUserMutation.mutate({userId, banExpiresAt});
  };

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: (userId) => api.manageUser(userId, {
      isBanned: false,
      banExpiresAt: null
    }),
    onSuccess: () => {
      toast({
        title: 'Kullanıcı banı kaldırıldı',
        status: 'success',
        duration: 2000,
      });
      queryClient.invalidateQueries(['moderation-messages']);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'Ban kaldırılamadı',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const handleUnbanUser = (userId) => {
    unbanUserMutation.mutate(userId);
  };

  // Stats
  const blockedCount = messages.filter(m => m.isBlocked).length;
  const flaggedCount = messages.filter(m => m.isFlagged && !m.isBlocked).length;

  return (
    <Page title="İçerik Moderasyonu">
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{base: 1, md: 3}} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Mesaj</StatLabel>
                <StatNumber>{messagesData?.totalResults || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <FiAlertTriangle color="orange" />
                  <StatLabel>Şikayet Edilen</StatLabel>
                </HStack>
                <StatNumber color="orange.500">{flaggedCount}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <FiShield color="red" />
                  <StatLabel>Engellenen</StatLabel>
                </HStack>
                <StatNumber color="red.500">{blockedCount}</StatNumber>
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
                onChange={(e) => setSelectedChannel(e.target.value)}
                maxW="300px"
              >
                {allChannels.map(channel => (
                  <option key={channel.id || channel._id} value={channel.id || channel._id}>
                    {channel.name}
                  </option>
                ))}
              </Select>

              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                maxW="200px"
              >
                <option value="profanity">🚫 Uygunsuz Kelime İçerenler</option>
                <option value="flagged">⚠️ Şikayet Edilenler</option>
                <option value="blocked">🛡️ Engellenenler</option>
                <option value="all">📋 Tümü</option>
              </Select>

              <InputGroup maxW="300px">
                <InputLeftElement>
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Mesaj veya kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                isBlocking={blockingMessageId === (message.id || message._id)}
                isBanning={banUserMutation.isPending}
                isUnbanning={unbanUserMutation.isPending}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Page>
  );
};

export default Moderation;

