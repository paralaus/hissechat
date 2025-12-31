import React, {useState, useRef, useEffect} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
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
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  RadioGroup,
  Radio,
  Checkbox,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  useToast,
  Portal,
} from '@chakra-ui/react';
import {useQuery, useMutation, useQueryClient, useInfiniteQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
  FiLink,
  FiMoreVertical,
  FiCopy,
  FiMapPin,
  FiArchive,
  FiFilter,
  FiMessageSquare,
  FiHeart,
  FiArrowDown,
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import {getCombinedLogoUrl} from '../../../utils/image';
import {format, isToday, isYesterday, isSameDay} from 'date-fns';
import {tr} from 'date-fns/locale';
import useFileInput from '../../../hooks/useFileInput';
import useBrowserNotification from '../../../hooks/useBrowserNotification';
import {getErrorMessage} from '../../../utils/string';
import {getUserColor} from '../../../utils/color';
import VideoConference from '../../../components/conference/VideoConference';
import ForwardMessageModal from '../../../components/modals/ForwardMessageModal';
import CreateConferenceModal from '../../../components/modals/CreateConferenceModal';
import { routes } from '../../../config/routes';

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

// Helper function to highlight search text and linkify URLs
const HighlightText = ({text, searchQuery}) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a 
              key={i} 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#3182ce', textDecoration: 'underline' }}
              onClick={(e) => e.stopPropagation()}
            >
              {searchQuery ? (
                 part.split(new RegExp(`(${searchQuery})`, 'gi')).map((subPart, subIndex) => 
                   subPart.toLowerCase() === searchQuery.toLowerCase() ? (
                     <Text as="mark" key={subIndex} bg="yellow.300" color="gray.800" px="0.5" borderRadius="sm">
                       {subPart}
                     </Text>
                   ) : (
                     <React.Fragment key={subIndex}>{subPart}</React.Fragment>
                   )
                 )
              ) : part}
            </a>
          );
        }

        if (searchQuery) {
          const subParts = part.split(new RegExp(`(${searchQuery})`, 'gi'));
          return (
            <React.Fragment key={i}>
              {subParts.map((subPart, subIndex) => 
                subPart.toLowerCase() === searchQuery.toLowerCase() ? (
                  <Text as="mark" key={subIndex} bg="yellow.300" color="gray.800" px="0.5" borderRadius="sm">
                    {subPart}
                  </Text>
                ) : (
                  <React.Fragment key={subIndex}>{subPart}</React.Fragment>
                )
              )}
            </React.Fragment>
          );
        }
        
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
};

// Quick emoji list
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Reactions Component
const ReactionsBar = ({ reactions, currentUserId, onReactionClick }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <HStack spacing={1} mt={1} flexWrap="wrap">
      {reactions.map((reaction, index) => {
        const isReacted = reaction.users.some(u => {
          const uid = typeof u === 'string' ? u : (u.id || u._id);
          return uid === currentUserId;
        });
        
        return (
          <Box
            key={index}
            bg={isReacted ? 'blue.100' : 'gray.100'}
            border="1px solid"
            borderColor={isReacted ? 'blue.300' : 'gray.200'}
            borderRadius="full"
            px={2}
            py={0.5}
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              onReactionClick(reaction.emoji, isReacted);
            }}
            _hover={{ bg: isReacted ? 'blue.200' : 'gray.200' }}
            display="flex"
            alignItems="center"
          >
            <Text fontSize="xs" mr={1}>{reaction.emoji}</Text>
            <Text fontSize="xs" fontWeight="bold" color={isReacted ? 'blue.700' : 'gray.600'}>
              {reaction.users.length}
            </Text>
          </Box>
        );
      })}
    </HStack>
  );
};

const MessageBubble = ({message, isOwn, onReply, onForward, onCopyLink, onOpenLink, onCopyText, onQuoteText, onArchive, onArchiveAndPin, onOpenModeration, onBlock, onUnblock, onDelete, onTogglePin, onReplyClick, allMessages, searchQuery, isHighlighted, messageRef, onMediaClick, onJoinConference, onVotePoll, onClosePoll, currentUserId, isSelectMode, isSelected, onSelect, isPinned, onReactionClick}) => {
  const time = message.createdAt 
    ? format(new Date(message.createdAt), 'HH:mm', {locale: tr})
    : '';

  const hasMedia = message.image || message.video || message.audio || message.file || message.conference?.roomId;

  // If message is deleted or has no content (and not blocked), don't render
  const hasContent = (message.text && message.text.trim().length > 0) || 
                     message.image || 
                     message.video || 
                     message.audio || 
                     message.file || 
                     message.conference || 
                     message.poll;

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

  if (!message.isBlocked && (message.deletedAt || message.isDeleted || !hasContent)) {
    return null;
  }

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
            <Popover placement="top" isLazy>
              <PopoverTrigger>
                <IconButton
                  icon={<FiSmile />}
                  size="xs"
                  variant="ghost"
                  aria-label="Reaksiyon Ekle"
                  mb={1}
                />
              </PopoverTrigger>
              <PopoverContent width="auto" p={2}>
                <PopoverBody p={0}>
                  <HStack spacing={2}>
                    {QUICK_EMOJIS.map(emoji => (
                      <Button
                        key={emoji}
                        size="sm"
                        variant="ghost"
                        fontSize="xl"
                        p={1}
                        onClick={() => onReactionClick && onReactionClick(message, emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </HStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Menu placement="auto-end" isLazy strategy="fixed">
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                size="xs"
                variant="ghost"
                aria-label="İşlemler"
              />
              <Portal>
                <MenuList maxH="300px" overflowY="auto" zIndex={9999}>
                  <MenuItem icon={<FiCornerUpLeft />} onClick={() => onReply(message)}>
                    Cevapla
                  </MenuItem>
                <MenuItem icon={<FiShare2 />} onClick={() => onForward && onForward(message)}>
                  İlet
                </MenuItem>
                <MenuItem icon={<FiLink />} onClick={() => onCopyLink && onCopyLink(message)}>
                  Bağlantıyı kopyala
                </MenuItem>
                {message.text && (
                  <MenuItem icon={<FiCopy />} onClick={() => onCopyText && onCopyText(message)}>
                    Metni kopyala
                  </MenuItem>
                )}
                <MenuItem icon={<FiMessageSquare />} onClick={() => onQuoteText && onQuoteText(message)}>
                  Mesajı alıntıla
                </MenuItem>
                <MenuItem icon={<FiExternalLink />} onClick={() => onOpenLink && onOpenLink(message)}>
                  Yeni sekmede aç
                </MenuItem>
                <MenuItem icon={<FiShield />} onClick={() => onOpenModeration && onOpenModeration(message)}>
                  Moderasyonda aç
                </MenuItem>
                <MenuItem icon={<FiArchive />} onClick={() => onArchive && onArchive(message)}>
                  Arşivle
                </MenuItem>
                <MenuItem icon={<FiMapPin />} onClick={() => onArchiveAndPin && onArchiveAndPin(message)}>
                  Arşivle ve sabitle
                </MenuItem>
                {!message.isBlocked ? (
                  <MenuItem icon={<FiShield />} onClick={() => onBlock && onBlock(message)}>
                    Engelle
                  </MenuItem>
                ) : (
                  <MenuItem icon={<FiCheck />} onClick={() => onUnblock && onUnblock(message)}>
                    Engeli kaldır
                  </MenuItem>
                )}
                <MenuItem icon={<FiMapPin />} onClick={() => onTogglePin && onTogglePin(message)}>
                  {isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                </MenuItem>
                <MenuItem icon={<FiTrash2 />} onClick={() => onDelete && onDelete(message)}>
                  Sil
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </VStack>
        )}
        
        <Box
          bg={isOwn ? 'blue.500' : `${getUserColor(message.user?.id || message.user?._id)}.50`}
          color={isOwn ? 'white' : 'gray.800'}
          borderWidth="1px"
          borderColor={isOwn ? 'blue.500' : `${getUserColor(message.user?.id || message.user?._id)}.200`}
          px="4"
          py="2"
          borderRadius="xl"
          borderBottomRightRadius={isOwn ? 'sm' : 'xl'}
          borderBottomLeftRadius={isOwn ? 'xl' : 'sm'}
          boxShadow="sm"
        >
          {!isOwn && (
            <Text 
              fontSize="xs" 
              fontWeight="bold" 
              color={`${getUserColor(message.user?.id || message.user?._id)}.600`}
              mb="1"
            >
              {message.user?.fullname || 'Kullanıcı'}
            </Text>
          )}
          
          {/* Reply Preview - Don't show for conference messages */}
          {repliedMessage && !message.conference?.roomId && (
            <Box
              bg={isOwn ? 'blue.400' : 'whiteAlpha.600'}
              p="2"
              borderRadius="md"
              mb="2"
              borderLeft="3px solid"
              borderLeftColor={isOwn ? 'blue.200' : `${getUserColor(repliedMessage.user?.id || repliedMessage.user?._id)}.500`}
              cursor="pointer"
              onClick={() => onReplyClick && onReplyClick(repliedMessage.id || repliedMessage._id)}
            >
              <Text 
                fontSize="xs" 
                fontWeight="bold" 
                color={isOwn ? 'blue.100' : `${getUserColor(repliedMessage.user?.id || repliedMessage.user?._id)}.600`}
              >
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
                if (startDate > now) {
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
          
          <ReactionsBar 
            reactions={message.reactions} 
            currentUserId={currentUserId}
            onReactionClick={(emoji, isReacted) => onReactionClick && onReactionClick(message, emoji, isReacted)}
          />
          
          <Text fontSize="xs" color={isOwn ? 'blue.100' : 'gray.400'} textAlign="right" mt="1">
            {time}
          </Text>
        </Box>
        
        {/* Reply button for other's messages (right side) */}
        {!isOwn && (
          <VStack spacing={0} opacity="0" _groupHover={{opacity: 1}}>
            <Popover placement="top" isLazy>
              <PopoverTrigger>
                <IconButton
                  icon={<FiSmile />}
                  size="xs"
                  variant="ghost"
                  aria-label="Reaksiyon Ekle"
                  mb={1}
                />
              </PopoverTrigger>
              <PopoverContent width="auto" p={2}>
                <PopoverBody p={0}>
                  <HStack spacing={2}>
                    {QUICK_EMOJIS.map(emoji => (
                      <Button
                        key={emoji}
                        size="sm"
                        variant="ghost"
                        fontSize="xl"
                        p={1}
                        onClick={() => onReactionClick && onReactionClick(message, emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </HStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Menu placement="auto-end" isLazy strategy="fixed">
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                size="xs"
                variant="ghost"
                aria-label="İşlemler"
              />
              <Portal>
                <MenuList maxH="300px" overflowY="auto" zIndex={9999}>
                  <MenuItem icon={<FiCornerUpLeft />} onClick={() => onReply(message)}>
                    Cevapla
                  </MenuItem>
                <MenuItem icon={<FiShare2 />} onClick={() => onForward && onForward(message)}>
                  İlet
                </MenuItem>
                <MenuItem icon={<FiLink />} onClick={() => onCopyLink && onCopyLink(message)}>
                  Bağlantıyı kopyala
                </MenuItem>
                {message.text && (
                  <MenuItem icon={<FiCopy />} onClick={() => onCopyText && onCopyText(message)}>
                    Metni kopyala
                  </MenuItem>
                )}
                <MenuItem icon={<FiMessageSquare />} onClick={() => onQuoteText && onQuoteText(message)}>
                  Mesajı alıntıla
                </MenuItem>
                <MenuItem icon={<FiExternalLink />} onClick={() => onOpenLink && onOpenLink(message)}>
                  Yeni sekmede aç
                </MenuItem>
                <MenuItem icon={<FiShield />} onClick={() => onOpenModeration && onOpenModeration(message)}>
                  Moderasyonda aç
                </MenuItem>
                <MenuItem icon={<FiArchive />} onClick={() => onArchive && onArchive(message)}>
                  Arşivle
                </MenuItem>
                <MenuItem icon={<FiMapPin />} onClick={() => onArchiveAndPin && onArchiveAndPin(message)}>
                  Arşivle ve sabitle
                </MenuItem>
                {!message.isBlocked ? (
                  <MenuItem icon={<FiShield />} onClick={() => onBlock && onBlock(message)}>
                    Engelle
                  </MenuItem>
                ) : (
                  <MenuItem icon={<FiCheck />} onClick={() => onUnblock && onUnblock(message)}>
                    Engeli kaldır
                  </MenuItem>
                )}
                <MenuItem icon={<FiMapPin />} onClick={() => onTogglePin && onTogglePin(message)}>
                  {isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                </MenuItem>
                <MenuItem icon={<FiTrash2 />} onClick={() => onDelete && onDelete(message)}>
                  Sil
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
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
  const conferenceScrollDoneRef = useRef(false);
  const messageRefs = useRef({});
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
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
  const [createConferenceModalOpen, setCreateConferenceModalOpen] = useState(false);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Poll modal state
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  // Forward message state
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  // Multi-select delete state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [isArchiving, setIsArchiving] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isUnpinning, setIsUnpinning] = useState(false);
  const [isBlockingSelected, setIsBlockingSelected] = useState(false);
  const [isUnblockingSelected, setIsUnblockingSelected] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchivingDeleting, setIsArchivingDeleting] = useState(false);
  const [shownArchiveDeleteHint, setShownArchiveDeleteHint] = useState(false);
  const bulkPinModal = useDisclosure();
  const [bulkPinDuration, setBulkPinDuration] = useState('unlimited');
  const [bulkArchiveAndPin, setBulkArchiveAndPin] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState(24);
  const [customDurationUnit, setCustomDurationUnit] = useState('hours');
  const singlePinModal = useDisclosure();
  const [singlePinTarget, setSinglePinTarget] = useState(null);
  const [singlePinDuration, setSinglePinDuration] = useState('unlimited');
  const [singleCustomDurationValue, setSingleCustomDurationValue] = useState(24);
  const [singleCustomDurationUnit, setSingleCustomDurationUnit] = useState('hours');
  const [singleArchiveBeforePin, setSingleArchiveBeforePin] = useState(false);
  const bulkBlockModal = useDisclosure();
  const [bulkBlockReason, setBulkBlockReason] = useState('');
  const bulkUnblockModal = useDisclosure();
  const bulkForwardModal = useDisclosure();
  const [forwardSelectedChannelIds, setForwardSelectedChannelIds] = useState([]);
  const [forwardIncludeLinks, setForwardIncludeLinks] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');

  const blockModal = useDisclosure();
  const [blockReason, setBlockReason] = useState('');
  const [messageToBlock, setMessageToBlock] = useState(null);
  const deleteModal = useDisclosure();
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteScope, setDeleteScope] = useState('all');

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
      if (!channelId) return { results: [], page: 1, totalPages: 1 };
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
    enabled: !!channelId,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true, // Keep polling even when tab is not focused
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (body) => api.sendChannelMessage(channelId, body),
    onSuccess: () => {
      shouldScrollToBottomRef.current = true;
      queryClient.invalidateQueries(['channel-messages', channelId]);
      setMessageText('');
      setReplyTo(null);
      imageInput.reset();
      videoInput.reset();
      audioInput.reset();
      fileInput.reset();
    },
  });

  // Flatten all pages into a single array and reverse for chronological order
  const allMessages = React.useMemo(() => {
    if (!messagesData?.pages) return [];
    const msgs = messagesData.pages.flatMap(page => page.results || []);
    
    // Filter out deleted or empty messages
    const validMsgs = msgs.filter(m => {
      // If explicitly marked as deleted
      if (m.deletedAt || m.isDeleted) return false;
      
      // If it has content, keep it
      if (m.text && m.text.trim().length > 0) return true;
      if (m.image || m.video || m.audio || m.file) return true;
      if (m.conference || m.poll) return true;
      if (m.isBlocked) return true; // Keep blocked messages visible
      
      // Otherwise it's empty/deleted
      return false;
    });

    // Messages come in desc order (newest first), reverse for display (oldest at top)
    return [...validMsgs].reverse();
  }, [messagesData]);

  // Scroll to bottom only on initial load or new message sent
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
  const shouldScrollToBottomRef = useRef(false);
  
  useEffect(() => {
    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
      shouldScrollToBottomRef.current = false;
    } else if (allMessages.length > 0 && !hasInitialScroll) {
      messagesEndRef.current?.scrollIntoView({behavior: 'auto'});
      setHasInitialScroll(true);
    }
  }, [allMessages, hasInitialScroll]);

  // Maintain scroll position when loading older messages
  React.useLayoutEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight.current > 0 && !isFetchingNextPage) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      
      if (scrollDiff > 0) {
        messagesContainerRef.current.scrollTop = scrollDiff;
      }
      previousScrollHeight.current = 0;
    }
  }, [allMessages, isFetchingNextPage]);

  // Handle scroll to load more messages
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = async (e) => {
    const container = e.target;
    
    // Check if we should show scroll to bottom button
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    setShowScrollBottom(!isNearBottom);

    // If scrolled near top (within 100px) and there are more pages
    if (container.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      previousScrollHeight.current = container.scrollHeight;
      await fetchNextPage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
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

  // Notification Hook
  const { showNotification } = useBrowserNotification();
  const lastNotificationMessageIdRef = useRef(null);

  // Notification Effect
  useEffect(() => {
    if (!allMessages || allMessages.length === 0) return;

    const lastMessage = allMessages[allMessages.length - 1];
    const lastMessageId = lastMessage.id || lastMessage._id;

    // Initial load sync - don't notify for existing messages
    if (!lastNotificationMessageIdRef.current) {
      lastNotificationMessageIdRef.current = lastMessageId;
      return;
    }

    // New message check
    if (lastMessageId !== lastNotificationMessageIdRef.current) {
      lastNotificationMessageIdRef.current = lastMessageId;

      const isOwn = (lastMessage.user?.id || lastMessage.user?._id || lastMessage.user) === currentUserId;
      
      if (!isOwn) {
        const senderName = lastMessage.user?.username || lastMessage.user?.fullname || 'Biri';
        let body = 'Yeni mesaj';
        if (lastMessage.text) body = lastMessage.text;
        else if (lastMessage.image) body = '📷 Fotoğraf gönderdi';
        else if (lastMessage.video) body = '🎥 Video gönderdi';
        else if (lastMessage.audio) body = '🎵 Ses gönderdi';
        else if (lastMessage.file) body = '📁 Dosya gönderdi';
        else if (lastMessage.conference) body = '🎥 Video görüşme';
        else if (lastMessage.poll) body = '📊 Anket';

        showNotification(senderName, {
          body: body.length > 50 ? body.substring(0, 50) + '...' : body,
          icon: '/logo192.png',
          tag: `channel-${channelId}`, // Tag prevents duplicate notifications for same event
          silent: false
        });
      }
    }
  }, [allMessages, currentUserId, channelId, showNotification]);

  // Reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji, isReacted }) => {
      if (isReacted) {
        return api.removeReaction(channelId, messageId, emoji);
      } else {
        return api.addReaction(channelId, messageId, emoji);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['channel-messages', channelId]);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Reaksiyon işlemi başarısız',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    }
  });

  const handleReactionClick = (message, emoji, explicitIsReacted) => {
    const messageId = message.id || message._id;
    let isReacted = explicitIsReacted;
    
    if (isReacted === undefined) {
      const reaction = message.reactions?.find(r => r.emoji === emoji);
      if (reaction) {
        isReacted = reaction.users.some(u => {
             const uid = typeof u === 'string' ? u : (u.id || u._id);
             return uid === currentUserId;
        });
      } else {
        isReacted = false;
      }
    }

    reactionMutation.mutate({ messageId, emoji, isReacted });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !imageInput.objectUrl && !videoInput.objectUrl && !audioInput.objectUrl && !fileInput.objectUrl) {
      return;
    }

    try {
      setIsSending(true);
      const body = {text: messageText};

      // Add reply reference if replying (send as parent ID string)
      if (replyTo) {
        body.parent = replyTo.id || replyTo._id;
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

  const handleSendHeart = async () => {
    try {
      setIsSending(true);
      // Send heart emoji message directly
      await api.sendChannelMessage(channelId, { text: '❤️' });
      shouldScrollToBottomRef.current = true;
      queryClient.invalidateQueries(['channel-messages', channelId]);
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

  const handleForward = (message) => {
    setMessageToForward(message);
    setForwardModalOpen(true);
  };

  const buildDeepLink = (message) => {
    const base = `${window.location.origin}${routes.channelChat.getPath(channelId)}`;
    const params = new URLSearchParams();
    if (message?.conference?.roomId) {
      params.set('conference', 'active');
      params.set('roomId', message.conference.roomId);
    } else {
      params.set('messageId', message.id || message._id);
    }
    return `${base}?${params.toString()}`;
  };

  const handleCopyLink = async (message) => {
    try {
      const url = buildDeepLink(message);
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Bağlantı kopyalandı',
        status: 'success',
        position: 'top',
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: 'Bağlantı kopyalanamadı',
        status: 'error',
        position: 'top',
      });
    }
  };

  const handleOpenLink = (message) => {
    const url = buildDeepLink(message);
    window.open(url, '_blank');
  };

  const handleOpenModeration = (message) => {
    const params = new URLSearchParams();
    params.set('filter', 'all');
    params.set('channelId', channelId);
    if (message?.text) {
      params.set('q', message.text.slice(0, 100));
    }
    const url = `${window.location.origin}${routes.moderation.path}?${params.toString()}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async (message) => {
    if (!message?.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      toast({
        title: 'Metin kopyalandı',
        status: 'success',
        duration: 1500,
        position: 'top',
      });
    } catch {
      toast({
        title: 'Metin kopyalanamadı',
        status: 'error',
        duration: 2000,
        position: 'top',
      });
    }
  };

  const handleQuoteText = (message) => {
    const displayName = message?.user?.username || message?.user?.fullname || 'Kullanıcı';
    const maxLen = 200;
    let content = '';
    if (message?.text && message.text.trim()) {
      const raw = message.text.trim();
      content = raw.length > maxLen ? `${raw.slice(0, maxLen)}…` : raw;
    } else if (message?.conference?.roomId) {
      content = 'Video görüşmesi';
    } else if (message?.image) {
      content = 'Görsel';
    } else if (message?.video) {
      content = 'Video';
    } else if (message?.audio) {
      content = 'Ses';
    } else if (message?.file) {
      content = 'Dosya';
    } else if (message?.poll) {
      content = `Anket: ${message?.poll?.question || ''}`.trim();
    } else {
      content = 'Mesaj';
    }
    const quoted = content
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
    const mentionLine = `@${displayName}\n`;
    const link = buildDeepLink(message);
    const linkLine = `Bağlantı: ${link}\n`;
    const timeLine = message?.createdAt ? `Tarih: ${format(new Date(message.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}\n` : '';
    setMessageText(prev => (prev ? `${prev}\n${mentionLine}${quoted}\n${timeLine}${linkLine}` : `${mentionLine}${quoted}\n${timeLine}${linkLine}`));
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const blockMutation = useMutation({
    mutationFn: ({ messageId, reason }) => api.blockMessage(messageId, reason),
    onSuccess: () => {
      toast({
        title: 'Mesaj engellendi',
        status: 'success',
        duration: 2000,
        position: 'top',
      });
      queryClient.invalidateQueries(['channel-messages', channelId]);
      setMessageToBlock(null);
      setBlockReason('');
      blockModal.onClose();
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Mesaj engellenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (messageId) => api.unblockMessage(messageId),
    onSuccess: () => {
      toast({
        title: 'Engel kaldırıldı',
        status: 'success',
        duration: 2000,
        position: 'top',
      });
      queryClient.invalidateQueries(['channel-messages', channelId]);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Engel kaldırılamadı',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    },
  });

  const handleBlockMessage = (message) => {
    setMessageToBlock(message);
    setBlockReason('');
    blockModal.onOpen();
  };

  const handleConfirmBlock = async () => {
    if (!messageToBlock) return;
    const id = messageToBlock.id || messageToBlock._id;
    await blockMutation.mutateAsync({ messageId: id, reason: blockReason });
  };

  const handleUnblockMessage = async (message) => {
    const id = message.id || message._id;
    await unblockMutation.mutateAsync(id);
  };

  const handleDeleteMessageOpen = (message) => {
    setMessageToDelete(message);
    setDeleteScope('all');
    deleteModal.onOpen();
  };

  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      const id = messageToDelete.id || messageToDelete._id;
      if (archiveBeforeDelete && deleteScope === 'all') {
        try {
          await api.archiveMessage({ messageId: id, channelId });
        } catch (e) {
          // Ignore archive error but inform user
          toast({
            title: 'Arşivleme başarısız',
            description: e?.response?.data?.message || 'Mesaj arşivlenemedi, yine de siliniyor',
            status: 'warning',
            duration: 2500,
            position: 'top',
          });
        }
      }
      if (deleteScope === 'me') {
        await api.deleteChannelMessageForUser(channelId, id);
      } else {
        await api.deleteChannelMessage(channelId, id);
      }
      toast({
        title: deleteScope === 'me' ? 'Mesaj sizin için silindi' : 'Mesaj silindi',
        status: 'success',
        duration: 2000,
        position: 'top',
      });
      queryClient.invalidateQueries(['channel-messages', channelId]);
      deleteModal.onClose();
      setMessageToDelete(null);
    } catch (error) {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Mesaj silinemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    }
  };
  const [archiveBeforeDelete, setArchiveBeforeDelete] = useState(false);

  const pinnedModal = useDisclosure();
  const [pinnedIndex, setPinnedIndex] = useState(0);

  const { data: pinnedData } = useQuery({
    queryKey: ['pinned-messages', channelId],
    queryFn: () => api.getPinnedMessages(channelId),
    enabled: !!channelId,
  });
  const pinnedMessages = Array.isArray(pinnedData?.data?.results)
    ? pinnedData.data.results
    : Array.isArray(pinnedData?.results)
      ? pinnedData.results
      : Array.isArray(pinnedData?.data)
        ? pinnedData.data
        : (Array.isArray(pinnedData) ? pinnedData : []);
  const pinnedIds = new Set(
    (pinnedMessages || []).map(pm => pm?.messageId || pm?.message?.id || pm?.id)
  );

  const pinMutation = useMutation({
    mutationFn: (messageId) => api.pinMessage({ channelId, messageId }),
    onSuccess: () => {
      toast({ title: 'Mesaj sabitlendi', status: 'success', duration: 1500, position: 'top' });
      queryClient.invalidateQueries(['pinned-messages', channelId]);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Mesaj sabitlenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (pinId) => api.unpinMessage(pinId),
    onSuccess: () => {
      toast({ title: 'Sabitleme kaldırıldı', status: 'success', duration: 1500, position: 'top' });
      queryClient.invalidateQueries(['pinned-messages', channelId]);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Sabitleme kaldırılamadı',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    },
  });

  const pinWithDurationMutation = useMutation({
    mutationFn: ({ messageId, durationMs }) => api.pinMessage({ channelId, messageId, durationMs }),
    onSuccess: () => {
      toast({ title: 'Mesaj sabitlendi', status: 'success', duration: 1500, position: 'top' });
      queryClient.invalidateQueries(['pinned-messages', channelId]);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Mesaj sabitlenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    },
  });

  const handleTogglePinMessage = async (message) => {
    const id = message.id || message._id;
    const existing = (pinnedMessages || []).find(
      pm => (pm?.messageId === id) || (pm?.message?.id === id) || (pm?.id === id)
    );
    if (existing) {
      const pinId = existing?._id || existing?.id;
      if (pinId) {
        await unpinMutation.mutateAsync(pinId);
      }
    } else {
      setSinglePinTarget(message);
      setSinglePinDuration('unlimited');
      setSingleCustomDurationValue(24);
      setSingleCustomDurationUnit('hours');
      singlePinModal.onOpen();
    }
  };

  const handleOpenPinnedModal = () => {
    setPinnedIndex(0);
    pinnedModal.onOpen();
  };

  const handleNavigatePinned = (direction) => {
    if (!pinnedMessages?.length) return;
    if (direction === 'prev') {
      setPinnedIndex((prev) => Math.max(0, prev - 1));
    } else {
      setPinnedIndex((prev) => Math.min(pinnedMessages.length - 1, prev + 1));
    }
  };

  const handleArchiveAndPin = async (message) => {
    const id = message.id || message._id;
    try {
      await api.archiveMessage({ messageId: id, channelId });
    } catch (e) {
      toast({
        title: 'Arşivleme başarısız',
        description: e?.response?.data?.message || 'Mesaj arşivlenemedi, sabitleme deneniyor',
        status: 'warning',
        duration: 2500,
        position: 'top',
      });
    }
    try {
      await pinMutation.mutateAsync(id);
    } catch (e) {
      toast({
        title: 'Sabitleme başarısız',
        description: e?.response?.data?.message || 'Mesaj sabitlenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    }
  };


  const scrollToMessage = (messageId) => {
    const ref = messageRefs.current[messageId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect temporarily
      ref.style.transition = 'background-color 0.5s';
      const originalBg = ref.style.backgroundColor;
      ref.style.backgroundColor = '#FEFCBF'; // yellow.100
      setTimeout(() => {
        ref.style.backgroundColor = originalBg;
      }, 2000);
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  // Create and send conference message
  const handleCreateConference = async (options = {}) => {
    try {
      setIsSending(true);
      
      // Clear any reply state
      setReplyTo(null);
      
      // Generate unique room ID
      const roomId = `hissechat-${channelId}-${Date.now()}`;
      const conferenceTitle = `${channel?.name || 'Kanal'} Video Görüşmesi`;
      
      let startTime = new Date().toISOString();
      let scheduledEndTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour later
      
      // Handle scheduled conference
      if (options.type === 'scheduled' && options.startTime) {
        startTime = options.startTime;
        // End time is 1 hour after start time by default
        scheduledEndTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
      }
      
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
          isActive: options.type !== 'scheduled', // Scheduled ise false, instant ise true
        },
      };

      await sendMessageMutation.mutateAsync(conferenceBody);
      
      // Only open video call immediately if it's an instant meeting
      if (options.type !== 'scheduled') {
        // Set conference data and open modal
        setCurrentConferenceData({
          roomId,
          title: conferenceTitle,
          channelId,
        });
        onVideoCallOpen();
      }
      
      toast({
        title: options.type === 'scheduled' ? 'Video görüşme planlandı' : 'Video görüşme başlatıldı',
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
      if (startDate > now) {
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
      
      // If end time exists and is in the future, don't consider it ended even if isActive is false
      // This allows scheduled meetings to be "waiting to start" instead of "ended"
      if (conferenceData.scheduledEndTime) {
        const endDate = new Date(conferenceData.scheduledEndTime);
        if (endDate > now) {
          // It's not ended yet, potentially waiting to be started
          // If start time is in the future, it will be caught by the first check
          // If start time is in the past but not active, it might be waiting for host
          return { status: 'unknown', message: '' }; 
        }
      }

      if (startDate < now) {
        return {
          status: 'ended',
          message: 'Bu konferans sona ermiş.',
        };
      }
    }
    
    return { status: 'unknown', message: '' }; // Need to check backend
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conf = params.get('conference');
    const roomIdParam = params.get('roomId');
    const messageIdParam = params.get('messageId');
    if (!conferenceScrollDoneRef.current && allMessages.length > 0) {
      if (messageIdParam) {
        const exactMsg = allMessages.find(m => (m.id === messageIdParam || m._id === messageIdParam));
        if (exactMsg) {
          scrollToMessage(exactMsg.id || exactMsg._id);
          conferenceScrollDoneRef.current = true;
          return;
        }
      }
      if (conf === 'active') {
      if (roomIdParam) {
        const exact = allMessages.find(m => m.conference?.roomId === roomIdParam);
        if (exact) {
          scrollToMessage(exact.id || exact._id);
          conferenceScrollDoneRef.current = true;
          return;
        }
      }
      const candidates = allMessages.filter(m => m.conference?.roomId);
      for (let i = candidates.length - 1; i >= 0; i--) {
        const m = candidates[i];
        const status = getConferenceStatusFromMessage(m.conference).status;
        if (status === 'active' || status === 'unknown') {
          scrollToMessage(m.id || m._id);
          conferenceScrollDoneRef.current = true;
          break;
        }
      }
      }
    }
  }, [location.search, allMessages]);

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
          if (startDate > now) {
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

  const handleArchiveSelected = async () => {
    if (selectedMessageIds.size === 0) return;
    try {
      setIsArchiving(true);
      const ids = Array.from(selectedMessageIds);
      const results = await Promise.allSettled(
        ids.map(id => api.archiveMessage({ messageId: id, channelId }))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      toast({
        title: failed === 0 ? 'Mesajlar arşivlendi' : `Bazı mesajlar arşivlenemedi (${failed})`,
        status: failed === 0 ? 'success' : 'warning',
        duration: 2500,
        position: 'top',
      });
    } catch (e) {
      toast({
        title: 'Hata',
        description: e?.response?.data?.message || 'Mesajlar arşivlenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleBlockSelected = async () => {
    if (!anyUnblockedSelected) return;
    try {
      setIsBlockingSelected(true);
      const ids = messages
        .filter(m => {
          const id = m.id || m._id;
          return selectedMessageIds.has(id) && !m.isBlocked;
        })
        .map(m => m.id || m._id);
      const results = await Promise.allSettled(
        ids.map(id => api.blockMessage(id, bulkBlockReason))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      toast({
        title: failed === 0 ? 'Mesajlar engellendi' : `Bazı mesajlar engellenemedi (${failed})`,
        status: failed === 0 ? 'success' : 'warning',
        duration: 2500,
        position: 'top',
      });
      queryClient.invalidateQueries(['channel-messages', channelId]);
    } catch (e) {
      toast({
        title: 'Hata',
        description: e?.response?.data?.message || 'Mesajlar engellenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsBlockingSelected(false);
      bulkBlockModal.onClose();
      setBulkBlockReason('');
    }
  };

  const handleUnblockSelected = async () => {
    if (!anyBlockedSelected) return;
    try {
      setIsUnblockingSelected(true);
      const ids = messages
        .filter(m => {
          const id = m.id || m._id;
          return selectedMessageIds.has(id) && m.isBlocked;
        })
        .map(m => m.id || m._id);
      const results = await Promise.allSettled(
        ids.map(id => api.unblockMessage(id))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      toast({
        title: failed === 0 ? 'Mesajların engeli kaldırıldı' : `Bazılarının engeli kaldırılamadı (${failed})`,
        status: failed === 0 ? 'success' : 'warning',
        duration: 2500,
        position: 'top',
      });
      queryClient.invalidateQueries(['channel-messages', channelId]);
    } catch (e) {
      toast({
        title: 'Hata',
        description: e?.response?.data?.message || 'Engeller kaldırılamadı',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsUnblockingSelected(false);
    }
  };
  const handlePinSelected = async (durationMs) => {
    if (selectedMessageIds.size === 0) return;
    try {
      setIsPinning(true);
      const ids = Array.from(selectedMessageIds);
      const results = await Promise.allSettled(
        ids.map(id => api.pinMessage({ channelId, messageId: id, durationMs }))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      toast({
        title: failed === 0 ? 'Mesajlar sabitlendi' : `Bazı mesajlar sabitlenemedi (${failed})`,
        status: failed === 0 ? 'success' : 'warning',
        duration: 2500,
        position: 'top',
      });
      queryClient.invalidateQueries(['pinned-messages', channelId]);
    } catch (e) {
      toast({
        title: 'Hata',
        description: e?.response?.data?.message || 'Mesajlar sabitlenemedi',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsPinning(false);
    }
  };

  const handleUnpinSelected = async () => {
    if (selectedMessageIds.size === 0) return;
    try {
      setIsUnpinning(true);
      const map = new Map();
      (pinnedMessages || []).forEach(pm => {
        const mid = pm?.messageId || pm?.message?.id || pm?.id;
        const pid = pm?._id || pm?.id;
        if (mid && pid) {
          map.set(mid, pid);
        }
      });
      const pinIds = Array.from(selectedMessageIds)
        .map(id => map.get(id))
        .filter(Boolean);
      const uniquePinIds = Array.from(new Set(pinIds));
      if (uniquePinIds.length === 0) {
        toast({
          title: 'Seçilen mesajlar sabitli değil',
          status: 'info',
          duration: 2000,
          position: 'top',
        });
        return;
      }
      const results = await Promise.allSettled(
        uniquePinIds.map(pid => api.unpinMessage(pid))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      toast({
        title: failed === 0 ? 'Sabitlemeler kaldırıldı' : `Bazı sabitlemeler kaldırılamadı (${failed})`,
        status: failed === 0 ? 'success' : 'warning',
        duration: 2500,
        position: 'top',
      });
      queryClient.invalidateQueries(['pinned-messages', channelId]);
    } catch (e) {
      toast({
        title: 'Hata',
        description: e?.response?.data?.message || 'Sabitlemeler kaldırılamadı',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsUnpinning(false);
    }
  };
  const handleArchiveAndPinSelected = async (durationMs) => {
    if (selectedMessageIds.size === 0) return;
    try {
      setIsPinning(true);
      const ids = Array.from(selectedMessageIds);
      const results = await Promise.allSettled(
        ids.map(async id => {
          try {
            await api.archiveMessage({ messageId: id, channelId });
          } catch {}
          await api.pinMessage({ channelId, messageId: id, durationMs });
        })
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      toast({
        title: failed === 0 ? 'Mesajlar arşivlendi ve sabitlendi' : `Bazı mesajlar sabitlenemedi (${failed})`,
        status: failed === 0 ? 'success' : 'warning',
        duration: 2500,
        position: 'top',
      });
      queryClient.invalidateQueries(['pinned-messages', channelId]);
    } catch (e) {
      toast({
        title: 'Hata',
        description: e?.response?.data?.message || 'İşlem tamamlanamadı',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
    } finally {
      setIsPinning(false);
    }
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
        // First invalidate to fetch new messages
        await queryClient.invalidateQueries(['channel-messages', channelId]);
        
        // Find the new last message from the updated cache
        const updatedMessagesData = queryClient.getQueryData(['channel-messages', channelId]);
        let newLastMessageText = 'Mesaj yok';
        let newLastMessageDate = null;

        if (updatedMessagesData?.pages?.[0]?.results) {
          // Find first valid message (not deleted)
          const validMessage = updatedMessagesData.pages[0].results.find(m => 
            !m.deletedAt && !m.isDeleted && (m.text || m.image || m.video || m.audio || m.file || m.conference || m.poll)
          );

          if (validMessage) {
            newLastMessageDate = validMessage.createdAt;
            if (validMessage.text) newLastMessageText = validMessage.text;
            else if (validMessage.image) newLastMessageText = '📷 Görsel';
            else if (validMessage.video) newLastMessageText = '🎬 Video';
            else if (validMessage.audio) newLastMessageText = '🎵 Ses';
            else if (validMessage.file) newLastMessageText = '📄 Dosya';
            else if (validMessage.conference) newLastMessageText = '🎥 Video Görüşme';
            else if (validMessage.poll) newLastMessageText = '📊 Anket';
          }
        }

        // Helper function to update channel in list
        const updateChannelList = (queryKey) => {
          queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData || !oldData.pages) return oldData;
            
            return {
              ...oldData,
              pages: oldData.pages.map(page => ({
                ...page,
                results: page.results.map(c => {
                  if (c.id === channelId || c._id === channelId) {
                    return {
                      ...c,
                      lastMessage: newLastMessageText,
                      lastMessageAt: newLastMessageDate || c.createdAt // Fallback to channel creation if no msg
                    };
                  }
                  return c;
                })
              }))
            };
          });
        };

        // Manually update channel lists with new last message info
        updateChannelList(['all-channels-messaging']);
        updateChannelList(['vip-channels-messaging']);
        
        // Still invalidate to be safe (eventual consistency)
        queryClient.invalidateQueries(['all-channels-messaging']);
        queryClient.invalidateQueries(['vip-channels-messaging']);
        
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

  const handleArchiveAndDeleteSelected = async () => {
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
      `${selectedMessageIds.size} mesaj arşivlenip silinecek. Emin misiniz?`
    );
    if (!confirmDelete) return;
    setIsArchivingDeleting(true);
    try {
      const messageIdsArray = Array.from(selectedMessageIds);
      await Promise.allSettled(
        messageIdsArray.map(id => api.archiveMessage({ messageId: id, channelId }))
      );
      const results = await api.deleteChannelMessages(channelId, messageIdsArray);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      if (successCount > 0) {
        await queryClient.invalidateQueries(['channel-messages', channelId]);
        const updatedMessagesData = queryClient.getQueryData(['channel-messages', channelId]);
        let newLastMessageText = 'Mesaj yok';
        let newLastMessageDate = null;
        if (updatedMessagesData?.pages?.[0]?.results) {
          const validMessage = updatedMessagesData.pages[0].results.find(m => 
            !m.deletedAt && !m.isDeleted && (m.text || m.image || m.video || m.audio || m.file || m.conference || m.poll)
          );
          if (validMessage) {
            newLastMessageDate = validMessage.createdAt;
            if (validMessage.text) newLastMessageText = validMessage.text;
            else if (validMessage.image) newLastMessageText = '📷 Görsel';
            else if (validMessage.video) newLastMessageText = '🎬 Video';
            else if (validMessage.audio) newLastMessageText = '🎵 Ses';
            else if (validMessage.file) newLastMessageText = '📄 Dosya';
            else if (validMessage.conference) newLastMessageText = '🎥 Video Görüşme';
            else if (validMessage.poll) newLastMessageText = '📊 Anket';
          }
        }
        const updateChannelList = (queryKey) => {
          queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData || !oldData.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map(page => ({
                ...page,
                results: page.results.map(c => {
                  if (c.id === channelId || c._id === channelId) {
                    return {
                      ...c,
                      lastMessage: newLastMessageText,
                      lastMessageAt: newLastMessageDate || c.createdAt,
                    };
                  }
                  return c;
                })
              }))
            };
          });
        };
        updateChannelList(['all-channels-messaging']);
        updateChannelList(['vip-channels-messaging']);
        queryClient.invalidateQueries(['all-channels-messaging']);
        queryClient.invalidateQueries(['vip-channels-messaging']);
        toast({
          title: 'Mesajlar arşivlenip silindi',
          description: `${successCount} mesaj silindi${failCount > 0 ? `, ${failCount} mesaj silinemedi` : ''}`,
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
      setIsArchivingDeleting(false);
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
    // Use setTimeout to avoid potential DOM conflicts (InvalidNodeTypeError)
    // when the library tries to manage focus/selection on an unmounting component
    setTimeout(() => {
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    }, 0);
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
  const anyBlockedSelected = React.useMemo(() => {
    if (selectedMessageIds.size === 0) return false;
    return messages.some(m => {
      const id = m.id || m._id;
      return selectedMessageIds.has(id) && m.isBlocked;
    });
  }, [selectedMessageIds, messages]);
  const anyUnblockedSelected = React.useMemo(() => {
    if (selectedMessageIds.size === 0) return false;
    return messages.some(m => {
      const id = m.id || m._id;
      return selectedMessageIds.has(id) && !m.isBlocked;
    });
  }, [selectedMessageIds, messages]);
  const selectedBlockedCount = React.useMemo(() => {
    if (selectedMessageIds.size === 0) return 0;
    let c = 0;
    messages.forEach(m => {
      const id = m.id || m._id;
      if (selectedMessageIds.has(id) && m.isBlocked) c++;
    });
    return c;
  }, [selectedMessageIds, messages]);
  const selectedUnblockedCount = React.useMemo(() => {
    if (selectedMessageIds.size === 0) return 0;
    let c = 0;
    messages.forEach(m => {
      const id = m.id || m._id;
      if (selectedMessageIds.has(id) && !m.isBlocked) c++;
    });
    return c;
  }, [selectedMessageIds, messages]);

  const selectOnlyBlocked = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.isBlocked) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
  };

  const selectOnlyUnblocked = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (!m.isBlocked) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
  };
  const selectOnlyMedia = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.image || m.video || m.audio || m.file) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
    toast({ title: 'Medyalı mesajlar seçildi', status: 'info', position: 'top', duration: 1000 });
  };
  const selectOnlyText = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.text && !m.image && !m.video && !m.audio && !m.file) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
    toast({ title: 'Metin mesajlar seçildi', status: 'info', position: 'top', duration: 1000 });
  };
  const selectOnlyImages = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.image) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
    toast({ title: 'Görseller seçildi', status: 'info', position: 'top', duration: 1000 });
  };
  const selectOnlyVideos = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.video) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
    toast({ title: 'Videolar seçildi', status: 'info', position: 'top', duration: 1000 });
  };
  const selectOnlyAudios = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.audio) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
    toast({ title: 'Ses dosyaları seçildi', status: 'info', position: 'top', duration: 1000 });
  };
  const selectOnlyFiles = () => {
    const next = new Set();
    messages.forEach(m => {
      const id = m.id || m._id;
      if (m.file) next.add(id);
    });
    setSelectedMessageIds(next);
    setIsSelectMode(true);
    toast({ title: 'Dosyalar seçildi', status: 'info', position: 'top', duration: 1000 });
  };
  const handleDownloadSelectedMedia = async () => {
    if (selectedMessageIds.size === 0) return;
    const mediaMessages = messages.filter(m => {
      const id = m.id || m._id;
      return selectedMessageIds.has(id) && (m.image || m.video || m.audio || m.file);
    });

    if (mediaMessages.length === 0) {
      toast({ title: 'Medya yok', description: 'Seçilenlerde indirilecek medya bulunamadı', status: 'info', position: 'top' });
      return;
    }

    toast({ title: 'İndirme başlıyor', description: `${mediaMessages.length} dosya indirilecek`, status: 'info', position: 'top' });

    for (const m of mediaMessages) {
      const url = m.image || m.video || m.audio || m.file;
      if (!url) continue;
      
      try {
        const user = m.user?.fullname || 'Bilinmeyen Kullanıcı';
        const date = m.createdAt ? format(new Date(m.createdAt), 'yyyy-MM-dd HH-mm', { locale: tr }) : 'Tarihsiz';
        const ext = url.split('.').pop().split('?')[0] || 'dat';
        const safeUser = user.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ ]/gi, '_');
        const fileName = `${safeUser} - ${date}.${ext}`;

        const response = await fetch(url);
        const blob = await response.blob();
        saveAs(blob, fileName);
        
        // Delay to prevent browser blocking
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error('Download error:', e);
        // Fallback to direct link
        const link = document.createElement('a');
        link.href = url;
        link.download = 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleDownloadSelectedMediaZip = async () => {
    if (selectedMessageIds.size === 0) return;
    const mediaMessages = messages.filter(m => {
      const id = m.id || m._id;
      return selectedMessageIds.has(id) && (m.image || m.video || m.audio || m.file);
    });

    if (mediaMessages.length === 0) {
      toast({ title: 'Medya yok', description: 'Seçilenlerde indirilecek medya bulunamadı', status: 'info', position: 'top' });
      return;
    }

    const toastId = toast({ title: 'ZIP hazırlanıyor...', status: 'info', position: 'top', duration: null });
    
    try {
      const zip = new JSZip();
      
      await Promise.all(mediaMessages.map(async (m) => {
        const url = m.image || m.video || m.audio || m.file;
        if (!url) return;

        try {
          const user = m.user?.fullname || 'Bilinmeyen Kullanıcı';
          const date = m.createdAt ? format(new Date(m.createdAt), 'yyyy-MM-dd HH-mm', { locale: tr }) : 'Tarihsiz';
          const ext = url.split('.').pop().split('?')[0] || 'dat';
          const safeUser = user.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ ]/gi, '_');
          // Add random string to avoid duplicates
          const uniqueSuffix = Math.random().toString(36).substring(7);
          const fileName = `${safeUser} - ${date}-${uniqueSuffix}.${ext}`;
          
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(fileName, blob);
        } catch (e) {
          console.error('Failed to fetch file for ZIP:', url, e);
        }
      }));

      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = format(new Date(), 'yyyy-MM-dd HH-mm', { locale: tr });
      saveAs(content, `Medya Arsivi - ${timestamp}.zip`);
      
      toast.update(toastId, { title: 'ZIP indirildi', status: 'success', duration: 2000 });
    } catch (e) {
      console.error('ZIP error:', e);
      toast.update(toastId, { title: 'ZIP oluşturulamadı', status: 'error', duration: 2000 });
    }
  };
  const handleOpenSelectedMedia = () => {
    if (selectedMessageIds.size === 0) return;
    const medias = messages.filter(m => {
      const id = m.id || m._id;
      return selectedMessageIds.has(id) && (m.image || m.video || m.audio || m.file);
    });
    if (medias.length === 0) {
      toast({ title: 'Medya yok', description: 'Seçilenlerde medya bulunamadı', status: 'info', position: 'top' });
      return;
    }
    medias.forEach(m => {
      const url = m.image || m.video || m.audio || m.file;
      if (url) window.open(url, '_blank');
    });
    toast({ title: 'Medyalar açılıyor', status: 'success', position: 'top', duration: 1200 });
  };
  const fetchAll = async (apiFunc, params = {}) => {
    const limit = 100;
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
  const { data: forwardChannelsData = [], isLoading: isLoadingForwardChannels } = useQuery({
    queryKey: ['all-channels-for-forward'],
    queryFn: () => fetchAll(api.getAllChannels),
  });
  const filteredForwardChannels = React.useMemo(() => {
    if (!forwardSearchQuery.trim()) return forwardChannelsData;
    const q = forwardSearchQuery.toLowerCase();
    return forwardChannelsData.filter(ch => {
      const name = (ch.name || ch.marketCode || ch.fundCode || '').toLowerCase();
      return name.includes(q);
    });
  }, [forwardChannelsData, forwardSearchQuery]);
  const toggleForwardChannel = (channelId) => {
    setForwardSelectedChannelIds(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return Array.from(next);
    });
  };
  const makeForwardContent = () => {
    const lines = messages
      .filter(m => {
        const id = m.id || m._id;
        return selectedMessageIds.has(id) && (m.text || m.image || m.video || m.audio || m.file);
      })
      .map(m => {
        const author = m.user?.fullname || 'Kullanıcı';
        const time = m.createdAt ? format(new Date(m.createdAt), 'dd MMM yyyy HH:mm', { locale: tr }) : '';
        const kind = m.image ? '📷 Görsel' : m.video ? '🎬 Video' : m.audio ? '🎵 Ses' : m.file ? '📄 Dosya' : '📝 Metin';
        const text = m.text ? m.text : '';
        return `${author} • ${time} • ${kind}${text ? `: ${text}` : ''}`;
      });
    if (forwardIncludeLinks) {
      const linkLines = messages
        .filter(m => {
          const id = m.id || m._id;
          return selectedMessageIds.has(id);
        })
        .map(m => {
          const mid = m.id || m._id;
          return `${window.location.origin}${routes.channelChat.getPath(channelId)}?messageId=${encodeURIComponent(mid)}`;
        });
      if (linkLines.length > 0) {
        lines.push('', ...linkLines);
      }
    }
    return lines.join('\n');
  };
  const { mutateAsync: forwardMutateAsync, isPending: isForwardPending } = useMutation({
    mutationFn: (values) => api.sendBulkMessage(values),
  });
  const handleForwardSelected = async () => {
    if (forwardSelectedChannelIds.length === 0 || selectedMessageIds.size === 0) {
      toast({ title: 'Seçim eksik', description: 'Kanal ve mesaj seçmelisiniz', status: 'warning', position: 'top' });
      return;
    }
    try {
      setIsForwarding(true);
      const message = makeForwardContent();
      const body = {
        targetType: 'selected',
        selectedChannels: forwardSelectedChannelIds,
        message,
      };
      await forwardMutateAsync(body);
      toast({ title: 'Mesajlar iletildi', status: 'success', position: 'top', duration: 2000 });
      bulkForwardModal.onClose();
      setForwardSelectedChannelIds([]);
      setForwardSearchQuery('');
    } catch (e) {
      toast({
        title: 'İletme başarısız',
        description: e?.response?.data?.message || 'Mesajlar iletilemedi',
        status: 'error',
        position: 'top',
      });
    } finally {
      setIsForwarding(false);
    }
  };
  const handleCopySelectedTexts = async () => {
    if (selectedMessageIds.size === 0) return;
    const lines = messages
      .filter(m => {
        const id = m.id || m._id;
        return selectedMessageIds.has(id) && m.text;
      })
      .map(m => {
        const author = m.user?.fullname || 'Kullanıcı';
        const time = m.createdAt ? format(new Date(m.createdAt), 'dd MMM yyyy HH:mm', { locale: tr }) : '';
        return `${author} • ${time}: ${m.text}`;
      });
    if (lines.length === 0) {
      toast({ title: 'Metin yok', description: 'Seçilenlerde metin içeriği bulunamadı', status: 'info', position: 'top' });
      return;
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast({ title: 'Kopyalandı', status: 'success', position: 'top', duration: 1200 });
    } catch {
      toast({ title: 'Kopyalanamadı', status: 'error', position: 'top' });
    }
  };
  const handleCopySelectedLinks = async () => {
    if (selectedMessageIds.size === 0) return;
    const lines = messages
      .filter(m => {
        const id = m.id || m._id;
        return selectedMessageIds.has(id) && id;
      })
      .map(m => {
        const mid = m.id || m._id;
        const url = `${window.location.origin}${routes.channelChat.getPath(channelId)}?messageId=${encodeURIComponent(mid)}`;
        return url;
      });
    if (lines.length === 0) {
      toast({ title: 'Bağlantı yok', description: 'Seçilenlerde bağlantı üretilemedi', status: 'info', position: 'top' });
      return;
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast({ title: 'Bağlantılar kopyalandı', status: 'success', position: 'top', duration: 1200 });
    } catch {
      toast({ title: 'Kopyalanamadı', status: 'error', position: 'top' });
    }
  };

  useEffect(() => {
    const handler = (e) => {
      // Ctrl + A : select all
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsSelectMode(true);
        selectAllMessages();
        toast({ title: 'Tüm mesajlar seçildi', status: 'info', position: 'top', duration: 1000 });
        return;
      }
      // Ctrl + Shift + B : select blocked
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        selectOnlyBlocked();
        toast({ title: 'Engelli mesajlar seçildi', status: 'info', position: 'top', duration: 1000 });
        return;
      }
      // Ctrl + Shift + N : select unblocked (normal)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        selectOnlyUnblocked();
        toast({ title: 'Normal mesajlar seçildi', status: 'info', position: 'top', duration: 1000 });
        return;
      }
      // Esc : exit select mode
      if (e.key === 'Escape') {
        if (isSelectMode) {
          setIsSelectMode(false);
          setSelectedMessageIds(new Set());
          toast({ title: 'Seçim modu kapatıldı', status: 'info', position: 'top', duration: 1000 });
        }
        return;
      }
      if (isSelectMode && selectedMessageIds.size > 0) {
        const archiveDeleteShortcut =
          (e.key === 'Delete' && e.shiftKey) ||
          (e.key === 'Backspace' && e.shiftKey);
        if (archiveDeleteShortcut) {
          e.preventDefault();
          if (!shownArchiveDeleteHint) {
            toast({
              title: 'Kısayol: Shift+Delete',
              description: 'Seçilenleri arşivle ve sil',
              status: 'info',
              position: 'top',
              duration: 1500,
            });
            setShownArchiveDeleteHint(true);
          }
          handleArchiveAndDeleteSelected();
          return;
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCopySelectedTexts();
          return;
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
          e.preventDefault();
          handleCopySelectedLinks();
          return;
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
          e.preventDefault();
          selectOnlyMedia();
          return;
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
          e.preventDefault();
          selectOnlyText();
          return;
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          bulkForwardModal.onOpen();
          toast({ title: 'İlet', description: 'Hedef kanalları seç', status: 'info', position: 'top', duration: 1000 });
          return;
        }
        if (e.key.toLowerCase() === 'p' && e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          setBulkArchiveAndPin(false);
          bulkPinModal.onOpen();
          toast({
            title: 'Sabitleme',
            description: 'Süre seç',
            status: 'info',
            position: 'top',
            duration: 1000,
          });
          return;
        }
      }
      // Delete : delete selected
      if (e.key === 'Delete' && !e.shiftKey && isSelectMode && selectedMessageIds.size > 0) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectMode, selectedMessageIds, messages]);
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
                {' • '}
                {channel?.memberCount || channel?.members?.length || 0} üye
              </Text>
            </VStack>
          </HStack>
          <HStack spacing="2">
            <Tooltip label="Arşivlenmiş Mesajlar">
              <IconButton
                icon={<FiArchive />}
                variant="ghost"
                onClick={() => {
                  const url = `${routes.archivedMessages.path}?channelId=${encodeURIComponent(channelId)}`;
                  navigate(url);
                }}
                aria-label="Arşivlenmiş Mesajlar"
              />
            </Tooltip>
            {/* Select Mode Controls */}
            {isSelectMode ? (
              <>
                <Badge colorScheme="blue" fontSize="sm" px="2" py="1">
                  {selectedMessageIds.size} seçili
                </Badge>
                <Badge colorScheme="red" fontSize="sm" px="2" py="1">
                  Engelli: {selectedBlockedCount}
                </Badge>
                <Badge colorScheme="green" fontSize="sm" px="2" py="1">
                  Normal: {selectedUnblockedCount}
                </Badge>
                <Menu>
                  <Tooltip label="Filtrele">
                    <MenuButton
                      as={IconButton}
                      icon={<FiFilter />}
                      variant="ghost"
                      colorScheme="blue"
                    />
                  </Tooltip>
                  <MenuList zIndex={10}>
                    <MenuItem onClick={selectAllMessages} icon={<FiCheckSquare />}>Tümünü Seç</MenuItem>
                    <MenuItem onClick={clearSelection} icon={<FiSquare />}>Seçimi Temizle</MenuItem>
                    <MenuItem onClick={selectOnlyBlocked} color="red.500">Sadece Engelliler</MenuItem>
                    <MenuItem onClick={selectOnlyUnblocked} color="green.500">Sadece Normaller</MenuItem>
                    <MenuItem onClick={selectOnlyText} icon={<FiFile />}>Sadece Metinler</MenuItem>
                    <MenuItem onClick={selectOnlyMedia} icon={<FiImage />}>Tüm Medyalar</MenuItem>
                    <MenuItem onClick={selectOnlyImages} icon={<FiImage />}>Sadece Görseller</MenuItem>
                    <MenuItem onClick={selectOnlyVideos} icon={<FiVideo />}>Sadece Videolar</MenuItem>
                    <MenuItem onClick={selectOnlyAudios} icon={<FiMusic />}>Sadece Sesler</MenuItem>
                    <MenuItem onClick={selectOnlyFiles} icon={<FiFile />}>Sadece Dosyalar</MenuItem>
                  </MenuList>
                </Menu>
                <Tooltip label="Seçilenleri Sil (Delete)">
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
                <Tooltip label="Seçilenleri Arşivle">
                  <IconButton
                    icon={<FiArchive />}
                    variant="outline"
                    colorScheme="gray"
                    onClick={handleArchiveSelected}
                    isLoading={isArchiving}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenleri Arşivle"
                  />
                </Tooltip>
                <Tooltip label="Seçilenleri Arşivle ve Sil (Shift+Delete)">
                  <IconButton
                    icon={<FiTrash2 />}
                    variant="solid"
                    colorScheme="red"
                    onClick={handleArchiveAndDeleteSelected}
                    isLoading={isArchivingDeleting}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenleri Arşivle ve Sil"
                  />
                </Tooltip>
                <Tooltip label="Seçilenleri Sabitle (Ctrl+Shift+P)">
                  <IconButton
                    icon={<FiMapPin />}
                    variant="outline"
                    colorScheme="yellow"
                    onClick={bulkPinModal.onOpen}
                    isLoading={isPinning}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenleri Sabitle"
                  />
                </Tooltip>
                <Tooltip label="Seçilen Medyaları Aç">
                  <IconButton
                    icon={<FiExternalLink />}
                    variant="outline"
                    onClick={handleOpenSelectedMedia}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilen Medyaları Aç"
                  />
                </Tooltip>
                <Menu>
                  <Tooltip label="Medyaları İndir">
                    <MenuButton
                      as={IconButton}
                      icon={<FiDownload />}
                      variant="outline"
                      isDisabled={selectedMessageIds.size === 0}
                    />
                  </Tooltip>
                  <MenuList zIndex={10}>
                    <MenuItem onClick={handleDownloadSelectedMedia} icon={<FiDownload />}>
                      Tek Tek İndir (İsimli)
                    </MenuItem>
                    <MenuItem onClick={handleDownloadSelectedMediaZip} icon={<FiArchive />}>
                      Toplu İndir (ZIP)
                    </MenuItem>
                  </MenuList>
                </Menu>
                <Tooltip label="Seçilenlerin Metnini Kopyala (Ctrl+C)">
                  <IconButton
                    icon={<FiCopy />}
                    variant="outline"
                    onClick={handleCopySelectedTexts}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenlerin Metnini Kopyala"
                  />
                </Tooltip>
                <Tooltip label="Seçilenlerin Bağlantısını Kopyala (Ctrl+L)">
                  <IconButton
                    icon={<FiLink />}
                    variant="outline"
                    onClick={handleCopySelectedLinks}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenlerin Bağlantısını Kopyala"
                  />
                </Tooltip>
                <Tooltip label="Seçilenleri İlet (Ctrl+Shift+F)">
                  <IconButton
                    icon={<FiSend />}
                    variant="outline"
                    colorScheme="blue"
                    onClick={bulkForwardModal.onOpen}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenleri İlet"
                  />
                </Tooltip>
                <Tooltip label="Seçilenlerin Sabitlemesini Kaldır">
                  <IconButton
                    icon={<FiMapPin />}
                    variant="outline"
                    colorScheme="red"
                    onClick={handleUnpinSelected}
                    isLoading={isUnpinning}
                    isDisabled={selectedMessageIds.size === 0 || Array.from(selectedMessageIds).every(id => !pinnedIds.has(id))}
                    aria-label="Seçilenlerin Sabitlemesini Kaldır"
                  />
                </Tooltip>
                <Tooltip label="Seçilenleri Engelle">
                  <IconButton
                    icon={<FiShield />}
                    variant="outline"
                    colorScheme="red"
                    onClick={bulkBlockModal.onOpen}
                    isLoading={isBlockingSelected}
                    isDisabled={!anyUnblockedSelected}
                    aria-label="Seçilenleri Engelle"
                  />
                </Tooltip>
                <Tooltip label="Seçilenlerin Engelini Kaldır">
                  <IconButton
                    icon={<FiCheck />}
                    variant="outline"
                    colorScheme="green"
                    onClick={bulkUnblockModal.onOpen}
                    isLoading={isUnblockingSelected}
                    isDisabled={!anyBlockedSelected}
                    aria-label="Seçilenlerin Engelini Kaldır"
                  />
                </Tooltip>
                <Tooltip label="Seçilenleri Arşivle ve Sabitle">
                  <IconButton
                    icon={<FiMapPin />}
                    variant="outline"
                    colorScheme="yellow"
                    onClick={() => {
                      setBulkArchiveAndPin(true);
                      bulkPinModal.onOpen();
                    }}
                    isLoading={isPinning}
                    isDisabled={selectedMessageIds.size === 0}
                    aria-label="Seçilenleri Arşivle ve Sabitle"
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
                    onClick={() => setCreateConferenceModalOpen(true)}
                    isLoading={isSending}
                    aria-label="Video Görüşme"
                  />
                </Tooltip>
                <Tooltip label="Kanal Bağlantısını Kopyala">
                  <IconButton
                    icon={<FiLink />}
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const url = `${window.location.origin}${routes.channelChat.getPath(channelId)}`;
                        await navigator.clipboard.writeText(url);
                        toast({
                          title: 'Kanal bağlantısı kopyalandı',
                          status: 'success',
                          position: 'top',
                          duration: 1500,
                        });
                      } catch (error) {
                        toast({
                          title: 'Bağlantı kopyalanamadı',
                          status: 'error',
                          position: 'top',
                        });
                      }
                    }}
                    aria-label="Kanal Bağlantısı"
                  />
                </Tooltip>
                <Tooltip label="Kanalı yeni sekmede aç">
                  <IconButton
                    icon={<FiExternalLink />}
                    variant="ghost"
                    onClick={() => {
                      const url = `${window.location.origin}${routes.channelChat.getPath(channelId)}`;
                      window.open(url, '_blank');
                    }}
                    aria-label="Kanalı yeni sekmede aç"
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

      {/* Pinned banner - Fixed above messages */}
      {(pinnedMessages && pinnedMessages.length > 0) && (
        <Box bg="yellow.50" border="1px solid" borderColor="yellow.200" p="2" borderRadius="md" mb="2">
          <HStack justify="space-between" align="center">
            <HStack spacing="2" align="center">
              <Icon as={FiMapPin} color="yellow.600" />
              <Text fontSize="sm" color="yellow.800">
                Sabitlenen mesajlar: {pinnedMessages.length}
              </Text>
            </HStack>
            <HStack spacing="2" align="center">
              <IconButton
                size="xs"
                variant="ghost"
                icon={<FiChevronUp />}
                aria-label="Önceki sabit"
                isDisabled={pinnedIndex === 0}
                onClick={() => handleNavigatePinned('prev')}
              />
              <Text fontSize="xs" color="yellow.800">
                {Math.min(pinnedIndex + 1, pinnedMessages.length)}/{pinnedMessages.length}
              </Text>
              <IconButton
                size="xs"
                variant="ghost"
                icon={<FiChevronDown />}
                aria-label="Sonraki sabit"
                isDisabled={pinnedIndex >= pinnedMessages.length - 1}
                onClick={() => handleNavigatePinned('next')}
              />
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  const current = pinnedMessages[pinnedIndex];
                  const mid = current?.messageId || current?.message?.id || current?.id;
                  if (mid) scrollToMessage(mid);
                }}
              >
                Mesaja git
              </Button>
              <Button
                size="xs"
                onClick={handleOpenPinnedModal}
              >
                Tümünü gör
              </Button>
            </HStack>
          </HStack>
        </Box>
      )}

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        bg="gray.50"
        borderRadius="xl"
        p="4"
        height="calc(100vh - 430px)" // Adjusted height to accommodate pinned banner
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
            {isFetchingNextPage && (
              <Box textAlign="center" py="4">
                <HStack justify="center" spacing="2">
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="sm" color="gray.500">Eski mesajlar yükleniyor...</Text>
                </HStack>
              </Box>
            )}
            
            {/* Load more indicator */}
            {hasNextPage && !isFetchingNextPage && (
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

            {(() => {
              const groups = [];
              let currentGroup = null;

              messages.forEach((message) => {
                const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
                
                if (!currentGroup || !isSameDay(new Date(currentGroup.date), messageDate)) {
                  currentGroup = {
                    date: message.createdAt,
                    messages: []
                  };
                  groups.push(currentGroup);
                }
                currentGroup.messages.push(message);
              });

              return groups.map((group, groupIndex) => (
                <Box key={group.date || groupIndex}>
                  <Box 
                    position="sticky" 
                    top="2" 
                    zIndex="5" 
                    textAlign="center" 
                    mb="2" 
                    mt="4"
                    pointerEvents="none"
                  >
                    <Badge 
                      bg="whiteAlpha.900" 
                      color="gray.600" 
                      px="3" 
                      py="1" 
                      borderRadius="full" 
                      fontSize="xs"
                      boxShadow="sm"
                      fontWeight="medium"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      {(() => {
                         if (!group.date) return 'Tarihsiz';
                         const date = new Date(group.date);
                         if (isToday(date)) return 'Bugün';
                         if (isYesterday(date)) return 'Dün';
                         return format(date, 'd MMMM yyyy', { locale: tr });
                      })()}
                    </Badge>
                  </Box>
                  {group.messages.map((message) => {
                    const messageId = message.id || message._id;
                    return (
                      <MessageBubble
                        key={messageId}
                        message={message}
                        isOwn={message.user?.id === currentUserId}
                        onReply={handleReply}
                        onReactionClick={handleReactionClick}
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
                        onCopyLink={handleCopyLink}
                        onOpenLink={handleOpenLink}
                        onOpenModeration={handleOpenModeration}
                        onArchive={async (msg) => {
                          const id = msg.id || msg._id;
                          try {
                            await api.archiveMessage({ messageId: id, channelId });
                            toast({ title: 'Mesaj arşivlendi', status: 'success', duration: 1500, position: 'top' });
                          } catch (e) {
                            toast({
                              title: 'Hata',
                              description: e?.response?.data?.message || 'Mesaj arşivlenemedi',
                              status: 'error',
                              duration: 3000,
                              position: 'top',
                            });
                          }
                        }}
                        onArchiveAndPin={handleArchiveAndPin}
                        onBlock={handleBlockMessage}
                        onUnblock={handleUnblockMessage}
                        onDelete={handleDeleteMessageOpen}
                        onCopyText={handleCopyText}
                        onQuoteText={handleQuoteText}
                        onTogglePin={handleTogglePinMessage}
                        isPinned={pinnedIds.has(messageId)}
                      />
                    );
                  })}
                </Box>
              ));
            })()}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      {/* Scroll to Bottom Button */}
      {showScrollBottom && (
        <IconButton
          icon={<FiArrowDown />}
          position="absolute"
          bottom="120px"
          right="6"
          colorScheme="blue"
          rounded="full"
          shadow="lg"
          zIndex="10"
          onClick={scrollToBottom}
          aria-label="En aşağıya git"
          size="lg"
          animation="fadeIn 0.2s"
        />
      )}

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

      <Modal isOpen={blockModal.isOpen} onClose={blockModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mesajı Engelle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Engelleme sebebi</FormLabel>
              <Select
                placeholder="Sebep seçin"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                mb="3"
              >
                <option value="Spam">Spam</option>
                <option value="Uygunsuz dil">Uygunsuz dil</option>
                <option value="Kişisel saldırı">Kişisel saldırı</option>
                <option value="Reklam / tanıtım">Reklam / tanıtım</option>
                <option value="Yanlış bilgi">Yanlış bilgi</option>
              </Select>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Sebep"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="3">
              <Button variant="ghost" onClick={blockModal.onClose}>İptal</Button>
              <Button colorScheme="red" onClick={handleConfirmBlock} isLoading={blockMutation.isPending} isDisabled={!blockReason || blockReason.trim().length === 0}>
                Engelle
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={singlePinModal.isOpen} onClose={singlePinModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mesajı Sabitle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="4">
              {singlePinTarget && (
                <Box bg="gray.50" p="3" borderRadius="md" border="1px solid" borderColor="gray.100">
                  <Text fontSize="sm" fontWeight="600">{singlePinTarget.user?.fullname || 'Kullanıcı'}</Text>
                  <Text fontSize="sm" color="gray.700" noOfLines={2}>
                    {singlePinTarget.text || (singlePinTarget.image ? '📷 Görsel' : singlePinTarget.video ? '🎬 Video' : singlePinTarget.audio ? '🎵 Ses' : singlePinTarget.file ? '📄 Dosya' : 'Mesaj')}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {singlePinTarget.createdAt ? format(new Date(singlePinTarget.createdAt), 'dd MMM yyyy HH:mm', { locale: tr }) : ''}
                  </Text>
                </Box>
              )}
              <FormControl>
                <FormLabel>Sabitleme süresi</FormLabel>
                <RadioGroup value={singlePinDuration} onChange={setSinglePinDuration}>
                  <VStack align="start" spacing="2">
                    <Radio value="24h">24 Saat</Radio>
                    <Radio value="7d">7 Gün</Radio>
                    <Radio value="unlimited">Sınırsız</Radio>
                    <Radio value="custom">Özel</Radio>
                  </VStack>
                </RadioGroup>
              </FormControl>
              {singlePinDuration === 'custom' && (
                <HStack spacing="3">
                  <FormControl>
                    <FormLabel>Süre</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      value={singleCustomDurationValue}
                      onChange={(e) => setSingleCustomDurationValue(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Birim</FormLabel>
                    <Select
                      value={singleCustomDurationUnit}
                      onChange={(e) => setSingleCustomDurationUnit(e.target.value)}
                    >
                      <option value="hours">Saat</option>
                      <option value="days">Gün</option>
                    </Select>
                  </FormControl>
                </HStack>
              )}
              <Checkbox
                isChecked={singleArchiveBeforePin}
                onChange={(e) => setSingleArchiveBeforePin(e.target.checked)}
              >
                Sabitlemeden önce arşivle
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="3">
              <Button variant="ghost" onClick={singlePinModal.onClose}>İptal</Button>
              <Button
                colorScheme="yellow"
                isLoading={pinWithDurationMutation.isPending}
                isDisabled={singlePinDuration === 'custom' && (!singleCustomDurationValue || singleCustomDurationValue <= 0)}
                onClick={async () => {
                  const ms = singlePinDuration === '24h'
                    ? 24 * 60 * 60 * 1000
                    : singlePinDuration === '7d'
                      ? 7 * 24 * 60 * 60 * 1000
                      : singlePinDuration === 'custom'
                        ? (singleCustomDurationValue * (singleCustomDurationUnit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
                        : undefined;
                  const id = singlePinTarget?.id || singlePinTarget?._id;
                  if (id) {
                    if (singleArchiveBeforePin) {
                      try {
                        await api.archiveMessage({ messageId: id, channelId });
                      } catch (e) {
                        toast({
                          title: 'Arşivleme başarısız',
                          description: e?.response?.data?.message || 'Mesaj arşivlenemedi, sabitleme deneniyor',
                          status: 'warning',
                          duration: 2500,
                          position: 'top',
                        });
                      }
                    }
                    await pinWithDurationMutation.mutateAsync({ messageId: id, durationMs: ms });
                  }
                  singlePinModal.onClose();
                  setSinglePinTarget(null);
                  setSingleArchiveBeforePin(false);
                }}
              >
                Sabitle
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mesajı Sil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="3">
              <Text>Bu mesajı silmek istediğinden emin misin?</Text>
              {messageToDelete && (
                <Box bg="gray.50" p="3" borderRadius="md">
                  <HStack align="start" spacing="3">
                    <Avatar
                      size="sm"
                      name={messageToDelete.user?.fullname}
                      src={getCombinedLogoUrl(messageToDelete.user?.thumbnail)}
                    />
                    <VStack align="start" spacing="1" flex="1">
                      <Text fontSize="sm" fontWeight="600">
                        {messageToDelete.user?.fullname || 'Kullanıcı'}
                      </Text>
                      {messageToDelete.text ? (
                        <Text fontSize="sm" color="gray.700" noOfLines={3}>
                          {messageToDelete.text}
                        </Text>
                      ) : (
                        <HStack spacing="3">
                          {messageToDelete.image && (
                            <HStack spacing="1">
                              <Icon as={FiImage} color="gray.600" />
                              <Text fontSize="sm" color="gray.700">Görsel</Text>
                            </HStack>
                          )}
                          {messageToDelete.video && (
                            <HStack spacing="1">
                              <Icon as={FiVideo} color="gray.600" />
                              <Text fontSize="sm" color="gray.700">Video</Text>
                            </HStack>
                          )}
                          {messageToDelete.audio && (
                            <HStack spacing="1">
                              <Icon as={FiMusic} color="gray.600" />
                              <Text fontSize="sm" color="gray.700">Ses</Text>
                            </HStack>
                          )}
                          {messageToDelete.file && (
                            <HStack spacing="1">
                              <Icon as={FiFile} color="gray.600" />
                              <Text fontSize="sm" color="gray.700">Dosya</Text>
                            </HStack>
                          )}
                        </HStack>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        {messageToDelete.createdAt
                          ? format(new Date(messageToDelete.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })
                          : ''}
                      </Text>
                      <HStack spacing="2" mt="2">
                        <Tooltip label="Bağlantıyı kopyala">
                          <IconButton
                            icon={<FiLink />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyLink(messageToDelete)}
                            aria-label="Bağlantıyı kopyala"
                          />
                        </Tooltip>
                        <Tooltip label="Yeni sekmede aç">
                          <IconButton
                            icon={<FiExternalLink />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenLink(messageToDelete)}
                            aria-label="Yeni sekmede aç"
                          />
                        </Tooltip>
                        {messageToDelete.text && (
                          <Tooltip label="Metni kopyala">
                            <IconButton
                              icon={<FiCopy />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyText(messageToDelete)}
                              aria-label="Metni kopyala"
                            />
                          </Tooltip>
                        )}
                        <Tooltip label="Mesaja git">
                          <IconButton
                            icon={<FiSearch />}
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const id = messageToDelete.id || messageToDelete._id;
                              deleteModal.onClose();
                              setTimeout(() => scrollToMessage(id), 200);
                            }}
                            aria-label="Mesaja git"
                          />
                        </Tooltip>
                      </HStack>
                      <Text fontSize="xs" color="gray.400" mt="1">
                        ID: {messageToDelete.id || messageToDelete._id}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
              <Text fontSize="xs" color="red.500">Bu işlem geri alınamaz.</Text>
              <FormControl>
                <FormLabel>Silme kapsamı</FormLabel>
                <RadioGroup value={deleteScope} onChange={setDeleteScope}>
                  <HStack spacing="6">
                    <Radio value="all">Herkes için sil</Radio>
                    <Radio value="me">Sadece benim için sil</Radio>
                  </HStack>
                </RadioGroup>
              </FormControl>
              <Checkbox
                isChecked={archiveBeforeDelete}
                onChange={(e) => setArchiveBeforeDelete(e.target.checked)}
                isDisabled={deleteScope === 'me'}
              >
                Silmeden önce arşivle
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="3">
              <Button variant="ghost" onClick={deleteModal.onClose}>İptal</Button>
              <Button colorScheme="red" onClick={handleConfirmDeleteMessage}>
                Sil
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={bulkBlockModal.isOpen} onClose={bulkBlockModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Seçilenleri Engelle</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing="3">
            <Text fontSize="sm" color="gray.600">
              Seçilen mesajlar engellenecek. Bir gerekçe belirtin.
            </Text>
            <FormControl>
              <FormLabel>Gerekçe</FormLabel>
              <Textarea
                value={bulkBlockReason}
                onChange={(e) => setBulkBlockReason(e.target.value)}
                placeholder="Ör: Uygunsuz içerik, spam, vb."
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing="3">
            <Button variant="ghost" onClick={bulkBlockModal.onClose}>İptal</Button>
            <Button
              colorScheme="red"
              isLoading={isBlockingSelected}
              isDisabled={!bulkBlockReason || !anyUnblockedSelected}
              onClick={handleBlockSelected}
            >
              Engelle
            </Button>
          </HStack>
        </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={bulkUnblockModal.isOpen} onClose={bulkUnblockModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Engeli Kaldır</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="3">
              <Text fontSize="sm" color="gray.600">
                {selectedBlockedCount} engelli mesajın engeli kaldırılacak. Devam etmek istiyor musun?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="3">
              <Button variant="ghost" onClick={bulkUnblockModal.onClose}>İptal</Button>
              <Button
                colorScheme="green"
                isLoading={isUnblockingSelected}
                isDisabled={!anyBlockedSelected}
                onClick={async () => {
                  await handleUnblockSelected();
                  bulkUnblockModal.onClose();
                }}
              >
                Engeli Kaldır
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={bulkForwardModal.isOpen} onClose={bulkForwardModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Seçilenleri İlet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="3">
              <Input
                placeholder="Kanal ara..."
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
              />
              <Box maxH="300px" overflowY="auto" border="1px solid" borderColor="gray.100" borderRadius="md" p="2">
                {isLoadingForwardChannels ? (
                  <Box textAlign="center" py="6">
                    <Spinner size="md" color="blue.500" />
                  </Box>
                ) : filteredForwardChannels.length === 0 ? (
                  <Text fontSize="sm" color="gray.600">Kanal bulunamadı</Text>
                ) : (
                  <VStack align="stretch" spacing="2">
                    {filteredForwardChannels.map((ch) => (
                      <HStack key={ch.id} justify="space-between">
                        <Text fontSize="sm">{ch.name || ch.marketCode || ch.fundCode || ch.id}</Text>
                        <Checkbox
                          isChecked={forwardSelectedChannelIds.includes(ch.id)}
                          onChange={() => toggleForwardChannel(ch.id)}
                        >
                          Seç
                        </Checkbox>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>
              <Checkbox
                isChecked={forwardIncludeLinks}
                onChange={(e) => setForwardIncludeLinks(e.target.checked)}
              >
                Mesaj bağlantılarını ekle
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="3">
              <Button variant="ghost" onClick={bulkForwardModal.onClose}>İptal</Button>
              <Button
                colorScheme="blue"
                isLoading={isForwarding || isForwardPending}
                isDisabled={forwardSelectedChannelIds.length === 0 || selectedMessageIds.size === 0}
                onClick={handleForwardSelected}
              >
                İlet ({forwardSelectedChannelIds.length})
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={pinnedModal.isOpen} onClose={pinnedModal.onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sabitlenen Mesajlar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="3">
              {!pinnedMessages?.length && (
                <Text fontSize="sm" color="gray.500">Sabitlenen mesaj bulunmuyor.</Text>
              )}
              {pinnedMessages?.map((pm) => {
                const mid = pm?.messageId || pm?.message?.id || pm?.id;
                const senderName = pm?.originalSender?.name || pm?.message?.user?.fullname || 'Kullanıcı';
                const preview =
                  pm?.messageContent?.text ||
                  (pm?.messageContent?.image ? '📷 Görsel' :
                   pm?.messageContent?.video ? '🎬 Video' :
                   pm?.messageContent?.audio ? '🎵 Ses' : 'Mesaj');
                const pinnedAt = pm?.pinnedAt || pm?.createdAt;
                const pinId = pm?._id || pm?.id;
                return (
                  <Box key={mid || pinId} bg="gray.50" p="3" borderRadius="md" border="1px solid" borderColor="gray.100">
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing="1" flex="1">
                        <Text fontSize="sm" fontWeight="600">{senderName}</Text>
                        <Text fontSize="sm" color="gray.700" noOfLines={2}>{preview}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {pinnedAt ? format(new Date(pinnedAt), 'dd MMM yyyy HH:mm', { locale: tr }) : ''}
                        </Text>
                      </VStack>
                      <HStack spacing="2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (mid) {
                              pinnedModal.onClose();
                              setTimeout(() => scrollToMessage(mid), 200);
                            }
                          }}
                        >
                          Mesaja git
                        </Button>
                        {pinId && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={async () => {
                              await unpinMutation.mutateAsync(pinId);
                            }}
                          >
                            Kaldır
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={pinnedModal.onClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={bulkPinModal.isOpen} onClose={bulkPinModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sabitleme Süresi</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing="4">
              <FormControl>
                <FormLabel>Seçilen mesajlar için sabitleme süresi</FormLabel>
                <RadioGroup value={bulkPinDuration} onChange={setBulkPinDuration}>
                  <VStack align="start" spacing="2">
                    <Radio value="24h">24 Saat</Radio>
                    <Radio value="7d">7 Gün</Radio>
                    <Radio value="unlimited">Sınırsız</Radio>
                    <Radio value="custom">Özel</Radio>
                  </VStack>
                </RadioGroup>
              </FormControl>
              {bulkPinDuration === 'custom' && (
                <HStack spacing="3">
                  <FormControl>
                    <FormLabel>Süre</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      value={customDurationValue}
                      onChange={(e) => setCustomDurationValue(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Birim</FormLabel>
                    <Select
                      value={customDurationUnit}
                      onChange={(e) => setCustomDurationUnit(e.target.value)}
                    >
                      <option value="hours">Saat</option>
                      <option value="days">Gün</option>
                    </Select>
                  </FormControl>
                </HStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="3">
              <Button variant="ghost" onClick={bulkPinModal.onClose}>İptal</Button>
              <Button
                colorScheme="yellow"
                isLoading={isPinning}
                isDisabled={bulkPinDuration === 'custom' && (!customDurationValue || customDurationValue <= 0)}
                onClick={async () => {
                  const ms = bulkPinDuration === '24h'
                    ? 24 * 60 * 60 * 1000
                    : bulkPinDuration === '7d'
                      ? 7 * 24 * 60 * 60 * 1000
                      : bulkPinDuration === 'custom'
                        ? (customDurationValue * (customDurationUnit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
                        : undefined;
                  if (bulkArchiveAndPin) {
                    await handleArchiveAndPinSelected(ms);
                  } else {
                    await handlePinSelected(ms);
                  }
                  bulkPinModal.onClose();
                  setBulkArchiveAndPin(false);
                }}
              >
                Sabitle
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
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

          {/* Quick Like (Heart) Button - Temporarily disabled for debugging
          {!messageText.trim() && (
            <IconButton
              icon={<FiHeart fill="currentColor" />}
              variant="ghost"
              colorScheme="red"
              size="lg"
              onClick={handleSendHeart}
              isDisabled={isSending}
              aria-label="Beğen"
            />
          )}
          */}

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

      {/* Create Conference Modal */}
      <CreateConferenceModal
        isOpen={createConferenceModalOpen}
        onClose={() => setCreateConferenceModalOpen(false)}
        onCreate={handleCreateConference}
        isLoading={isSending}
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
