import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Badge,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Avatar,
  AvatarGroup,
  Skeleton,
  SkeletonCircle,
  useColorModeValue,
  HStack,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  FiVideo, 
  FiSearch, 
  FiRefreshCw, 
  FiUsers, 
  FiClock, 
  FiCalendar,
  FiPlay,
  FiMoreVertical,
  FiPlus,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { Page } from '../../../components';
import { api } from '../../../api';
import { routes } from '../../../config/routes';
import { format, isAfter, isBefore, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const Conferences = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, live, upcoming, past
  const [page, setPage] = useState(1);
  const limit = 20;

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const liveBg = useColorModeValue('red.50', 'red.900');
  const liveBadgeBg = useColorModeValue('red.500', 'red.400');
  const upcomingBg = useColorModeValue('orange.50', 'orange.900');
  const upcomingBadgeBg = useColorModeValue('orange.500', 'orange.400');
  const emptyStateBg = useColorModeValue('gray.100', 'gray.700');

  // Fetch conferences
  const { data: conferencesData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['conferences', 'all', page, limit],
    queryFn: () => api.getActiveConferences({ limit: 100, page: 1 }).then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Helper to extract ID string from various formats
  const extractIdString = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      if (obj._id) {
        if (typeof obj._id === 'string') return obj._id;
        if (obj._id.toString) return obj._id.toString();
      }
      if (obj.id) {
        if (typeof obj.id === 'string') return obj.id;
        if (obj.id.toString) return obj.id.toString();
      }
      if (obj.toString && obj.toString() !== '[object Object]') {
        return obj.toString();
      }
    }
    return null;
  };

  // Process and filter conferences
  const { conferences, counts } = useMemo(() => {
    const results = conferencesData?.results || [];
    const now = new Date();

    const processed = results.map(conf => {
      const startTime = new Date(conf.startTime);
      const endTime = conf.scheduledEndTime ? new Date(conf.scheduledEndTime) : null;
      const endedAt = conf.endedAt ? new Date(conf.endedAt) : null;
      
      // Determine conference status with multiple checks
      let status = 'unknown';
      
      // Calculate time differences
      const hoursSinceStart = differenceInHours(now, startTime);
      const minutesSinceStart = differenceInMinutes(now, startTime);
      
      // Default duration: 60 minutes if scheduledEndTime not set
      const DEFAULT_DURATION_MINUTES = 60;
      const SAFETY_FALLBACK_HOURS = 24;
      
      // Calculate effective end time
      // If scheduledEndTime exists, use it; otherwise use startTime + default duration
      let effectiveEndTime = endTime;
      if (!effectiveEndTime && startTime) {
        effectiveEndTime = new Date(startTime.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
      }
      
      // Check if conference has ended based on multiple criteria:
      // 1. endedAt field exists (explicitly ended by host)
      // 2. isActive is explicitly false (backend marked as inactive)
      // 3. scheduledEndTime/effectiveEndTime has passed
      // 4. Started more than 24 hours ago (safety fallback)
      const hasEndedExplicitly = endedAt !== null || conf.isActive === false;
      const hasEndedByTime = effectiveEndTime && isBefore(effectiveEndTime, now);
      const hasEndedBySafety = hoursSinceStart > SAFETY_FALLBACK_HOURS;
      const hasEnded = hasEndedExplicitly || hasEndedByTime || hasEndedBySafety;
      
      // Check if conference is scheduled for the future
      const isFuture = isAfter(startTime, now);
      const isScheduledConference = conf.isScheduled === true;
      
      // Determine final status
      if (hasEnded) {
        // Conference is finished (any of the end conditions met)
        status = 'past';
      } else if (isFuture) {
        // Conference hasn't started yet (startTime is in the future)
        status = 'upcoming';
      } else if (conf.isActive === true && !hasEnded) {
        // Conference is currently active
        status = 'live';
      } else if (!conf.isActive && !isFuture && !hasEnded) {
        // Edge case: Not active, not in future, but also hasn't officially ended
        // Treat as past to be safe
        status = 'past';
      } else {
        // Default fallback
        status = 'past';
      }

      // Pre-extract channelId as string for navigation
      const channelIdString = extractIdString(conf.channelId);

      // Calculate remaining time for live conferences
      let remainingMinutes = null;
      if (status === 'live' && effectiveEndTime) {
        remainingMinutes = Math.max(0, differenceInMinutes(effectiveEndTime, now));
      }

      return {
        ...conf,
        id: conf._id || conf.id,
        channelIdString, // Pre-computed string ID for navigation
        status,
        startTime,
        endTime,
        effectiveEndTime,
        remainingMinutes,
        activeParticipants: conf.participants?.filter(p => !p.leftAt)?.length || 0,
      };
    });

    // Filter by search
    let filtered = processed;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title?.toLowerCase().includes(query) ||
        c.host?.name?.toLowerCase().includes(query) ||
        c.channelId?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(c => c.status === filter);
    }

    // Sort: live first, then upcoming by start time, then past
    filtered.sort((a, b) => {
      const statusOrder = { live: 0, upcoming: 1, past: 2, unknown: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.startTime - a.startTime;
    });

    return {
      conferences: filtered,
      counts: {
        all: processed.length,
        live: processed.filter(c => c.status === 'live').length,
        upcoming: processed.filter(c => c.status === 'upcoming').length,
        past: processed.filter(c => c.status === 'past').length,
      },
    };
  }, [conferencesData, searchQuery, filter]);

  // Helper to extract channelId as string
  const getChannelIdString = (channelId) => {
    if (!channelId) return null;
    
    // If it's already a string (24 char hex = MongoDB ObjectId)
    if (typeof channelId === 'string') {
      return channelId;
    }
    
    // If it's an object, try various ways to get the ID
    if (typeof channelId === 'object') {
      // Try _id first (populated MongoDB document)
      if (channelId._id) {
        // _id might be ObjectId or string
        if (typeof channelId._id === 'string') return channelId._id;
        if (channelId._id.toString) return channelId._id.toString();
        return String(channelId._id);
      }
      // Try id
      if (channelId.id) {
        if (typeof channelId.id === 'string') return channelId.id;
        if (channelId.id.toString) return channelId.id.toString();
        return String(channelId.id);
      }
      // If object has toString method (like ObjectId)
      if (channelId.toString && channelId.toString() !== '[object Object]') {
        return channelId.toString();
      }
    }
    
    // Last resort - should not reach here ideally
    console.warn('Unable to extract channelId:', channelId);
    return null;
  };

  const handleJoinConference = (conference) => {
    // Comprehensive check: if conference has ended
    const now = new Date();
    const endTime = conference.effectiveEndTime || conference.endTime;
    const startTime = conference.startTime;
    const hoursSinceStart = differenceInHours(now, startTime);
    
    // Use same criteria as status determination
    const hasEndedExplicitly = conference.endedAt || conference.isActive === false;
    const hasEndedByTime = endTime && isBefore(endTime, now);
    const hasEndedBySafety = hoursSinceStart > 24;  // Safety: 24+ hours old
    const hasEnded = conference.status === 'past' || hasEndedExplicitly || hasEndedByTime || hasEndedBySafety;
    
    if (hasEnded) {
      toast({
        title: 'Konferans Sona Erdi',
        description: 'Bu konferans artık aktif değil ve katılamazsınız.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (conference.status === 'upcoming') {
      toast({
        title: 'Henüz Başlamadı',
        description: `Bu konferans ${format(conference.startTime, 'dd MMM yyyy HH:mm', { locale: tr })} tarihinde başlayacak.`,
        status: 'info',
        duration: 3000,
      });
      return;
    }
    
    // Extra safety check: only allow joining if truly active
    if (!conference.isActive) {
      toast({
        title: 'Konferans Aktif Değil',
        description: 'Bu konferansa şu anda katılamazsınız.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Navigate to channel chat with conference params
    // Use pre-computed channelIdString or try to extract it
    const channelId = conference.channelIdString || getChannelIdString(conference.channelId);
    
    // Validate channelId is a valid MongoDB ObjectId format (24 hex chars)
    const isValidId = channelId && typeof channelId === 'string' && /^[a-fA-F0-9]{24}$/.test(channelId);
    
    if (isValidId) {
      navigate(`${routes.channelChat.getPath(channelId)}?conference=active&roomId=${conference.roomId}`);
    } else {
      console.error('Invalid channelId:', channelId, 'from conference:', conference);
      toast({
        title: 'Hata',
        description: 'Kanal bilgisi bulunamadı veya geçersiz.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getTimeDisplay = (conference) => {
    const now = new Date();
    const startTime = conference.startTime;
    const effectiveEndTime = conference.effectiveEndTime;

    if (conference.status === 'live') {
      // Show both elapsed and remaining time
      const elapsedMins = differenceInMinutes(now, startTime);
      const remainingMins = conference.remainingMinutes;
      
      // Format elapsed time
      let elapsedText = '';
      if (elapsedMins < 1) {
        elapsedText = 'Az önce başladı';
      } else if (elapsedMins < 60) {
        elapsedText = `${elapsedMins} dk önce başladı`;
      } else {
        const hours = Math.floor(elapsedMins / 60);
        const mins = elapsedMins % 60;
        elapsedText = mins > 0 
          ? `${hours} saat ${mins} dk önce başladı`
          : `${hours} saat önce başladı`;
      }
      
      // Add remaining time if available
      if (remainingMins !== null && remainingMins > 0) {
        if (remainingMins < 60) {
          return `${elapsedText} • ${remainingMins} dk kaldı`;
        } else {
          const remainingHours = Math.floor(remainingMins / 60);
          const remainingMinsMod = remainingMins % 60;
          return remainingMinsMod > 0
            ? `${elapsedText} • ${remainingHours}s ${remainingMinsMod}dk kaldı`
            : `${elapsedText} • ${remainingHours} saat kaldı`;
        }
      }
      
      return elapsedText;
    }

    if (conference.status === 'upcoming') {
      const totalMins = differenceInMinutes(startTime, now);
      const days = differenceInDays(startTime, now);
      const hours = differenceInHours(startTime, now) % 24;
      const mins = totalMins % 60;

      if (days > 0) return hours > 0 ? `${days} gün ${hours} saat sonra` : `${days} gün sonra`;
      if (hours > 0) return mins > 0 ? `${hours} saat ${mins} dk sonra` : `${hours} saat sonra`;
      if (mins > 0) return `${mins} dk sonra`;
      return 'Birazdan başlayacak';
    }

    // Past conferences - show when they ended
    if (conference.status === 'past') {
      if (conference.endedAt) {
        return `${format(new Date(conference.endedAt), 'dd MMM HH:mm', { locale: tr })} sona erdi`;
      }
      if (effectiveEndTime) {
        return `${format(effectiveEndTime, 'dd MMM HH:mm', { locale: tr })} sona erdi`;
      }
      return `${format(startTime, 'dd MMM yyyy, HH:mm', { locale: tr })} başladı`;
    }

    return format(startTime, 'dd MMM yyyy, HH:mm', { locale: tr });
  };

  const ConferenceCard = ({ conference }) => (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      p={5}
      transition="all 0.2s"
      _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
      cursor="pointer"
      onClick={() => handleJoinConference(conference)}
      position="relative"
      opacity={conference.status === 'past' ? 0.7 : 1}
    >
      {/* Status Badge */}
      <Flex justify="space-between" align="center" mb={3}>
        <HStack spacing={2}>
          {conference.status === 'live' ? (
            <Badge 
              bg={liveBadgeBg} 
              color="white" 
              px={2} 
              py={1} 
              borderRadius="md"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Box w={2} h={2} bg="white" borderRadius="full" animation="pulse 1.5s infinite" />
              CANLI
            </Badge>
          ) : conference.status === 'upcoming' ? (
            <Badge 
              bg={upcomingBadgeBg} 
              color="white" 
              px={2} 
              py={1} 
              borderRadius="md"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <FiCalendar size={12} />
              Planlandı
            </Badge>
          ) : (
            <Badge colorScheme="gray" px={2} py={1} borderRadius="md">
              <Flex align="center" gap={1}>
                <FiCheckCircle size={12} />
                Sona Erdi
              </Flex>
            </Badge>
          )}

          {/* Remaining time warning for live conferences */}
          {conference.status === 'live' && conference.remainingMinutes !== null && conference.remainingMinutes <= 15 && (
            <Badge 
              colorScheme="orange" 
              variant="subtle"
              px={2}
              py={1}
              borderRadius="md"
            >
              <Flex align="center" gap={1}>
                <FiClock size={12} />
                {conference.remainingMinutes <= 0 ? 'Süre doldu' : `${conference.remainingMinutes} dk kaldı`}
              </Flex>
            </Badge>
          )}
        </HStack>

        {conference.isRecording && (
          <Badge colorScheme="red" variant="subtle">
            <Flex align="center" gap={1}>
              <Box w={2} h={2} bg="red.500" borderRadius="full" />
              REC
            </Flex>
          </Badge>
        )}
      </Flex>

      {/* Title */}
      <Heading size="sm" mb={2} noOfLines={2}>
        {conference.title || 'Video Konferans'}
      </Heading>

      {/* Channel Info */}
      {(conference.channelId?.name || (typeof conference.channelId === 'object' && conference.channelId?.name)) && (
        <Text fontSize="xs" color={textSecondary} mb={3}>
          📢 {conference.channelId?.name}
        </Text>
      )}

      {/* Host & Time Info */}
      <Flex align="center" justify="space-between" mb={4}>
        <HStack spacing={2}>
          <Avatar 
            size="sm" 
            name={conference.host?.name || 'Host'} 
            src={conference.host?.avatar}
          />
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="medium">
              {conference.host?.name || 'Host'}
            </Text>
            <Text fontSize="xs" color={textSecondary}>
              {getTimeDisplay(conference)}
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={1} color={textSecondary}>
          <FiUsers size={14} />
          <Text fontSize="sm">
            {conference.status === 'live' 
              ? `${conference.activeParticipants} katılımcı`
              : `${conference.maxParticipants || 50} kişilik`
            }
          </Text>
        </HStack>
      </Flex>

      {/* Participant Avatars */}
      {conference.status === 'live' && conference.activeParticipants > 0 && (
        <AvatarGroup size="xs" max={5} mb={4}>
          {conference.participants
            ?.filter(p => !p.leftAt)
            ?.slice(0, 5)
            ?.map((p, i) => (
              <Avatar 
                key={p.user?.id || i} 
                name={p.user?.name || '?'} 
                src={p.user?.avatar}
              />
            ))}
        </AvatarGroup>
      )}

      {/* Action Button */}
      <Button
        size="sm"
        width="100%"
        colorScheme={conference.status === 'live' ? 'green' : conference.status === 'upcoming' ? 'orange' : 'gray'}
        variant={conference.status === 'past' ? 'outline' : 'solid'}
        leftIcon={conference.status === 'live' ? <FiPlay /> : <FiClock />}
        isDisabled={conference.status === 'past'}
      >
        {conference.status === 'live' ? 'Şimdi Katıl' : conference.status === 'upcoming' ? 'Hatırlat' : 'Sona Erdi'}
      </Button>
    </Box>
  );

  const SkeletonCard = () => (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      p={5}
    >
      <Skeleton height="24px" width="80px" mb={3} borderRadius="md" />
      <Skeleton height="20px" width="100%" mb={2} />
      <Skeleton height="16px" width="60%" mb={4} />
      <Flex align="center" justify="space-between" mb={4}>
        <HStack spacing={2}>
          <SkeletonCircle size="8" />
          <VStack spacing={1} align="start">
            <Skeleton height="14px" width="80px" />
            <Skeleton height="12px" width="60px" />
          </VStack>
        </HStack>
        <Skeleton height="14px" width="60px" />
      </Flex>
      <Skeleton height="32px" width="100%" borderRadius="md" />
    </Box>
  );

  const filterTabs = [
    { key: 'all', label: 'Tümü', count: counts.all },
    { key: 'live', label: 'Canlı', count: counts.live, isLive: true },
    { key: 'upcoming', label: 'Yaklaşan', count: counts.upcoming },
    { key: 'past', label: 'Geçmiş', count: counts.past },
  ];

  return (
    <Page 
      title="Video Konferanslar" 
      subtitle={`${counts.all} konferans${counts.live > 0 ? ` • ${counts.live} canlı` : ''}`}
    >
      {/* Header Actions */}
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        {/* Search */}
        <InputGroup maxW={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Konferans ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            borderRadius="lg"
          />
        </InputGroup>

        {/* Actions */}
        <HStack spacing={2}>
          <Tooltip label="Yenile">
            <IconButton
              icon={<FiRefreshCw />}
              aria-label="Refresh"
              onClick={() => refetch()}
              isLoading={isFetching}
              variant="outline"
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Filter Tabs */}
      <Tabs 
        variant="soft-rounded" 
        colorScheme="blue" 
        mb={6}
        index={filterTabs.findIndex(t => t.key === filter)}
        onChange={(index) => setFilter(filterTabs[index].key)}
      >
        <TabList gap={2} flexWrap="wrap">
          {filterTabs.map((tab) => (
            <Tab
              key={tab.key}
              px={4}
              py={2}
              borderRadius="full"
              _selected={{ bg: 'blue.500', color: 'white' }}
            >
              <HStack spacing={2}>
                {tab.isLive && tab.count > 0 && (
                  <Box 
                    w={2} 
                    h={2} 
                    bg="red.500" 
                    borderRadius="full" 
                    animation="pulse 1.5s infinite"
                  />
                )}
                <Text>{tab.label}</Text>
                {tab.count > 0 && (
                  <Badge 
                    borderRadius="full" 
                    px={2}
                    bg={filter === tab.key ? 'whiteAlpha.300' : 'gray.200'}
                    color={filter === tab.key ? 'white' : 'gray.600'}
                  >
                    {tab.count}
                  </Badge>
                )}
              </HStack>
            </Tab>
          ))}
        </TabList>
      </Tabs>

      {/* Conference Grid */}
      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </SimpleGrid>
      ) : conferences.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={16}
          px={4}
        >
          <Box
            p={4}
            borderRadius="full"
            bg={emptyStateBg}
            mb={4}
          >
            <FiVideo size={48} color="gray" />
          </Box>
          <Heading size="md" mb={2} textAlign="center">
            {filter === 'live'
              ? 'Şu an canlı konferans yok'
              : filter === 'upcoming'
              ? 'Yaklaşan konferans yok'
              : filter === 'past'
              ? 'Geçmiş konferans yok'
              : 'Henüz konferans yok'}
          </Heading>
          <Text color={textSecondary} textAlign="center" mb={6}>
            {filter === 'all'
              ? 'Kanallardan video konferans başlatıldığında burada görünecek.'
              : 'Farklı bir filtre deneyin.'}
          </Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {conferences.map((conference) => (
            <ConferenceCard key={conference.id} conference={conference} />
          ))}
        </SimpleGrid>
      )}

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Page>
  );
};

export default Conferences;
