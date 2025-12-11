import React, {useState, useRef, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Avatar,
  IconButton,
  Spinner,
  Icon,
  Flex,
  Image as ChakraImage,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from '@chakra-ui/react';
import {useQuery, useMutation, useQueryClient, useInfiniteQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {
  FiSend,
  FiArrowLeft,
  FiImage,
  FiVideo,
  FiMusic,
  FiFile,
  FiPaperclip,
  FiRefreshCw,
  FiCornerUpLeft,
  FiX,
  FiSearch,
  FiChevronUp,
  FiChevronDown,
  FiDownload,
  FiExternalLink,
  FiSmile,
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import {getCombinedLogoUrl} from '../../../utils/image';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import useFileInput from '../../../hooks/useFileInput';
import {useToast} from '@chakra-ui/react';
import {getErrorMessage} from '../../../utils/string';

// Media Preview Modal Component
const MediaPreviewModal = ({isOpen, onClose, mediaType, mediaUrl, fileName}) => {
  const handleDownload = () => {
    window.open(mediaUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
        <ModalCloseButton 
          color="white" 
          bg="blackAlpha.600" 
          borderRadius="full"
          size="lg"
          top="4"
          right="4"
          _hover={{ bg: 'blackAlpha.800' }}
        />
        <ModalBody p="4" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          {mediaType === 'image' && (
            <ChakraImage
              src={mediaUrl}
              alt="Görsel"
              maxH="80vh"
              maxW="100%"
              objectFit="contain"
              borderRadius="lg"
            />
          )}
          
          {mediaType === 'video' && (
            <Box maxW="100%" maxH="80vh">
              <video
                src={mediaUrl}
                controls
                autoPlay
                style={{
                  maxHeight: '80vh',
                  maxWidth: '100%',
                  borderRadius: '8px',
                }}
              />
            </Box>
          )}
          
          {mediaType === 'audio' && (
            <Box bg="white" p="8" borderRadius="xl" minW="400px">
              <VStack spacing="4">
                <Box p="6" bg="blue.50" borderRadius="full">
                  <Icon as={FiMusic} boxSize="12" color="blue.500" />
                </Box>
                <Text fontWeight="600" color="gray.700">Ses Dosyası</Text>
                <audio
                  src={mediaUrl}
                  controls
                  autoPlay
                  style={{ width: '100%' }}
                />
              </VStack>
            </Box>
          )}
          
          {mediaType === 'file' && (
            <Box bg="white" p="8" borderRadius="xl" minW="400px">
              <VStack spacing="4">
                <Box p="6" bg="gray.100" borderRadius="full">
                  <Icon as={FiFile} boxSize="12" color="gray.600" />
                </Box>
                <Text fontWeight="600" color="gray.700">{fileName || 'Dosya'}</Text>
                <HStack spacing="3">
                  <IconButton
                    icon={<FiDownload />}
                    colorScheme="blue"
                    onClick={handleDownload}
                    aria-label="İndir"
                  />
                  <IconButton
                    icon={<FiExternalLink />}
                    variant="outline"
                    onClick={handleDownload}
                    aria-label="Yeni sekmede aç"
                  />
                </HStack>
              </VStack>
            </Box>
          )}
          
          {/* Action buttons */}
          <HStack mt="4" spacing="3">
            <Tooltip label="İndir">
              <IconButton
                icon={<FiDownload />}
                colorScheme="whiteAlpha"
                variant="solid"
                onClick={handleDownload}
                aria-label="İndir"
              />
            </Tooltip>
            <Tooltip label="Yeni sekmede aç">
              <IconButton
                icon={<FiExternalLink />}
                colorScheme="whiteAlpha"
                variant="solid"
                onClick={handleDownload}
                aria-label="Yeni sekmede aç"
              />
            </Tooltip>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Helper function to highlight search text
const HighlightText = ({text, searchQuery}) => {
  if (!searchQuery || !text) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <Text as="mark" key={index} bg="yellow.300" color="gray.800" px="0.5" borderRadius="sm">
            {part}
          </Text>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

const MessageBubble = ({message, isOwn, onReply, allMessages, searchQuery, isHighlighted, messageRef, onMediaClick}) => {
  const time = message.createdAt 
    ? format(new Date(message.createdAt), 'HH:mm', {locale: tr})
    : '';

  const hasMedia = message.image || message.video || message.audio || message.file;

  // Find the replied message if exists
  const repliedMessage = message.replyTo 
    ? allMessages?.find(m => m.id === message.replyTo || m._id === message.replyTo)
    : null;

  return (
    <Flex 
      ref={messageRef}
      justify={isOwn ? 'flex-end' : 'flex-start'} 
      mb="3" 
      role="group"
      bg={isHighlighted ? 'yellow.100' : 'transparent'}
      mx={isHighlighted ? '-4' : '0'}
      px={isHighlighted ? '4' : '0'}
      py={isHighlighted ? '2' : '0'}
      borderRadius="lg"
      transition="all 0.3s"
    >
      <HStack align="end" spacing="2" maxW="70%">
        {!isOwn && (
          <Avatar
            size="sm"
            name={message.user?.fullname}
            src={getCombinedLogoUrl(message.user?.thumbnail)}
          />
        )}
        
        {/* Reply button for own messages (left side) */}
        {isOwn && (
          <IconButton
            icon={<FiCornerUpLeft />}
            size="xs"
            variant="ghost"
            opacity="0"
            _groupHover={{opacity: 1}}
            onClick={() => onReply(message)}
            aria-label="Cevapla"
            title="Cevapla"
          />
        )}
        
        <Box
          bg={isOwn ? 'blue.500' : 'white'}
          color={isOwn ? 'white' : 'gray.800'}
          px="4"
          py="2"
          borderRadius="xl"
          borderBottomRightRadius={isOwn ? 'sm' : 'xl'}
          borderBottomLeftRadius={isOwn ? 'xl' : 'sm'}
          boxShadow="sm"
        >
          {!isOwn && (
            <Text fontSize="xs" fontWeight="600" color={isOwn ? 'blue.100' : 'blue.500'} mb="1">
              {message.user?.fullname || 'Kullanıcı'}
            </Text>
          )}
          
          {/* Reply Preview */}
          {repliedMessage && (
            <Box
              bg={isOwn ? 'blue.400' : 'gray.100'}
              p="2"
              borderRadius="md"
              mb="2"
              borderLeft="3px solid"
              borderLeftColor={isOwn ? 'blue.200' : 'blue.400'}
            >
              <Text fontSize="xs" fontWeight="600" color={isOwn ? 'blue.100' : 'blue.600'}>
                {repliedMessage.user?.fullname || 'Kullanıcı'}
              </Text>
              <Text fontSize="xs" color={isOwn ? 'blue.100' : 'gray.600'} noOfLines={2}>
                {repliedMessage.text || (repliedMessage.image ? '📷 Görsel' : repliedMessage.video ? '🎬 Video' : repliedMessage.audio ? '🎵 Ses' : repliedMessage.file ? '📄 Dosya' : 'Mesaj')}
              </Text>
            </Box>
          )}
          
          {/* Media Content */}
          {message.image && (
            <Box 
              position="relative" 
              cursor="pointer"
              onClick={() => onMediaClick('image', getCombinedLogoUrl(message.image))}
              _hover={{ opacity: 0.9 }}
              transition="opacity 0.2s"
            >
              <ChakraImage
                src={getCombinedLogoUrl(message.image)}
                alt="Görsel"
                maxH="200px"
                borderRadius="md"
                mb={message.text ? '2' : '0'}
              />
              <Box
                position="absolute"
                top="2"
                right="2"
                bg="blackAlpha.600"
                borderRadius="full"
                p="1"
                opacity="0"
                _groupHover={{ opacity: 1 }}
                transition="opacity 0.2s"
              >
                <Icon as={FiSearch} color="white" boxSize="4" />
              </Box>
            </Box>
          )}
          
          {message.video && (
            <Box 
              mb={message.text ? '2' : '0'} 
              position="relative"
              cursor="pointer"
              onClick={() => onMediaClick('video', getCombinedLogoUrl(message.video))}
            >
              <video
                src={getCombinedLogoUrl(message.video)}
                style={{maxHeight: '200px', borderRadius: '8px', pointerEvents: 'none'}}
              />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                bg="blackAlpha.700"
                borderRadius="full"
                p="3"
              >
                <Icon as={FiVideo} color="white" boxSize="6" />
              </Box>
            </Box>
          )}
          
          {message.audio && (
            <Box 
              mb={message.text ? '2' : '0'}
              cursor="pointer"
              onClick={() => onMediaClick('audio', getCombinedLogoUrl(message.audio))}
              bg={isOwn ? 'blue.400' : 'gray.100'}
              p="3"
              borderRadius="md"
              _hover={{ opacity: 0.9 }}
            >
              <HStack spacing="3">
                <Icon as={FiMusic} boxSize="5" />
                <Text fontSize="sm">🎵 Ses dosyası - Açmak için tıklayın</Text>
              </HStack>
            </Box>
          )}
          
          {message.file && (
            <HStack
              bg={isOwn ? 'blue.400' : 'gray.100'}
              p="2"
              borderRadius="md"
              mb={message.text ? '2' : '0'}
              cursor="pointer"
              onClick={() => onMediaClick('file', getCombinedLogoUrl(message.file))}
              _hover={{ opacity: 0.9 }}
            >
              <Icon as={FiFile} />
              <Text fontSize="sm">📄 Dosya - Açmak için tıklayın</Text>
            </HStack>
          )}
          
          {/* Text Content */}
          {message.text && (
            <Text fontSize="sm" whiteSpace="pre-wrap">
              <HighlightText text={message.text} searchQuery={searchQuery} />
            </Text>
          )}
          
          <Text fontSize="xs" color={isOwn ? 'blue.100' : 'gray.400'} textAlign="right" mt="1">
            {time}
          </Text>
        </Box>
        
        {/* Reply button for other's messages (right side) */}
        {!isOwn && (
          <IconButton
            icon={<FiCornerUpLeft />}
            size="xs"
            variant="ghost"
            opacity="0"
            _groupHover={{opacity: 1}}
            onClick={() => onReply(message)}
            aria-label="Cevapla"
            title="Cevapla"
          />
        )}
      </HStack>
    </Flex>
  );
};

const ChannelChat = () => {
  const {channelId} = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const messageRefs = useRef({});
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const previousScrollHeight = useRef(0);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Media preview modal state
  const mediaModal = useDisclosure();
  const [previewMedia, setPreviewMedia] = useState({ type: null, url: null, fileName: null });

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // File inputs
  const imageInput = useFileInput({accept: 'image/*'});
  const videoInput = useFileInput({accept: 'video/*'});
  const audioInput = useFileInput({accept: 'audio/*'});
  const fileInput = useFileInput({accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'});

  // Fetch channel details
  const {data: channel, isLoading: isLoadingChannel} = useQuery({
    queryKey: ['channel-detail', channelId],
    queryFn: () => api.getChannel(channelId),
    select: (res) => res.data,
  });

  // Fetch messages with pagination
  const PAGE_SIZE = 30;
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['channel-messages', channelId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.getChannelMessages(channelId, {
        limit: PAGE_SIZE,
        page: pageParam,
        sortBy: 'createdAt:desc'
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (body) => api.sendChannelMessage(channelId, body),
    onSuccess: () => {
      queryClient.invalidateQueries(['channel-messages', channelId]);
      setMessageText('');
      setReplyTo(null);
      imageInput.reset();
      videoInput.reset();
      audioInput.reset();
      fileInput.reset();
      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
      }, 100);
    },
  });

  // Flatten all pages into a single array and reverse for chronological order
  const allMessages = React.useMemo(() => {
    if (!messagesData?.pages) return [];
    const msgs = messagesData.pages.flatMap(page => page.results || []);
    // Messages come in desc order (newest first), reverse for display (oldest at top)
    return [...msgs].reverse();
  }, [messagesData]);

  // Scroll to bottom only on initial load or new message sent
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
  
  useEffect(() => {
    if (allMessages.length > 0 && !hasInitialScroll) {
      messagesEndRef.current?.scrollIntoView({behavior: 'auto'});
      setHasInitialScroll(true);
    }
  }, [allMessages, hasInitialScroll]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight.current > 0 && !isLoadingMore) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop = scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [allMessages, isLoadingMore]);

  // Handle scroll to load more messages
  const handleScroll = async (e) => {
    const container = e.target;
    // If scrolled near top (within 50px) and there are more pages
    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage && !isLoadingMore) {
      setIsLoadingMore(true);
      previousScrollHeight.current = container.scrollHeight;
      await fetchNextPage();
      setIsLoadingMore(false);
    }
  };

  // Get current user ID from stored user data
  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  const handleSendMessage = async () => {
    if (!messageText.trim() && !imageInput.objectUrl && !videoInput.objectUrl && !audioInput.objectUrl && !fileInput.objectUrl) {
      return;
    }

    try {
      setIsSending(true);
      const body = {text: messageText};

      // Add reply reference if replying
      if (replyTo) {
        body.replyTo = replyTo.id || replyTo._id;
      }

      // Upload media if present
      if (imageInput.objectUrl) {
        const url = await imageInput.upload();
        if (url) body.image = url;
      }
      if (videoInput.objectUrl) {
        const url = await videoInput.upload();
        if (url) body.video = url;
      }
      if (audioInput.objectUrl) {
        const url = await audioInput.upload();
        if (url) body.audio = url;
      }
      if (fileInput.objectUrl) {
        const url = await fileInput.upload();
        if (url) body.file = url;
      }

      await sendMessageMutation.mutateAsync(body);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  // Search functions
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    
    const results = messages.filter(msg => 
      msg.text?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    
    // Scroll to first result
    if (results.length > 0) {
      scrollToMessage(results[0].id || results[0]._id);
    }
  };

  const scrollToMessage = (messageId) => {
    const ref = messageRefs.current[messageId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex].id || searchResults[nextIndex]._id);
  };

  const goToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex].id || searchResults[prevIndex]._id);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  };

  const currentHighlightedId = searchResults[currentSearchIndex]?.id || searchResults[currentSearchIndex]?._id;

  // Media preview handler
  const handleMediaClick = (type, url, fileName = null) => {
    setPreviewMedia({ type, url, fileName });
    mediaModal.onOpen();
  };

  // Emoji handler
  const onEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if any media is selected
  const hasMediaAttachment = imageInput.objectUrl || videoInput.objectUrl || audioInput.objectUrl || fileInput.objectUrl;

  // Use the already processed allMessages
  const messages = allMessages;

  if (isLoadingChannel) {
    return (
      <Page>
        <Box textAlign="center" py="20">
          <Spinner size="xl" color="blue.500" />
        </Box>
      </Page>
    );
  }

  return (
    <Page>
      {/* Header */}
      <Box
        bg="white"
        p="4"
        borderRadius="xl"
        boxShadow="sm"
        mb="4"
      >
        <HStack justify="space-between">
          <HStack spacing="4">
            <IconButton
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate('/dashboard/messaging/channels')}
              aria-label="Geri"
            />
            <Avatar
              size="md"
              name={channel?.name}
              src={getCombinedLogoUrl(channel?.thumbnail)}
            />
            <VStack align="start" spacing="0">
              <Text fontWeight="600">{channel?.name}</Text>
              <Text fontSize="xs" color="gray.500">
                {channel?.type === 'vip' ? 'VIP Kanal' : channel?.type === 'market' ? 'Piyasa Kanalı' : 'Kanal'}
                {' • '}
                {channel?.messageCount || 0} mesaj
              </Text>
            </VStack>
          </HStack>
          <HStack spacing="2">
            <Tooltip label="Ara">
              <IconButton
                icon={<FiSearch />}
                variant={isSearchOpen ? 'solid' : 'ghost'}
                colorScheme={isSearchOpen ? 'blue' : 'gray'}
                onClick={toggleSearch}
                aria-label="Ara"
              />
            </Tooltip>
            <Tooltip label="Yenile">
              <IconButton
                icon={<FiRefreshCw />}
                variant="ghost"
                onClick={() => refetchMessages()}
                aria-label="Yenile"
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* Search Bar */}
        <Collapse in={isSearchOpen} animateOpacity>
          <Box mt="4">
            <HStack spacing="2">
              <InputGroup size="md">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Mesajlarda ara..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'blue.400', bg: 'white' }}
                />
                {searchQuery && (
                  <InputRightElement width="auto" pr="2">
                    <HStack spacing="1">
                      {searchResults.length > 0 && (
                        <Badge colorScheme="blue" fontSize="xs">
                          {currentSearchIndex + 1}/{searchResults.length}
                        </Badge>
                      )}
                      <IconButton
                        icon={<FiX />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleSearch('')}
                        aria-label="Temizle"
                      />
                    </HStack>
                  </InputRightElement>
                )}
              </InputGroup>
              
              {searchResults.length > 0 && (
                <HStack spacing="1">
                  <Tooltip label="Önceki">
                    <IconButton
                      icon={<FiChevronUp />}
                      size="sm"
                      variant="outline"
                      onClick={goToPrevResult}
                      aria-label="Önceki"
                    />
                  </Tooltip>
                  <Tooltip label="Sonraki">
                    <IconButton
                      icon={<FiChevronDown />}
                      size="sm"
                      variant="outline"
                      onClick={goToNextResult}
                      aria-label="Sonraki"
                    />
                  </Tooltip>
                </HStack>
              )}
            </HStack>
            
            {searchQuery && searchResults.length === 0 && (
              <Text fontSize="sm" color="gray.500" mt="2">
                "{searchQuery}" için sonuç bulunamadı
              </Text>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        bg="gray.50"
        borderRadius="xl"
        p="4"
        height="calc(100vh - 380px)"
        overflowY="auto"
        mb="4"
        onScroll={handleScroll}
      >
        {isLoadingMessages ? (
          <Box textAlign="center" py="10">
            <Spinner size="lg" color="blue.500" />
          </Box>
        ) : messages.length === 0 ? (
          <Box textAlign="center" py="10">
            <Text color="gray.500">Henüz mesaj yok. İlk mesajı siz gönderin!</Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing="0">
            {/* Loading indicator for older messages */}
            {(isFetchingNextPage || isLoadingMore) && (
              <Box textAlign="center" py="4">
                <HStack justify="center" spacing="2">
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="sm" color="gray.500">Eski mesajlar yükleniyor...</Text>
                </HStack>
              </Box>
            )}
            
            {/* Load more indicator */}
            {hasNextPage && !isFetchingNextPage && !isLoadingMore && (
              <Box textAlign="center" py="3">
                <Text fontSize="xs" color="gray.400">
                  ↑ Eski mesajları görmek için yukarı kaydırın
                </Text>
              </Box>
            )}
            
            {/* No more messages indicator */}
            {!hasNextPage && messages.length > PAGE_SIZE && (
              <Box textAlign="center" py="3">
                <Text fontSize="xs" color="gray.400">
                  — Tüm mesajlar yüklendi —
                </Text>
              </Box>
            )}

            {messages.map((message) => {
              const messageId = message.id || message._id;
              return (
                <MessageBubble
                  key={messageId}
                  message={message}
                  isOwn={message.user?.id === currentUserId}
                  onReply={handleReply}
                  allMessages={messages}
                  searchQuery={searchQuery}
                  isHighlighted={messageId === currentHighlightedId}
                  messageRef={(el) => { messageRefs.current[messageId] = el; }}
                  onMediaClick={handleMediaClick}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      {/* Reply Preview */}
      {replyTo && (
        <Box bg="white" p="3" borderRadius="lg" mb="2" boxShadow="sm">
          <HStack justify="space-between" align="start">
            <HStack spacing="3" flex="1">
              <Box
                w="1"
                alignSelf="stretch"
                bg="blue.500"
                borderRadius="full"
              />
              <VStack align="start" spacing="0" flex="1">
                <HStack>
                  <Icon as={FiCornerUpLeft} color="blue.500" boxSize="3" />
                  <Text fontSize="xs" fontWeight="600" color="blue.500">
                    {replyTo.user?.fullname || 'Kullanıcı'} kişisine cevap
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.600" noOfLines={2}>
                  {replyTo.text || (replyTo.image ? '📷 Görsel' : replyTo.video ? '🎬 Video' : replyTo.audio ? '🎵 Ses' : replyTo.file ? '📄 Dosya' : 'Mesaj')}
                </Text>
              </VStack>
            </HStack>
            <IconButton
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={cancelReply}
              aria-label="İptal"
            />
          </HStack>
        </Box>
      )}

      {/* Media Preview */}
      {hasMediaAttachment && (
        <Box bg="white" p="3" borderRadius="lg" mb="2" boxShadow="sm">
          <HStack spacing="3" flexWrap="wrap">
            {imageInput.objectUrl && (
              <Box position="relative">
                <ChakraImage
                  src={imageInput.objectUrl}
                  alt="Görsel"
                  maxH="60px"
                  borderRadius="md"
                />
                <IconButton
                  icon={<Text fontSize="xs">×</Text>}
                  size="xs"
                  colorScheme="red"
                  position="absolute"
                  top="-1"
                  right="-1"
                  borderRadius="full"
                  onClick={() => imageInput.reset()}
                  aria-label="Kaldır"
                />
              </Box>
            )}
            {videoInput.objectUrl && (
              <HStack bg="gray.100" p="2" borderRadius="md">
                <Icon as={FiVideo} />
                <Text fontSize="sm">Video</Text>
                <IconButton
                  icon={<Text fontSize="xs">×</Text>}
                  size="xs"
                  colorScheme="red"
                  onClick={() => videoInput.reset()}
                  aria-label="Kaldır"
                />
              </HStack>
            )}
            {audioInput.objectUrl && (
              <HStack bg="gray.100" p="2" borderRadius="md">
                <Icon as={FiMusic} />
                <Text fontSize="sm">Ses</Text>
                <IconButton
                  icon={<Text fontSize="xs">×</Text>}
                  size="xs"
                  colorScheme="red"
                  onClick={() => audioInput.reset()}
                  aria-label="Kaldır"
                />
              </HStack>
            )}
            {fileInput.objectUrl && (
              <HStack bg="gray.100" p="2" borderRadius="md">
                <Icon as={FiFile} />
                <Text fontSize="sm">{fileInput.file?.name || 'Dosya'}</Text>
                <IconButton
                  icon={<Text fontSize="xs">×</Text>}
                  size="xs"
                  colorScheme="red"
                  onClick={() => fileInput.reset()}
                  aria-label="Kaldır"
                />
              </HStack>
            )}
          </HStack>
        </Box>
      )}

      {/* Input Area */}
      <Box bg="white" p="4" borderRadius="xl" boxShadow="sm">
        <HStack spacing="3">
          {/* Attachment Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiPaperclip />}
              variant="ghost"
              aria-label="Dosya ekle"
            />
            <MenuList>
              <MenuItem icon={<FiImage />} onClick={() => imageInput.open()}>
                Görsel
              </MenuItem>
              <MenuItem icon={<FiVideo />} onClick={() => videoInput.open()}>
                Video
              </MenuItem>
              <MenuItem icon={<FiMusic />} onClick={() => audioInput.open()}>
                Ses
              </MenuItem>
              <MenuItem icon={<FiFile />} onClick={() => fileInput.open()}>
                Dosya
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Hidden file inputs */}
          {imageInput.input}
          {videoInput.input}
          {audioInput.input}
          {fileInput.input}

          {/* Emoji Picker */}
          <Popover
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            placement="top-start"
          >
            <PopoverTrigger>
              <IconButton
                icon={<FiSmile />}
                variant="ghost"
                aria-label="Emoji ekle"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                color={showEmojiPicker ? 'blue.500' : 'gray.500'}
              />
            </PopoverTrigger>
            <PopoverContent width="350px" border="none" boxShadow="xl">
              <PopoverBody p="0">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width="100%"
                  height="350px"
                  searchPlaceholder="Emoji ara..."
                  previewConfig={{ showPreview: false }}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* Message Input */}
          <Input
            ref={inputRef}
            placeholder={replyTo ? `${replyTo.user?.fullname || 'Kullanıcı'} kişisine cevap yazın...` : "Mesaj yazın..."}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            size="lg"
            flex="1"
          />

          {/* Send Button */}
          <IconButton
            icon={<FiSend />}
            colorScheme="blue"
            size="lg"
            onClick={handleSendMessage}
            isLoading={isSending}
            isDisabled={isSending || (!messageText.trim() && !hasMediaAttachment)}
            aria-label="Gönder"
          />
        </HStack>
      </Box>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={mediaModal.isOpen}
        onClose={mediaModal.onClose}
        mediaType={previewMedia.type}
        mediaUrl={previewMedia.url}
        fileName={previewMedia.fileName}
      />
    </Page>
  );
};

export default ChannelChat;

