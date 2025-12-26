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
  Button,
  useToast,
} from '@chakra-ui/react';
import {useQuery, useMutation, useQueryClient, useInfiniteQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {
  FiSend,
  FiArrowLeft,
  FiImage,
  FiVideo,
  FiVideoOff,
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
  FiBarChart2,
  FiCheck,
  FiTrash2,
  FiCheckSquare,
  FiSquare,
  FiShield,
  FiShare2,
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import {getCombinedLogoUrl} from '../../../utils/image';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import useFileInput from '../../../hooks/useFileInput';
import {getErrorMessage} from '../../../utils/string';
import VideoConference from '../../../components/conference/VideoConference';
import ForwardMessageModal from '../../../components/modals/ForwardMessageModal';

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

const MessageBubble = ({message, isOwn, onReply, allMessages, searchQuery, isHighlighted, messageRef, onMediaClick, onJoinConference, onVotePoll, onClosePoll, currentUserId, isSelectMode, isSelected, onSelect}) => {
  const time = message.createdAt 
    ? format(new Date(message.createdAt), 'HH:mm', {locale: tr})
    : '';

  const hasMedia = message.image || message.video || message.audio || message.file || message.conference?.roomId;

  // Handle click in select mode
  const handleClick = () => {
    if (isSelectMode && onSelect) {
      onSelect(message.id || message._id);
    }
  };

  // Find the replied message if exists
  // replyTo can be an object with _id, user, text OR a string ID
  const repliedMessage = React.useMemo(() => {
    // If we have a 'parent' field which is an object, use it (populated from backend)
    if (message.parent && typeof message.parent === 'object') {
      return message.parent;
    }

    if (!message.replyTo) return null;
    
    // If replyTo is already an object with _id AND user info, use it directly
    if (typeof message.replyTo === 'object') {
      // Must have _id and user to be valid
      if (message.replyTo._id && message.replyTo.user) {
        return message.replyTo;
      }
      // Empty or invalid object, ignore
      return null;
    }
    
    // If replyTo is a string ID, find the message
    if (typeof message.replyTo === 'string' && message.replyTo.length > 0) {
      return allMessages?.find(m => m.id === message.replyTo || m._id === message.replyTo);
    }
    
    return null;
  }, [message.replyTo, message.parent, allMessages]);

  // Blocked message rendering
  if (message.isBlocked) {
    return (
      <Flex 
        ref={messageRef}
        justify={isOwn ? 'flex-end' : 'flex-start'} 
        mb="3"
      >
        <Box
          maxW="70%"
          bg="red.50"
          border="1px dashed"
          borderColor="red.300"
          px="4"
          py="3"
          borderRadius="lg"
        >
          <HStack spacing="2" mb="2">
            <Icon as={FiShield} color="red.600" />
            <Text fontSize="sm" fontWeight="600" color="red.700">
              Engellenmiş Mesaj
            </Text>
          </HStack>
          <Text fontSize="sm" color="red.600" fontStyle="italic">
            Bu mesaj kurallara aykırı olduğundan Admin tarafından engellenmiştir.
          </Text>
          {message.blockReason && (
            <Text fontSize="xs" color="red.500" mt="2">
              Sebep: {message.blockReason}
            </Text>
          )}
          <Text fontSize="xs" color="gray.500" mt="2">
            {time}
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex 
      ref={messageRef}
      justify={isOwn ? 'flex-end' : 'flex-start'} 
      mb="3" 
      role="group"
      bg={isHighlighted ? 'yellow.100' : isSelected ? 'blue.50' : 'transparent'}
      mx={isHighlighted ? '-4' : '0'}
      px={isHighlighted ? '4' : '0'}
      py={isHighlighted ? '2' : '0'}
      borderRadius="lg"
      transition="all 0.3s"
      cursor={isSelectMode ? 'pointer' : 'default'}
      onClick={isSelectMode ? handleClick : undefined}
      _hover={isSelectMode ? { bg: isSelected ? 'blue.100' : 'gray.50' } : {}}
      border={isSelected ? '2px solid' : 'none'}
      borderColor={isSelected ? 'blue.400' : 'transparent'}
    >
      {/* Selection Checkbox */}
      {isSelectMode && (
        <Box 
          mr="2" 
          display="flex" 
          alignItems="center"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Icon 
            as={isSelected ? FiCheckSquare : FiSquare} 
            color={isSelected ? 'blue.500' : 'gray.400'} 
            boxSize="5"
          />
        </Box>
      )}
      <HStack align="end" spacing="2" maxW={isSelectMode ? '65%' : '70%'}>
        {!isOwn && (
          <Avatar
            size="sm"
            name={message.user?.fullname}
            src={getCombinedLogoUrl(message.user?.thumbnail)}
          />
        )}
        
        {/* Reply button for own messages (left side) */}
        {isOwn && (
          <VStack spacing={0} opacity="0" _groupHover={{opacity: 1}}>
            <IconButton
              icon={<FiCornerUpLeft />}
              size="xs"
              variant="ghost"
              onClick={() => onReply(message)}
              aria-label="Cevapla"
              title="Cevapla"
            />
            <IconButton
              icon={<FiShare2 />}
              size="xs"
              variant="ghost"
              onClick={() => onForward && onForward(message)}
              aria-label="İlet"
              title="İlet"
            />
          </VStack>
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
          
          {/* Reply Preview - Don't show for conference messages */}
          {repliedMessage && !message.conference?.roomId && (
            <Box
              bg={isOwn ? 'blue.400' : 'gray.100'}
              p="2"
              borderRadius="md"
              mb="2"
              borderLeft="3px solid"
              borderLeftColor={isOwn ? 'blue.200' : 'blue.400'}
              cursor="pointer"
              onClick={() => onReplyClick && onReplyClick(repliedMessage.id || repliedMessage._id)}
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

          {/* Conference Message - Only show if roomId exists */}
          {message.conference?.roomId && (() => {
            // Determine conference status
            const now = new Date();
            let confStatus = 'unknown'; // Default to unknown for old messages
            
            // Check if message has new status fields
            const hasStatusFields = message.conference.startTime || 
                                   message.conference.scheduledEndTime || 
                                   message.conference.isActive !== undefined;
            
            if (hasStatusFields) {
              confStatus = 'active'; // Has fields, assume active unless proven otherwise
              
              if (message.conference.startTime) {
                const startDate = new Date(message.conference.startTime);
                if (startDate > now && !message.conference.isActive) {
                  confStatus = 'upcoming';
                }
              }
              
              if (message.conference.scheduledEndTime) {
                const endDate = new Date(message.conference.scheduledEndTime);
                if (endDate < now) {
                  confStatus = 'ended';
                }
              }
              
              if (message.conference.isActive === false && message.conference.startTime) {
                const startDate = new Date(message.conference.startTime);
                if (startDate < now) {
                  confStatus = 'ended';
                }
              }
            }
            
            const bgColors = {
              active: isOwn ? 'green.500' : 'green.50',
              upcoming: isOwn ? 'orange.500' : 'orange.50',
              ended: isOwn ? 'gray.500' : 'gray.100',
              unknown: isOwn ? 'blue.500' : 'blue.50',
            };
            
            const borderColors = {
              active: isOwn ? 'green.400' : 'green.200',
              upcoming: isOwn ? 'orange.400' : 'orange.200',
              ended: isOwn ? 'gray.400' : 'gray.200',
              unknown: isOwn ? 'blue.400' : 'blue.200',
            };
            
            const iconBgColors = {
              active: isOwn ? 'green.400' : 'green.100',
              upcoming: isOwn ? 'orange.400' : 'orange.100',
              ended: isOwn ? 'gray.400' : 'gray.200',
              unknown: isOwn ? 'blue.400' : 'blue.100',
            };
            
            const textColors = {
              active: isOwn ? 'white' : 'green.700',
              upcoming: isOwn ? 'white' : 'orange.700',
              ended: isOwn ? 'white' : 'gray.600',
              unknown: isOwn ? 'white' : 'blue.700',
            };
            
            const subTextColors = {
              active: isOwn ? 'green.100' : 'green.600',
              upcoming: isOwn ? 'orange.100' : 'orange.600',
              ended: isOwn ? 'gray.200' : 'gray.500',
              unknown: isOwn ? 'blue.100' : 'blue.600',
            };
            
            const icons = {
              active: '🎥',
              upcoming: '⏰',
              ended: '🔴',
              unknown: '🎥',
            };
            
            const statusTexts = {
              active: '📞 Görüşmeye Katıl',
              upcoming: '⏳ Henüz Başlamadı',
              ended: '✖️ Sona Erdi',
              unknown: '📞 Durumu Kontrol Et',
            };
            
            return (
              <Box
                bg={bgColors[confStatus]}
                p="4"
                borderRadius="lg"
                mb={message.text ? '2' : '0'}
                cursor={confStatus === 'active' || confStatus === 'unknown' ? 'pointer' : 'not-allowed'}
                onClick={() => onJoinConference?.(message.conference)}
                _hover={confStatus === 'active' || confStatus === 'unknown' ? { opacity: 0.9, transform: 'scale(1.02)' } : {}}
                transition="all 0.2s"
                border="2px solid"
                borderColor={borderColors[confStatus]}
                opacity={confStatus === 'ended' ? 0.7 : 1}
              >
                <HStack spacing="3" mb="2">
                  <Box
                    bg={iconBgColors[confStatus]}
                    p="2"
                    borderRadius="full"
                  >
                    <Icon as={confStatus === 'ended' ? FiVideoOff : FiVideo} color={textColors[confStatus]} boxSize="5" />
                  </Box>
                  <VStack align="start" spacing="0">
                    <Text fontWeight="bold" fontSize="sm" color={textColors[confStatus]}>
                      {icons[confStatus]} Video Görüşme
                    </Text>
                    <Text fontSize="xs" color={subTextColors[confStatus]}>
                      {message.conference.title || 'Video konferans'}
                    </Text>
                  </VStack>
                </HStack>
                <Box
                  bg={iconBgColors[confStatus]}
                  px="3"
                  py="2"
                  borderRadius="md"
                  textAlign="center"
                >
                  <Text fontSize="sm" fontWeight="600" color={textColors[confStatus]}>
                    {statusTexts[confStatus]}
                  </Text>
                </Box>
              </Box>
            );
          })()}
          
          {/* Poll Message */}
          {(message.poll?.id || message.poll?._id) && (() => {
            const poll = message.poll;
            const pollId = poll.id || poll._id;
            const totalVotes = poll.totalVotes || poll.votes?.length || 0;
            const hasVoted = poll.votes?.some(v => {
              const odaId = typeof v.user === 'string' ? v.user : (v.user?.id || v.user?._id);
              return odaId === currentUserId;
            });
            const myVote = poll.votes?.find(v => {
              const odaId = typeof v.user === 'string' ? v.user : (v.user?.id || v.user?._id);
              return odaId === currentUserId;
            });
            
            const getPercentage = (optionIndex) => {
              if (totalVotes === 0) return 0;
              return Math.round((poll.options[optionIndex].voteCount / totalVotes) * 100);
            };
            
            return (
              <Box
                bg={isOwn ? 'purple.500' : 'gray.50'}
                p="4"
                borderRadius="lg"
                mb={message.text ? '2' : '0'}
                border="2px solid"
                borderColor={isOwn ? 'purple.400' : 'purple.200'}
              >
                <HStack spacing="3" mb="3">
                  <Box
                    bg={isOwn ? 'purple.400' : 'purple.100'}
                    p="2"
                    borderRadius="full"
                  >
                    <Icon as={FiBarChart2} color={isOwn ? 'white' : 'purple.600'} boxSize="5" />
                  </Box>
                  <VStack align="start" spacing="0" flex="1">
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold" fontSize="sm" color={isOwn ? 'white' : 'purple.700'}>
                        📊 Anket
                      </Text>
                      {poll.isActive ? (
                        <Badge colorScheme="green" size="sm">Aktif</Badge>
                      ) : (
                        <Badge colorScheme="gray" size="sm">Kapandı</Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                
                <Text fontWeight="600" fontSize="md" color={isOwn ? 'white' : 'gray.800'} mb="3">
                  {poll.question}
                </Text>
                
                <VStack spacing="2" align="stretch">
                  {poll.options.map((option, index) => {
                    const isSelected = myVote?.optionIndex === index;
                    const percentage = getPercentage(index);
                    // Show results if voted, poll inactive, or showResults is not explicitly false (default true)
                    const showResults = hasVoted || !poll.isActive || poll.showResults !== false;
                    
                    return (
                      <Box
                        key={index}
                        position="relative"
                        bg={isOwn ? (isSelected ? 'purple.300' : 'purple.400') : (isSelected ? 'purple.100' : 'gray.100')}
                        borderRadius="md"
                        p="2"
                        cursor={poll.isActive && !hasVoted ? 'pointer' : 'default'}
                        onClick={() => {
                          if (poll.isActive && !hasVoted && onVotePoll) {
                            onVotePoll(pollId, index);
                          }
                        }}
                        _hover={poll.isActive && !hasVoted ? { opacity: 0.9 } : {}}
                        border={isSelected ? '2px solid' : 'none'}
                        borderColor={isOwn ? 'white' : 'purple.500'}
                        overflow="hidden"
                      >
                        {showResults && (
                          <Box
                            position="absolute"
                            left="0"
                            top="0"
                            bottom="0"
                            width={`${percentage}%`}
                            bg={isOwn ? 'rgba(255,255,255,0.2)' : 'purple.200'}
                            transition="width 0.5s"
                          />
                        )}
                        <HStack position="relative" justify="space-between" align="center">
                          <HStack spacing="2" flex="1">
                            {isSelected && <Icon as={FiCheck} color={isOwn ? 'white' : 'purple.600'} />}
                            <VStack align="start" spacing="0">
                              <Text fontSize="sm" color={isOwn ? 'white' : 'gray.700'}>{option.text}</Text>
                              {showResults && (
                                <Text fontSize="xs" color={isOwn ? 'purple.100' : 'gray.500'}>
                                  {option.voteCount || 0} oy
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                          {showResults && (
                            <Box
                              bg={isOwn ? 'whiteAlpha.300' : 'purple.100'}
                              px="2"
                              py="1"
                              borderRadius="md"
                              minW="50px"
                              textAlign="center"
                            >
                              <Text fontSize="sm" fontWeight="bold" color={isOwn ? 'white' : 'purple.600'}>
                                {percentage}%
                              </Text>
                            </Box>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
                
                <HStack mt="3" justify="space-between">
                  <Text fontSize="xs" color={isOwn ? 'purple.100' : 'gray.500'}>
                    {totalVotes} oy
                  </Text>
                  {(poll.createdBy?.id || poll.createdBy?._id) === currentUserId && poll.isActive && onClosePoll && (
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => onClosePoll(pollId)}
                    >
                      Anketi Kapat
                    </Button>
                  )}
                </HStack>
              </Box>
            );
          })()}
          
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
          <VStack spacing={0} opacity="0" _groupHover={{opacity: 1}}>
            <IconButton
              icon={<FiCornerUpLeft />}
              size="xs"
              variant="ghost"
              onClick={() => onReply(message)}
              aria-label="Cevapla"
              title="Cevapla"
            />
            <IconButton
              icon={<FiShare2 />}
              size="xs"
              variant="ghost"
              onClick={() => onForward && onForward(message)}
              aria-label="İlet"
              title="İlet"
            />
          </VStack>
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

  // Video call modal state
  const {isOpen: isVideoCallOpen, onOpen: onVideoCallOpen, onClose: onVideoCallClose} = useDisclosure();
  const [currentConferenceData, setCurrentConferenceData] = useState(null);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Poll modal state
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  // Multi-select delete state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

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
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true, // Keep polling even when tab is not focused
    refetchOnWindowFocus: true, // Refetch when window regains focus
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

      // Add reply reference if replying (send as object with message preview)
      if (replyTo) {
        body.replyTo = {
          _id: replyTo.id || replyTo._id,
          user: {
            fullname: replyTo.user?.fullname || 'Kullanıcı',
            thumbnail: replyTo.user?.thumbnail || null,
          },
          text: replyTo.text || null,
          image: replyTo.image || null,
          video: replyTo.video || null,
          audio: replyTo.audio || null,
          file: replyTo.file || null,
        };
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

  // Create and send conference message
  const handleCreateConference = async () => {
    try {
      setIsSending(true);
      
      // Clear any reply state
      setReplyTo(null);
      
      // Generate unique room ID
      const roomId = `hissechat-${channelId}-${Date.now()}`;
      const conferenceTitle = `${channel?.name || 'Kanal'} Video Görüşmesi`;
      const startTime = new Date().toISOString();
      const scheduledEndTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour later
      
      // Create conference in backend
      await api.createConference({
        roomId,
        title: conferenceTitle,
        channelId,
      });
      
      // Send conference message to channel (no text, just conference card)
      const conferenceBody = {
        conference: {
          roomId,
          title: conferenceTitle,
          startTime,
          scheduledEndTime,
          isActive: true,
        },
      };

      await sendMessageMutation.mutateAsync(conferenceBody);
      
      // Set conference data and open modal
      setCurrentConferenceData({
        roomId,
        title: conferenceTitle,
        channelId,
      });
      onVideoCallOpen();
      
      toast({
        title: 'Video görüşme başlatıldı',
        description: 'Kanal üyelerine bildirim gönderildi',
        status: 'success',
        position: 'top',
      });
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

  // Check conference status helper (from message data)
  const getConferenceStatusFromMessage = (conferenceData) => {
    const now = new Date();
    
    // If startTime exists and is in the future
    if (conferenceData.startTime) {
      const startDate = new Date(conferenceData.startTime);
      if (startDate > now && !conferenceData.isActive) {
        return {
          status: 'upcoming',
          message: `Bu konferans henüz başlamadı.\nBaşlama zamanı: ${startDate.toLocaleString('tr-TR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
          })}`,
        };
      }
    }
    
    // If endTime exists and has passed
    if (conferenceData.scheduledEndTime) {
      const endDate = new Date(conferenceData.scheduledEndTime);
      if (endDate < now) {
        return {
          status: 'ended',
          message: 'Bu konferans sona ermiş.',
        };
      }
    }
    
    // If explicitly marked as not active and has a start time in the past
    if (conferenceData.isActive === false && conferenceData.startTime) {
      const startDate = new Date(conferenceData.startTime);
      if (startDate < now) {
        return {
          status: 'ended',
          message: 'Bu konferans sona ermiş.',
        };
      }
    }
    
    return { status: 'unknown', message: '' }; // Need to check backend
  };

  // Join existing conference from message
  const handleJoinConference = async (conferenceData) => {
    if (!conferenceData) {
      toast({
        title: 'Konferans bilgisi bulunamadı',
        status: 'error',
        position: 'top',
      });
      return;
    }
    
    // Extract roomId - either directly or from jitsiUrl
    let roomId = conferenceData.roomId;
    if (!roomId && conferenceData.jitsiUrl) {
      const urlParts = conferenceData.jitsiUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      roomId = lastPart.split('#')[0];
    }
    
    if (!roomId) {
      toast({
        title: 'Konferans odası bulunamadı',
        status: 'error',
        position: 'top',
      });
      return;
    }
    
    // First check from message data
    const messageStatus = getConferenceStatusFromMessage(conferenceData);
    
    if (messageStatus.status === 'upcoming') {
      toast({
        title: '⏰ Henüz Başlamadı',
        description: messageStatus.message,
        status: 'warning',
        position: 'top',
        duration: 5000,
      });
      return;
    }
    
    if (messageStatus.status === 'ended') {
      toast({
        title: '🔴 Konferans Sona Erdi',
        description: messageStatus.message,
        status: 'error',
        position: 'top',
        duration: 5000,
      });
      return;
    }
    
    // If status unknown (old messages without new fields), check backend
    if (messageStatus.status === 'unknown') {
      try {
        const response = await api.getConferenceByRoom(roomId);
        const backendConference = response?.data;
        
        if (!backendConference) {
          toast({
            title: '🔴 Konferans Bulunamadı',
            description: 'Bu konferans artık mevcut değil.',
            status: 'error',
            position: 'top',
            duration: 5000,
          });
          return;
        }
        
        const now = new Date();
        
        // Check if conference has ended
        if (backendConference.scheduledEndTime) {
          const endDate = new Date(backendConference.scheduledEndTime);
          if (endDate < now) {
            toast({
              title: '🔴 Konferans Sona Erdi',
              description: 'Bu konferans sona ermiş.',
              status: 'error',
              position: 'top',
              duration: 5000,
            });
            return;
          }
        }
        
        // Check if conference is not active
        if (backendConference.isActive === false) {
          toast({
            title: '🔴 Konferans Sona Erdi',
            description: 'Bu konferans sona ermiş.',
            status: 'error',
            position: 'top',
            duration: 5000,
          });
          return;
        }
        
        // Check if conference hasn't started yet
        if (backendConference.startTime) {
          const startDate = new Date(backendConference.startTime);
          if (startDate > now && !backendConference.isActive) {
            toast({
              title: '⏰ Henüz Başlamadı',
              description: `Bu konferans henüz başlamadı.\nBaşlama zamanı: ${startDate.toLocaleString('tr-TR', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              })}`,
              status: 'warning',
              position: 'top',
              duration: 5000,
            });
            return;
          }
        }
      } catch (error) {
        // If API fails (e.g., conference not found), show error
        console.error('Conference check error:', error);
        toast({
          title: '🔴 Konferans Bulunamadı',
          description: 'Bu konferans artık mevcut değil veya sona ermiş.',
          status: 'error',
          position: 'top',
          duration: 5000,
        });
        return;
      }
    }
    
    setCurrentConferenceData({
      roomId,
      title: conferenceData.title || 'Video Konferans',
      channelId,
    });
    onVideoCallOpen();
  };

  // Poll handlers
  const handleVotePoll = async (pollId, optionIndex) => {
    try {
      await api.votePoll(pollId, optionIndex);
      queryClient.invalidateQueries(['channel-messages', channelId]);
      toast({
        title: 'Oyunuz kaydedildi',
        status: 'success',
        position: 'top',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Oy verilemedi',
        description: error?.response?.data?.message || 'Bir hata oluştu',
        status: 'error',
        position: 'top',
      });
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!window.confirm('Bu anketi kapatmak istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await api.closePoll(pollId);
      queryClient.invalidateQueries(['channel-messages', channelId]);
      toast({
        title: 'Anket kapatıldı',
        status: 'success',
        position: 'top',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Anket kapatılamadı',
        description: error?.response?.data?.message || 'Bir hata oluştu',
        status: 'error',
        position: 'top',
      });
    }
  };

  const handleCreatePoll = async () => {
    const validOptions = pollOptions.filter(o => o.trim().length > 0);
    if (pollQuestion.trim().length === 0) {
      toast({
        title: 'Soru gerekli',
        status: 'warning',
        position: 'top',
      });
      return;
    }
    if (validOptions.length < 2) {
      toast({
        title: 'En az 2 seçenek gerekli',
        status: 'warning',
        position: 'top',
      });
      return;
    }
    
    try {
      await api.createChannelPoll(channelId, {
        question: pollQuestion.trim(),
        options: validOptions,
        isAnonymous: pollIsAnonymous,
        allowMultiple: pollAllowMultiple,
      });
      queryClient.invalidateQueries(['channel-messages', channelId]);
      setPollModalOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollIsAnonymous(false);
      setPollAllowMultiple(false);
      toast({
        title: 'Anket oluşturuldu',
        status: 'success',
        position: 'top',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Anket oluşturulamadı',
        description: error?.response?.data?.message || 'Bir hata oluştu',
        status: 'error',
        position: 'top',
      });
    }
  };

  // Multi-select delete functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedMessageIds(new Set());
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const selectAllMessages = () => {
    const allIds = new Set(allMessages.map(m => m.id || m._id));
    setSelectedMessageIds(allIds);
  };

  const clearSelection = () => {
    setSelectedMessageIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.size === 0) {
      toast({
        title: 'Mesaj seçilmedi',
        description: 'Silmek için en az bir mesaj seçin',
        status: 'warning',
        position: 'top',
      });
      return;
    }

    const confirmDelete = window.confirm(
      `${selectedMessageIds.size} mesaj silinecek. Emin misiniz?`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const messageIdsArray = Array.from(selectedMessageIds);
      const results = await api.deleteChannelMessages(channelId, messageIdsArray);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        queryClient.invalidateQueries(['channel-messages', channelId]);
        toast({
          title: 'Mesajlar silindi',
          description: `${successCount} mesaj başarıyla silindi${failCount > 0 ? `, ${failCount} mesaj silinemedi` : ''}`,
          status: 'success',
          position: 'top',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Silme başarısız',
          description: 'Mesajlar silinemedi',
          status: 'error',
          position: 'top',
        });
      }

      setSelectedMessageIds(new Set());
      setIsSelectMode(false);
    } catch (error) {
      toast({
        title: 'Silme hatası',
        description: error?.response?.data?.message || 'Bir hata oluştu',
        status: 'error',
        position: 'top',
      });
    } finally {
      setIsDeleting(false);
    }
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
            {/* Select Mode Controls */}
            {isSelectMode ? (
              <>
                <Badge colorScheme="blue" fontSize="sm" px="2" py="1">
                  {selectedMessageIds.size} seçili
                </Badge>
                <Tooltip label="Tümünü Seç">
                  <IconButton
                    icon={<FiCheckSquare />}
                    variant="ghost"
                    colorScheme="blue"
                    onClick={selectAllMessages}
                    aria-label="Tümünü Seç"
                  />
                </Tooltip>
                <Tooltip label="Seçimi Temizle">
                  <IconButton
                    icon={<FiSquare />}
                    variant="ghost"
                    onClick={clearSelection}
                    aria-label="Seçimi Temizle"
                  />
                </Tooltip>
                <Tooltip label="Seçilenleri Sil">
                  <IconButton
                    icon={<FiTrash2 />}
                    variant="solid"
                    colorScheme="red"
                    onClick={handleDeleteSelected}
                    isLoading={isDeleting}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenleri Sil"
                  />
                </Tooltip>
                <Tooltip label="Seçim Modundan Çık">
                  <IconButton
                    icon={<FiX />}
                    variant="ghost"
                    onClick={toggleSelectMode}
                    aria-label="İptal"
                  />
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip label="Mesaj Seç ve Sil">
                  <IconButton
                    icon={<FiTrash2 />}
                    variant="ghost"
                    colorScheme="red"
                    onClick={toggleSelectMode}
                    aria-label="Mesaj Sil"
                  />
                </Tooltip>
                <Tooltip label="Anket Oluştur">
                  <IconButton
                    icon={<FiBarChart2 />}
                    variant="ghost"
                    colorScheme="purple"
                    onClick={() => setPollModalOpen(true)}
                    aria-label="Anket Oluştur"
                  />
                </Tooltip>
                <Tooltip label="Video Görüşme Başlat ve Kanala Gönder">
                  <IconButton
                    icon={<FiVideo />}
                    variant="ghost"
                    colorScheme="green"
                    onClick={handleCreateConference}
                    isLoading={isSending}
                    aria-label="Video Görüşme"
                  />
                </Tooltip>
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
              </>
            )}
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
                  onJoinConference={handleJoinConference}
                  onVotePoll={handleVotePoll}
                  onClosePoll={handleClosePoll}
                  currentUserId={currentUserId}
                  isSelectMode={isSelectMode}
                  isSelected={selectedMessageIds.has(messageId)}
                  onSelect={toggleMessageSelection}
                  onReplyClick={scrollToMessage}
                  onForward={handleForward}
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

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={forwardModalOpen}
        onClose={() => {
          setForwardModalOpen(false);
          setMessageToForward(null);
        }}
        messageToForward={messageToForward}
      />

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={mediaModal.isOpen}
        onClose={mediaModal.onClose}
        mediaType={previewMedia.type}
        mediaUrl={previewMedia.url}
        fileName={previewMedia.fileName}
      />

      {/* Video Call - Native Conference */}
      {isVideoCallOpen && currentConferenceData && (
        <VideoConference
          roomId={currentConferenceData.roomId}
          channelId={currentConferenceData.channelId}
          title={currentConferenceData.title}
          onClose={() => {
            setCurrentConferenceData(null);
            onVideoCallClose();
          }}
        />
      )}

      {/* Poll Creation Modal */}
      <Modal isOpen={pollModalOpen} onClose={() => setPollModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <Box p="6">
            <HStack mb="4" justify="space-between">
              <HStack spacing="3">
                <Box bg="purple.100" p="2" borderRadius="full">
                  <Icon as={FiBarChart2} color="purple.600" boxSize="5" />
                </Box>
                <Text fontSize="lg" fontWeight="bold">Anket Oluştur</Text>
              </HStack>
              <ModalCloseButton position="relative" top="0" right="0" />
            </HStack>
            
            <VStack spacing="4" align="stretch">
              {/* Question */}
              <Box>
                <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Soru</Text>
                <Input
                  placeholder="Anket sorusu yazın..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  size="lg"
                />
              </Box>
              
              {/* Options */}
              <Box>
                <Text fontSize="sm" fontWeight="500" color="gray.600" mb="2">Seçenekler (en az 2)</Text>
                <VStack spacing="2">
                  {pollOptions.map((option, index) => (
                    <HStack key={index} w="100%">
                      <Badge colorScheme="purple" fontSize="sm" borderRadius="full" px="2">
                        {index + 1}
                      </Badge>
                      <Input
                        placeholder={`Seçenek ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        flex="1"
                      />
                      {pollOptions.length > 2 && (
                        <IconButton
                          icon={<FiX />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                          aria-label="Kaldır"
                        />
                      )}
                    </HStack>
                  ))}
                  {pollOptions.length < 6 && (
                    <Button
                      leftIcon={<Text>+</Text>}
                      variant="outline"
                      colorScheme="purple"
                      size="sm"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                    >
                      Seçenek Ekle
                    </Button>
                  )}
                </VStack>
              </Box>
              
              {/* Settings */}
              <Box bg="gray.50" p="3" borderRadius="md">
                <HStack justify="space-between" mb="2">
                  <Text fontSize="sm">Anonim Oylama</Text>
                  <input
                    type="checkbox"
                    checked={pollIsAnonymous}
                    onChange={(e) => setPollIsAnonymous(e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Birden Fazla Seçim</Text>
                  <input
                    type="checkbox"
                    checked={pollAllowMultiple}
                    onChange={(e) => setPollAllowMultiple(e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                </HStack>
              </Box>
              
              <Button
                colorScheme="purple"
                size="lg"
                onClick={handleCreatePoll}
                isDisabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                leftIcon={<Icon as={FiBarChart2} />}
              >
                Anketi Gönder
              </Button>
            </VStack>
          </Box>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default ChannelChat;

