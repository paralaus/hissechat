import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Grid,
  GridItem,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Input,
  Button,
  Flex,
} from '@chakra-ui/react';
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMessageSquare,
  FiUsers,
  FiMaximize,
  FiMinimize,
  FiSettings,
  FiSend,
  FiCornerUpLeft,
  FiX,
  FiPaperclip,
  FiFile,
  FiDownload,
} from 'react-icons/fi';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import { uploadFile } from '../../api/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const SOCKET_URL = API_URL.replace('/v1', '');

// ICE Servers for WebRTC
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Video participant component
const VideoParticipant = ({ participant, isLocal, isSpeaking, isFullscreen, onFullscreen }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.videoEnabled]);

  return (
    <Box
      position="relative"
      bg="gray.900"
      borderRadius="xl"
      overflow="hidden"
      border={isSpeaking ? '3px solid' : '1px solid'}
      borderColor={isSpeaking ? 'green.400' : 'gray.700'}
      transition="all 0.2s"
      minH="200px"
      h="100%"
    >
      {participant.stream && participant.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isLocal ? 'scaleX(-1)' : 'none',
          }}
        />
      ) : (
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          justifyContent="center"
          alignItems="center"
          bg="gray.800"
        >
          <Avatar
            size="2xl"
            name={participant.userName}
            src={participant.userAvatar}
          />
        </Flex>
      )}

      {/* Name badge */}
      <Box
        position="absolute"
        bottom="2"
        left="2"
        bg="blackAlpha.700"
        px="3"
        py="1"
        borderRadius="md"
      >
        <HStack spacing="2">
          <Text color="white" fontSize="sm" fontWeight="500">
            {isLocal ? 'Sen' : participant.userName}
          </Text>
          {!participant.audioEnabled && (
            <FiMicOff color="#EF4444" size={14} />
          )}
          {participant.handRaised && (
            <span style={{fontSize: '14px'}}>✋</span>
          )}
        </HStack>
      </Box>

      {/* Fullscreen button */}
      <IconButton
        icon={isFullscreen ? <FiMinimize /> : <FiMaximize />}
        position="absolute"
        top="2"
        right="2"
        size="sm"
        variant="ghost"
        colorScheme="whiteAlpha"
        onClick={() => onFullscreen?.(participant.odaId)}
        opacity="0"
        _groupHover={{ opacity: 1 }}
        aria-label="Tam ekran"
      />
    </Box>
  );
};

// Chat panel component with advanced features
const ChatPanel = ({ 
  messages, 
  onSend, 
  onSendFile,
  currentUserId, 
  typingUsers = [], 
  replyingTo, 
  onReply, 
  onCancelReply,
  onStartTyping,
  onStopTyping,
  onAddReaction,
  isUploading = false,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile?.(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎥';
    if (type?.startsWith('audio/')) return '🎵';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    return '📎';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    // Typing indicator
    if (text.length > 0) {
      onStartTyping?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 2000);
    } else {
      onStopTyping?.();
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message, replyingTo);
      setMessage('');
      onStopTyping?.();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render clickable links in text
  const renderContent = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={i}
            as="a"
            href={part}
            target="_blank"
            color="cyan.300"
            textDecoration="underline"
            _hover={{ color: 'cyan.200' }}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <VStack h="100%" spacing="0">
      {/* Header */}
      <HStack w="100%" p="3" borderBottom="1px solid" borderColor="gray.700" justify="space-between">
        <Text color="white" fontWeight="bold" fontSize="sm">💬 Sohbet</Text>
        <Badge colorScheme="blue">{messages.length} mesaj</Badge>
      </HStack>

      {/* Messages */}
      <Box flex="1" w="100%" overflowY="auto" p="3">
        {messages.map((msg, idx) => {
          const isOwn = msg.odaId === currentUserId;
          return (
            <Box
              key={msg.id || idx}
              mb="3"
              ml={isOwn ? 'auto' : '0'}
              mr={isOwn ? '0' : 'auto'}
              maxW="85%"
              role="group"
            >
              {/* Reply preview */}
              {msg.replyTo && (
                <Box
                  bg="gray.600"
                  p="2"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderLeftColor="blue.400"
                  mb="1"
                  fontSize="xs"
                >
                  <Text color="blue.300" fontWeight="bold">{msg.replyTo.userName}</Text>
                  <Text color="gray.300" noOfLines={1}>{msg.replyTo.content}</Text>
                </Box>
              )}
              
              <Box
                p="3"
                bg={isOwn ? 'blue.500' : 'gray.700'}
                borderRadius="lg"
                borderBottomRightRadius={isOwn ? 'sm' : 'lg'}
                borderBottomLeftRadius={isOwn ? 'lg' : 'sm'}
                position="relative"
              >
                {!isOwn && (
                  <Text fontSize="xs" color="blue.300" fontWeight="bold" mb="1">
                    {msg.userName}
                  </Text>
                )}
                
                {/* File message */}
                {msg.type === 'file' && msg.file ? (
                  <Box>
                    <HStack 
                      p="2" 
                      bg={isOwn ? 'blue.600' : 'gray.600'} 
                      borderRadius="md"
                      spacing="3"
                    >
                      <Text fontSize="2xl">{getFileIcon(msg.file.type)}</Text>
                      <VStack align="start" spacing="0" flex="1" minW="0">
                        <Text color="white" fontSize="sm" fontWeight="500" noOfLines={1}>
                          {msg.file.name}
                        </Text>
                        <Text color="gray.300" fontSize="xs">
                          {formatFileSize(msg.file.size)}
                        </Text>
                      </VStack>
                      <IconButton
                        as="a"
                        href={msg.file.url}
                        target="_blank"
                        download={msg.file.name}
                        icon={<FiDownload />}
                        size="sm"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        aria-label="İndir"
                      />
                    </HStack>
                    {msg.content && (
                      <Text color="white" fontSize="sm" mt="2" whiteSpace="pre-wrap">
                        {renderContent(msg.content)}
                      </Text>
                    )}
                  </Box>
                ) : (
                  <Text color="white" fontSize="sm" whiteSpace="pre-wrap">
                    {renderContent(msg.content)}
                  </Text>
                )}
                <Text fontSize="xs" color={isOwn ? 'blue.100' : 'gray.400'} textAlign="right" mt="1">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <HStack spacing="1" mt="1" flexWrap="wrap">
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <Badge 
                        key={emoji} 
                        bg="gray.600" 
                        color="white"
                        borderRadius="full"
                        px="2"
                        py="1"
                        fontSize="xs"
                      >
                        {emoji} {users.length}
                      </Badge>
                    ))}
                  </HStack>
                )}

                {/* Action buttons (visible on hover) */}
                <HStack
                  position="absolute"
                  top="-2"
                  right={isOwn ? 'auto' : '-2'}
                  left={isOwn ? '-2' : 'auto'}
                  opacity="0"
                  _groupHover={{ opacity: 1 }}
                  bg="gray.800"
                  borderRadius="md"
                  p="1"
                  spacing="1"
                  boxShadow="lg"
                >
                  <Tooltip label="Cevapla">
                    <IconButton
                      icon={<FiCornerUpLeft />}
                      size="xs"
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      onClick={() => onReply?.(msg)}
                      aria-label="Cevapla"
                    />
                  </Tooltip>
                  <Tooltip label="Tepki Ekle">
                    <IconButton
                      icon={<span>😀</span>}
                      size="xs"
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                      aria-label="Tepki"
                    />
                  </Tooltip>
                </HStack>

                {/* Emoji picker */}
                {showEmojiPicker === msg.id && (
                  <HStack
                    position="absolute"
                    bottom="-10"
                    left="0"
                    bg="gray.700"
                    p="2"
                    borderRadius="full"
                    boxShadow="lg"
                    zIndex="10"
                  >
                    {EMOJIS.map((emoji) => (
                      <Box
                        key={emoji}
                        cursor="pointer"
                        onClick={() => {
                          onAddReaction?.(msg.id, emoji);
                          setShowEmojiPicker(null);
                        }}
                        _hover={{ transform: 'scale(1.3)' }}
                        transition="transform 0.1s"
                      >
                        {emoji}
                      </Box>
                    ))}
                  </HStack>
                )}
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <Box px="3" py="1" w="100%">
          <Text fontSize="xs" color="gray.400" fontStyle="italic">
            {typingUsers.map(u => u.userName).join(', ')} yazıyor...
          </Text>
        </Box>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <HStack 
          w="100%" 
          px="3" 
          py="2" 
          bg="gray.700" 
          borderLeft="3px solid" 
          borderLeftColor="blue.400"
          justify="space-between"
        >
          <VStack align="start" spacing="0" flex="1">
            <Text fontSize="xs" color="blue.300" fontWeight="bold">
              {replyingTo.userName}'e cevap
            </Text>
            <Text fontSize="xs" color="gray.400" noOfLines={1}>
              {replyingTo.content}
            </Text>
          </VStack>
          <IconButton
            icon={<FiX />}
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={onCancelReply}
            aria-label="İptal"
          />
        </HStack>
      )}

      {/* Input */}
      <HStack p="3" w="100%" borderTop="1px solid" borderColor="gray.700">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="*/*"
        />
        
        {/* File upload button */}
        <Tooltip label="Dosya Ekle">
          <IconButton
            icon={isUploading ? <Spinner size="sm" /> : <FiPaperclip />}
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={() => fileInputRef.current?.click()}
            isDisabled={isUploading}
            aria-label="Dosya Ekle"
          />
        </Tooltip>
        
        <Input
          value={message}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          placeholder="Mesaj yaz..."
          bg="gray.700"
          border="none"
          color="white"
          _placeholder={{ color: 'gray.400' }}
          flex="1"
        />
        <IconButton
          icon={<FiSend />}
          colorScheme="blue"
          onClick={handleSend}
          isDisabled={!message.trim()}
          aria-label="Gönder"
        />
      </HStack>
    </VStack>
  );
};

// Main VideoConference component
const VideoConference = ({ roomId, channelId, title, onClose }) => {
  const toast = useToast();
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [fullscreenUser, setFullscreenUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [polls, setPolls] = useState([]);
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  
  // Refs
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);

  // Get current user
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (e) {
      console.error('Error getting user:', e);
    }
    return null;
  };

  const currentUser = getCurrentUser();

  // Get auth token from cookies
  const getToken = () => {
    return Cookies.get('token');
  };

  // Create peer connection (or return existing one)
  const createPeerConnection = useCallback((socketId, remoteUserId, remoteUserName, remoteUserAvatar) => {
    // Check if we already have a peer connection for this socket
    const existingPc = peersRef.current.get(socketId);
    if (existingPc) {
      console.log(`Reusing existing peer connection for ${socketId}`);
      return existingPc;
    }

    console.log(`Creating new peer connection for ${socketId} (${remoteUserName})`);
    
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });

    // Add local tracks
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Adding ${tracks.length} local tracks to peer connection`);
      tracks.forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      console.warn('WARNING: No local stream available when creating peer connection');
    }

    // ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    // Track handler
    pc.ontrack = (event) => {
      console.log(`ontrack fired for ${remoteUserId}, streams: ${event.streams.length}`);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        const tracks = remoteStream.getTracks();
        console.log(`Remote stream received with ${tracks.length} tracks`);
        
        // Log each track's details
        tracks.forEach((track, index) => {
          console.log(`Track ${index}: kind=${track.kind}, enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
        });
        
        // Check if video track exists and is enabled
        const videoTracks = remoteStream.getVideoTracks();
        const audioTracks = remoteStream.getAudioTracks();
        console.log(`Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`);
        
        if (videoTracks.length > 0) {
          const vt = videoTracks[0];
          console.log(`Video track state: enabled=${vt.enabled}, muted=${vt.muted}, readyState=${vt.readyState}`);
        }
        
        setParticipants(prev => {
          const existing = prev.find(p => p.odaId === remoteUserId);
          if (existing) {
            console.log(`Updating existing participant ${remoteUserId} with stream`);
            return prev.map(p =>
              p.odaId === remoteUserId ? { ...p, stream: remoteStream } : p
            );
          }
          console.log(`Adding new participant ${remoteUserId} with stream`);
          return [...prev, {
            id: socketId,
            odaId: remoteUserId,
            userName: remoteUserName,
            userAvatar: remoteUserAvatar,
            stream: remoteStream,
            audioEnabled: true,
            videoEnabled: true,
            handRaised: false,
          }];
        });
      } else {
        console.warn('WARNING: ontrack fired but no stream available');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer ${remoteUserId} connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') {
        console.log(`Successfully connected to peer ${remoteUserId}`);
      } else if (pc.connectionState === 'failed') {
        console.error(`Peer connection failed for ${remoteUserId}`);
      }
    };

    // ICE connection state handler
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE state for ${remoteUserId}: ${pc.iceConnectionState}`);
    };

    peersRef.current.set(socketId, pc);
    return pc;
  }, []);

  // Track if already initialized (for StrictMode)
  const initializedRef = useRef(false);

  // Initialize conference
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initializedRef.current) {
      console.log('Already initialized, skipping...');
      return;
    }
    initializedRef.current = true;

    const initConference = async () => {
      try {
        // Get local stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        setLocalStream(stream);
        localStreamRef.current = stream;

        // Connect to socket
        const token = getToken();
        if (!token) {
          toast({
            title: 'Oturum hatası',
            description: 'Lütfen tekrar giriş yapın',
            status: 'error',
          });
          onClose?.();
          return;
        }

        console.log('Connecting to:', `${SOCKET_URL}/conference`);
        console.log('Token:', token ? token.substring(0, 20) + '...' : 'null');
        
        socketRef.current = io(`${SOCKET_URL}/conference`, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          timeout: 10000,
        });

        // Connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!isConnected) {
            console.error('Connection timeout');
            toast({
              title: 'Bağlantı zaman aşımı',
              description: 'Sunucuya bağlanılamadı. Backend çalışıyor mu?',
              status: 'error',
            });
            setIsConnecting(false);
          }
        }, 15000);

        // Socket event handlers
        socketRef.current.on('connect', () => {
          console.log('Connected to conference server');
          clearTimeout(connectionTimeout);
          console.log('Joining room:', roomId);
          socketRef.current.emit('join-room', { roomId });
        });

        // Error from server
        socketRef.current.on('error', (data) => {
          console.error('Server error:', data);
          setIsConnecting(false);
          
          let errorMessage = data.message || 'Konferansa katılınamadı';
          if (data.message === 'Conference not found') {
            errorMessage = 'Bu konferans artık aktif değil. Yeni bir konferans başlatın.';
          }
          
          toast({
            title: 'Konferans Hatası',
            description: errorMessage,
            status: 'warning',
            duration: 5000,
          });
          
          // Close the conference screen if conference not found
          if (data.message === 'Conference not found') {
            setTimeout(() => onClose?.(), 2000);
          }
        });

        socketRef.current.on('room-joined', async (data) => {
          console.log('Joined room:', data);
          iceServersRef.current = data.iceServers || DEFAULT_ICE_SERVERS;
          setIsConnected(true);
          setIsConnecting(false);

          // Add existing participants and send offers to them
          for (const participant of data.participants) {
            console.log('Found existing participant:', participant.userName);
            
            // Create peer connection and send offer to existing participant
            const pc = createPeerConnection(
              participant.socketId,
              participant.userId,
              participant.userName,
              participant.userAvatar
            );

            // Send offer to existing participant
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              socketRef.current.emit('offer', {
                to: participant.socketId,
                offer,
              });
              console.log('Sent offer to existing participant:', participant.userName);
            } catch (err) {
              console.error('Error sending offer to existing participant:', err);
            }

            setParticipants(prev => {
              if (prev.some(p => p.odaId === participant.userId)) return prev;
              return [...prev, {
                id: participant.socketId,
                odaId: participant.userId,
                userName: participant.userName,
                userAvatar: participant.userAvatar,
                audioEnabled: true,
                videoEnabled: true,
                handRaised: false,
              }];
            });
          }
        });

        socketRef.current.on('user-joined', async (data) => {
          console.log('User joined:', data);
          
          const pc = createPeerConnection(
            data.socketId,
            data.userId,
            data.userName,
            data.userAvatar
          );
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socketRef.current.emit('offer', {
            to: data.socketId,
            offer,
          });

          setParticipants(prev => {
            if (prev.some(p => p.odaId === data.userId)) return prev;
            return [...prev, {
              id: data.socketId,
              odaId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar,
              audioEnabled: true,
              videoEnabled: true,
              handRaised: false,
            }];
          });

          toast({
            title: `${data.userName} katıldı`,
            status: 'info',
            duration: 2000,
          });
        });

        socketRef.current.on('offer', async (data) => {
          try {
            let pc = peersRef.current.get(data.from);
            
            // If we don't have a peer connection, create one
            if (!pc) {
              pc = createPeerConnection(data.from, data.userId, data.userName || '', data.userAvatar || '');
            }
            
            // Handle glare - if we're in have-local-offer state, rollback and accept the incoming offer
            // "Polite peer" pattern - we're polite, so we rollback our offer
            if (pc.signalingState === 'have-local-offer') {
              console.log('Glare detected, rolling back local offer');
              await pc.setLocalDescription({ type: 'rollback' });
            }
            
            // Now we should be in stable state
            if (pc.signalingState === 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              socketRef.current.emit('answer', {
                to: data.from,
                answer,
              });
            } else {
              console.log('Cannot process offer, signaling state:', pc.signalingState);
            }
          } catch (err) {
            console.error('Error handling offer:', err);
          }
        });

        socketRef.current.on('answer', async (data) => {
          try {
            const pc = peersRef.current.get(data.from);
            if (pc) {
              // Only set remote description if we're expecting an answer
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              } else {
                console.log('Unexpected answer, signaling state:', pc.signalingState);
              }
            }
          } catch (err) {
            console.error('Error handling answer:', err);
          }
        });

        socketRef.current.on('ice-candidate', async (data) => {
          try {
            const pc = peersRef.current.get(data.from);
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        });

        socketRef.current.on('user-left', (data) => {
          console.log('User left:', data);
          peersRef.current.get(data.socketId)?.close();
          peersRef.current.delete(data.socketId);
          setParticipants(prev => prev.filter(p => p.id !== data.socketId));

          toast({
            title: `${data.userName || 'Kullanıcı'} ayrıldı`,
            status: 'info',
            duration: 2000,
          });
        });

        // Media controls
        socketRef.current.on('user-audio-toggle', (data) => {
          setParticipants(prev =>
            prev.map(p => p.odaId === data.userId ? { ...p, audioEnabled: data.enabled } : p)
          );
        });

        socketRef.current.on('user-video-toggle', (data) => {
          setParticipants(prev =>
            prev.map(p => p.odaId === data.userId ? { ...p, videoEnabled: data.enabled } : p)
          );
        });

        // Hand raise
        socketRef.current.on('hand-raise-update', (data) => {
          console.log('hand-raise-update received:', data);
          setParticipants(prev => {
            console.log('Current participants:', prev.map(p => ({ odaId: p.odaId, userName: p.userName })));
            const updated = prev.map(p => p.odaId === data.userId ? { ...p, handRaised: data.raised } : p);
            const found = prev.find(p => p.odaId === data.userId);
            console.log('Found participant to update:', found ? found.userName : 'NOT FOUND');
            return updated;
          });
        });

        // User reactions (floating emojis)
        socketRef.current.on('user-reaction', (data) => {
          const reactionId = Date.now() + Math.random();
          setFloatingReactions(prev => [...prev, {
            id: reactionId,
            emoji: data.emoji,
            userName: data.userName,
          }]);
          // Remove after animation
          setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
          }, 3000);
        });

        // Poll events
        socketRef.current.on('poll-created', (data) => {
          console.log('Poll created:', data);
          setPolls(prev => {
            if (prev.some(p => p.id === data.poll.id)) return prev;
            return [...prev, data.poll];
          });
          toast({
            title: '📊 Yeni Anket',
            description: data.poll.question,
            status: 'info',
            duration: 3000,
          });
        });

        socketRef.current.on('poll-vote', (data) => {
          setPolls(prev => prev.map(poll => {
            if (poll.id !== data.pollId) return poll;
            const existingVote = poll.votes?.find(v => v.odaId === data.odaId);
            if (existingVote && !poll.allowMultiple) return poll;
            const newVotes = [...(poll.votes || []), { odaId: data.odaId, optionIndex: data.optionIndex }];
            const newOptions = poll.options.map((opt, idx) => 
              idx === data.optionIndex ? { ...opt, voteCount: (opt.voteCount || 0) + 1 } : opt
            );
            return { ...poll, votes: newVotes, options: newOptions, totalVotes: newVotes.length };
          }));
        });

        socketRef.current.on('poll-closed', (data) => {
          setPolls(prev => prev.map(poll => 
            poll.id === data.pollId ? { ...poll, isActive: false } : poll
          ));
        });

        // Chat messages
        socketRef.current.on('chat-message', (data) => {
          setMessages(prev => [...prev, { ...data, id: data.id || Date.now() }]);
        });

        // Typing indicators
        socketRef.current.on('user-typing', (data) => {
          setTypingUsers(prev => {
            if (!prev.find(u => u.odaId === data.userId)) {
              return [...prev, { odaId: data.userId, userName: data.userName }];
            }
            return prev;
          });
        });

        socketRef.current.on('user-stop-typing', (data) => {
          setTypingUsers(prev => prev.filter(u => u.odaId !== data.userId));
        });

        // Message reactions
        socketRef.current.on('message-reaction', (data) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.messageId) {
              const reactions = msg.reactions || {};
              const emoji = data.emoji;
              const userId = data.userId;
              if (!reactions[emoji]) reactions[emoji] = [];
              if (!reactions[emoji].includes(userId)) {
                reactions[emoji].push(userId);
              }
              return { ...msg, reactions };
            }
            return msg;
          }));
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message, err);
          setIsConnecting(false);
          toast({
            title: 'Bağlantı hatası',
            description: `Konferansa bağlanılamadı: ${err.message}`,
            status: 'error',
            duration: 10000,
          });
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from conference');
          setIsConnected(false);
        });

      } catch (err) {
        console.error('Conference init error:', err);
        setIsConnecting(false);
        
        if (err.name === 'NotAllowedError') {
          toast({
            title: 'İzin gerekli',
            description: 'Kamera ve mikrofon izni verin',
            status: 'error',
          });
        } else {
          toast({
            title: 'Hata',
            description: 'Konferans başlatılamadı',
            status: 'error',
          });
        }
      }
    };

    initConference();

    // Cleanup only when component actually unmounts
    return () => {
      // Don't cleanup in StrictMode's first unmount
      // Only cleanup when actually leaving
      console.log('Conference cleanup called');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Reset initialization flag
      initializedRef.current = false;
    };
  }, [roomId, createPeerConnection, toast, onClose]);

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        socketRef.current?.emit('toggle-audio', { enabled: audioTrack.enabled });
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        // Track'i durdurma, sadece enabled/disabled yap
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setVideoEnabled(newState);
        socketRef.current?.emit('toggle-video', { enabled: newState });
      }
    }
  };

  // Toggle hand raise
  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    socketRef.current?.emit('hand-raise', { raised: newState });
  };

  // Poll functions
  const createPoll = () => {
    const validOptions = newPollOptions.filter(o => o.trim());
    if (!newPollQuestion.trim() || validOptions.length < 2) {
      toast({
        title: 'Soru ve en az 2 seçenek gerekli',
        status: 'warning',
        duration: 2000,
      });
      return;
    }
    
    const poll = {
      // Don't set ID client-side - let the backend handle it
      question: newPollQuestion.trim(),
      options: validOptions.map(text => ({ text: text.trim(), voteCount: 0 })),
      isActive: true,
      isAnonymous: false,
      allowMultiple: false,
      showResults: true,
    };
    
    socketRef.current?.emit('poll-created', { poll });
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setShowCreatePoll(false);
    
    toast({
      title: 'Anket oluşturuldu',
      status: 'success',
      duration: 2000,
    });
  };

  const votePoll = (pollId, optionIndex) => {
    socketRef.current?.emit('poll-vote', { pollId, optionIndex });
  };

  const closePoll = (pollId) => {
    socketRef.current?.emit('poll-closed', { pollId });
  };

  // Send chat message
  const sendMessage = (content, replyTo = null) => {
    const messageData = { content, type: 'text' };
    if (replyTo) {
      messageData.replyTo = {
        id: replyTo.id,
        userName: replyTo.userName,
        content: replyTo.content,
      };
    }
    socketRef.current?.emit('chat-message', messageData);
    setReplyingTo(null);
  };

  // Send file message
  const sendFile = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Upload file to server
      const response = await uploadFile(file);
      const fileUrl = response.data?.url || response.data?.fileUrl;
      
      if (!fileUrl) {
        throw new Error('Dosya URL\'si alınamadı');
      }
      
      // Send file message via socket
      socketRef.current?.emit('chat-message', {
        type: 'file',
        file: {
          name: file.name,
          url: fileUrl,
          type: file.type,
          size: file.size,
        },
      });
      
      toast({
        title: 'Dosya gönderildi',
        status: 'success',
        duration: 2000,
      });
    } catch (err) {
      console.error('File upload error:', err);
      toast({
        title: 'Dosya gönderilemedi',
        description: err.message || 'Bir hata oluştu',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Typing indicators
  const startTyping = () => {
    socketRef.current?.emit('typing-start');
  };

  const stopTyping = () => {
    socketRef.current?.emit('typing-stop');
  };

  // Add reaction to message
  const addReaction = (messageId, emoji) => {
    socketRef.current?.emit('message-reaction', { messageId, emoji });
  };

  // Send floating reaction (visible to all participants)
  const sendReaction = (emoji) => {
    socketRef.current?.emit('reaction', { emoji });
    setShowReactionPicker(false);
  };

  // Leave conference
  const leaveConference = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    peersRef.current.forEach(pc => pc.close());
    if (socketRef.current) {
      socketRef.current.emit('leave-room');
      socketRef.current.disconnect();
    }
    onClose?.();
  };

  // Local participant for display
  const localParticipant = {
    odaId: currentUser?.id,
    userName: currentUser?.name || 'Ben',
    userAvatar: currentUser?.thumbnail,
    stream: localStream,
    audioEnabled,
    videoEnabled,
    handRaised,
  };

  const allParticipants = [localParticipant, ...participants];

  if (isConnecting) {
    return (
      <Flex
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="gray.900"
        justifyContent="center"
        alignItems="center"
        zIndex="9999"
      >
        <VStack spacing="4">
          <Spinner size="xl" color="blue.500" />
          <Text color="white" fontSize="lg">Konferansa bağlanılıyor...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="gray.900"
      zIndex="9999"
    >
      {/* Header */}
      <HStack
        px="4"
        py="2"
        bg="gray.800"
        justifyContent="space-between"
        borderBottom="1px solid"
        borderColor="gray.700"
      >
        <HStack spacing="3">
          <Box w="3" h="3" borderRadius="full" bg={isConnected ? 'green.500' : 'red.500'} />
          <Text color="white" fontWeight="bold">{title || 'Video Konferans'}</Text>
          <Badge colorScheme="blue">{allParticipants.length} katılımcı</Badge>
        </HStack>
        <HStack spacing="2">
          <Tooltip label="Katılımcılar">
            <IconButton
              icon={<FiUsers />}
              variant={showParticipants ? 'solid' : 'ghost'}
              colorScheme={showParticipants ? 'blue' : 'whiteAlpha'}
              onClick={() => setShowParticipants(!showParticipants)}
              aria-label="Katılımcılar"
            />
          </Tooltip>
          <Tooltip label="Sohbet">
            <IconButton
              icon={<FiMessageSquare />}
              variant={showChat ? 'solid' : 'ghost'}
              colorScheme={showChat ? 'blue' : 'whiteAlpha'}
              onClick={() => setShowChat(!showChat)}
              aria-label="Sohbet"
            />
          </Tooltip>
          <Tooltip label="Anketler">
            <IconButton
              icon={<span style={{fontSize: '18px'}}>📊</span>}
              variant={showPollPanel ? 'solid' : 'ghost'}
              colorScheme={showPollPanel ? 'purple' : 'whiteAlpha'}
              onClick={() => setShowPollPanel(!showPollPanel)}
              aria-label="Anketler"
              position="relative"
            >
              {polls.filter(p => p.isActive).length > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                >
                  {polls.filter(p => p.isActive).length}
                </Badge>
              )}
            </IconButton>
          </Tooltip>
        </HStack>
      </HStack>

      {/* Main content */}
      <Flex h="calc(100vh - 120px)">
        {/* Video grid */}
        <Box flex="1" p="4" overflowY="auto" position="relative">
          {/* Floating Reactions */}
          {floatingReactions.map((reaction) => (
            <Box
              key={reaction.id}
              position="absolute"
              bottom="20%"
              left="50%"
              transform="translateX(-50%)"
              zIndex="100"
              animation="floatUp 3s ease-out forwards"
              sx={{
                '@keyframes floatUp': {
                  '0%': { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' },
                  '100%': { opacity: 0, transform: 'translateX(-50%) translateY(-200px) scale(1.5)' },
                },
              }}
            >
              <VStack spacing="1">
                <Text fontSize="4xl">{reaction.emoji}</Text>
                <Badge bg="blackAlpha.700" color="white" borderRadius="full" px="2">
                  {reaction.userName}
                </Badge>
              </VStack>
            </Box>
          ))}
          <Grid
            templateColumns={`repeat(${Math.min(allParticipants.length, 3)}, 1fr)`}
            gap="4"
            h="100%"
          >
            {allParticipants.map((participant, idx) => (
              <GridItem key={participant.odaId || idx} role="group">
                <VideoParticipant
                  participant={participant}
                  isLocal={participant.odaId === currentUser?.id}
                  isSpeaking={false}
                  isFullscreen={fullscreenUser === participant.odaId}
                  onFullscreen={setFullscreenUser}
                />
              </GridItem>
            ))}
          </Grid>
        </Box>

        {/* Side panels */}
        {(showChat || showParticipants || showPollPanel) && (
          <Box
            w="350px"
            bg="gray.800"
            borderLeft="1px solid"
            borderColor="gray.700"
          >
            {showChat && (
              <ChatPanel
                messages={messages}
                onSend={sendMessage}
                onSendFile={sendFile}
                currentUserId={currentUser?.id}
                typingUsers={typingUsers}
                replyingTo={replyingTo}
                onReply={setReplyingTo}
                onCancelReply={() => setReplyingTo(null)}
                onStartTyping={startTyping}
                onStopTyping={stopTyping}
                onAddReaction={addReaction}
                isUploading={isUploading}
              />
            )}
            {showParticipants && !showChat && !showPollPanel && (
              <VStack p="4" align="stretch" spacing="2">
                <Text color="white" fontWeight="bold" mb="2">Katılımcılar</Text>
                {allParticipants.map((p, idx) => (
                  <HStack key={idx} p="2" bg="gray.700" borderRadius="md">
                    <Avatar size="sm" name={p.userName} src={p.userAvatar} />
                    <Text color="white" flex="1">{p.userName}</Text>
                    {!p.audioEnabled && <FiMicOff color="#EF4444" />}
                    {!p.videoEnabled && <FiVideoOff color="#EF4444" />}
                    {p.handRaised && <span>✋</span>}
                  </HStack>
                ))}
              </VStack>
            )}
            {showPollPanel && (
              <VStack p="4" align="stretch" spacing="3" h="100%" overflowY="auto">
                <HStack justify="space-between">
                  <Text color="white" fontWeight="bold">📊 Anketler</Text>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    leftIcon={<span>+</span>}
                    onClick={() => setShowCreatePoll(true)}
                  >
                    Oluştur
                  </Button>
                </HStack>
                
                {/* Create Poll Form */}
                {showCreatePoll && (
                  <Box bg="gray.700" p="3" borderRadius="md">
                    <VStack spacing="2" align="stretch">
                      <Input
                        placeholder="Soru..."
                        value={newPollQuestion}
                        onChange={(e) => setNewPollQuestion(e.target.value)}
                        bg="gray.600"
                        color="white"
                        _placeholder={{ color: 'gray.400' }}
                      />
                      {newPollOptions.map((opt, idx) => (
                        <HStack key={idx}>
                          <Input
                            placeholder={`Seçenek ${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...newPollOptions];
                              newOpts[idx] = e.target.value;
                              setNewPollOptions(newOpts);
                            }}
                            bg="gray.600"
                            color="white"
                            _placeholder={{ color: 'gray.400' }}
                          />
                          {newPollOptions.length > 2 && (
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => setNewPollOptions(newPollOptions.filter((_, i) => i !== idx))}
                            />
                          )}
                        </HStack>
                      ))}
                      {newPollOptions.length < 6 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="gray"
                          onClick={() => setNewPollOptions([...newPollOptions, ''])}
                        >
                          + Seçenek Ekle
                        </Button>
                      )}
                      <HStack>
                        <Button size="sm" colorScheme="purple" onClick={createPoll}>
                          Anketi Gönder
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowCreatePoll(false)}>
                          İptal
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                )}
                
                {/* Poll List */}
                {polls.length === 0 ? (
                  <Text color="gray.400" textAlign="center" py="4">
                    Henüz anket yok
                  </Text>
                ) : (
                  polls.map((poll) => {
                    const hasVoted = poll.votes?.some(v => v.odaId === currentUser?.id);
                    const myVote = poll.votes?.find(v => v.odaId === currentUser?.id);
                    const totalVotes = poll.totalVotes || poll.votes?.length || 0;
                    
                    return (
                      <Box
                        key={poll.id}
                        bg={poll.isActive ? 'purple.900' : 'gray.700'}
                        p="3"
                        borderRadius="md"
                        border="1px solid"
                        borderColor={poll.isActive ? 'purple.500' : 'gray.600'}
                      >
                        <HStack justify="space-between" mb="2">
                          <Text color="white" fontWeight="600" fontSize="sm">
                            {poll.question}
                          </Text>
                          <Badge colorScheme={poll.isActive ? 'green' : 'gray'}>
                            {poll.isActive ? 'Aktif' : 'Kapandı'}
                          </Badge>
                        </HStack>
                        
                        <VStack spacing="1" align="stretch">
                          {poll.options.map((option, idx) => {
                            const percentage = totalVotes > 0 
                              ? Math.round((option.voteCount / totalVotes) * 100) 
                              : 0;
                            const isSelected = myVote?.optionIndex === idx;
                            
                            return (
                              <Box
                                key={idx}
                                position="relative"
                                bg={isSelected ? 'purple.600' : 'gray.600'}
                                p="3"
                                borderRadius="md"
                                cursor={poll.isActive && !hasVoted ? 'pointer' : 'default'}
                                onClick={() => poll.isActive && !hasVoted && votePoll(poll.id, idx)}
                                _hover={poll.isActive && !hasVoted ? { bg: 'purple.700' } : {}}
                                overflow="hidden"
                              >
                                {(hasVoted || !poll.isActive) && (
                                  <Box
                                    position="absolute"
                                    left="0"
                                    top="0"
                                    bottom="0"
                                    width={`${percentage}%`}
                                    bg={isSelected ? 'purple.400' : 'purple.500'}
                                    opacity="0.4"
                                    transition="width 0.5s ease"
                                  />
                                )}
                                <VStack position="relative" align="stretch" spacing="1">
                                  <HStack justify="space-between">
                                    <HStack spacing="2">
                                      {isSelected && <span style={{color: '#4ade80'}}>✓</span>}
                                      <Text color="white" fontSize="sm" fontWeight={isSelected ? '600' : '400'}>
                                        {option.text}
                                      </Text>
                                    </HStack>
                                    {(hasVoted || !poll.isActive) && (
                                      <Badge
                                        colorScheme="purple"
                                        fontSize="sm"
                                        fontWeight="bold"
                                        px="2"
                                      >
                                        {percentage}%
                                      </Badge>
                                    )}
                                  </HStack>
                                  {(hasVoted || !poll.isActive) && (
                                    <Text color="gray.300" fontSize="xs">
                                      {option.voteCount || 0} oy
                                    </Text>
                                  )}
                                </VStack>
                              </Box>
                            );
                          })}
                        </VStack>
                        
                        <HStack mt="2" justify="space-between">
                          <Text color="gray.400" fontSize="xs">
                            {totalVotes} oy
                          </Text>
                          {poll.isActive && poll.createdBy?.odaId === currentUser?.id && (
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => closePoll(poll.id)}
                            >
                              Kapat
                            </Button>
                          )}
                        </HStack>
                      </Box>
                    );
                  })
                )}
              </VStack>
            )}
          </Box>
        )}
      </Flex>

      {/* Controls */}
      <HStack
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        py="4"
        justifyContent="center"
        bg="gray.800"
        borderTop="1px solid"
        borderColor="gray.700"
        spacing="4"
      >
        <Tooltip label={audioEnabled ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}>
          <IconButton
            icon={audioEnabled ? <FiMic /> : <FiMicOff />}
            size="lg"
            borderRadius="full"
            colorScheme={audioEnabled ? 'gray' : 'red'}
            onClick={toggleAudio}
            aria-label="Mikrofon"
          />
        </Tooltip>

        <Tooltip label={videoEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}>
          <IconButton
            icon={videoEnabled ? <FiVideo /> : <FiVideoOff />}
            size="lg"
            borderRadius="full"
            colorScheme={videoEnabled ? 'gray' : 'red'}
            onClick={toggleVideo}
            aria-label="Kamera"
          />
        </Tooltip>

        <Tooltip label={handRaised ? 'El İndir' : 'El Kaldır'}>
          <IconButton
            icon={<span>✋</span>}
            size="lg"
            borderRadius="full"
            colorScheme={handRaised ? 'yellow' : 'gray'}
            onClick={toggleHandRaise}
            aria-label="El Kaldır"
          />
        </Tooltip>

        <Box position="relative">
          <Tooltip label="Tepki Gönder">
            <IconButton
              icon={<span>😀</span>}
              size="lg"
              borderRadius="full"
              colorScheme={showReactionPicker ? 'blue' : 'gray'}
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              aria-label="Tepki"
            />
          </Tooltip>
          
          {/* Reaction Picker */}
          {showReactionPicker && (
            <HStack
              position="absolute"
              bottom="60px"
              left="50%"
              transform="translateX(-50%)"
              bg="gray.800"
              p="3"
              borderRadius="full"
              boxShadow="dark-lg"
              spacing="2"
              zIndex="1000"
            >
              {['👍', '❤️', '😂', '👏', '🎉', '🔥'].map((emoji) => (
                <Box
                  key={emoji}
                  cursor="pointer"
                  fontSize="2xl"
                  onClick={() => sendReaction(emoji)}
                  _hover={{ transform: 'scale(1.3)' }}
                  transition="transform 0.1s"
                >
                  {emoji}
                </Box>
              ))}
            </HStack>
          )}
        </Box>

        <Tooltip label="Konferanstan Ayrıl">
          <IconButton
            icon={<FiPhoneOff />}
            size="lg"
            borderRadius="full"
            colorScheme="red"
            onClick={leaveConference}
            aria-label="Ayrıl"
          />
        </Tooltip>
      </HStack>
    </Box>
  );
};

export default VideoConference;

