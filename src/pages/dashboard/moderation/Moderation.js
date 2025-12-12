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
} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';

const MessageCard = ({message, onBlock, onUnblock, isBlocking}) => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [blockReason, setBlockReason] = useState('');

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
    </>
  );
};

const Moderation = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState('');
  const [filterType, setFilterType] = useState('profanity'); // 'all', 'flagged', 'blocked', 'profanity'
  const [searchTerm, setSearchTerm] = useState('');
  const [blockingMessageId, setBlockingMessageId] = useState(null);

  // Fetch channels
  const {data: channels = []} = useQuery({
    queryKey: ['all-channels-moderation'],
    queryFn: async () => {
      const res = await api.getAllChannels({limit: 1000});
      return res.data?.results || [];
    },
  });

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
                {channels.map(channel => (
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
                isBlocking={blockingMessageId === (message.id || message._id)}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Page>
  );
};

export default Moderation;

