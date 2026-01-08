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
import moment from 'moment';
import 'moment/locale/tr';

moment.locale('tr');

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

  // Fetch conferences
  const { data: conferencesData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['conferences', 'all', page, limit],
    queryFn: () => api.getActiveConferences({ limit: 100, page: 1 }).then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process and filter conferences
  const { conferences, counts } = useMemo(() => {
    const results = conferencesData?.results || [];
    const now = moment();

    const processed = results.map(conf => {
      const startTime = moment(conf.startTime);
      const endTime = conf.scheduledEndTime ? moment(conf.scheduledEndTime) : null;
      
      let status = 'unknown';
      if (conf.isActive && (!endTime || endTime.isAfter(now))) {
        status = 'live';
      } else if (startTime.isAfter(now)) {
        status = 'upcoming';
      } else {
        status = 'past';
      }

      return {
        ...conf,
        id: conf._id || conf.id,
        status,
        startTime,
        endTime,
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
    // If it's already a string
    if (typeof channelId === 'string') return channelId;
    // If it's an object with _id
    if (channelId._id) return typeof channelId._id === 'string' ? channelId._id : String(channelId._id);
    // If it's an object with id
    if (channelId.id) return typeof channelId.id === 'string' ? channelId.id : String(channelId.id);
    // Try to convert to string
    return String(channelId);
  };

  const handleJoinConference = (conference) => {
    if (conference.status === 'past') {
      toast({
        title: 'Konferans Sona Erdi',
        description: 'Bu konferans artık aktif değil.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (conference.status === 'upcoming') {
      toast({
        title: 'Henüz Başlamadı',
        description: `Bu konferans ${conference.startTime.format('DD MMM YYYY HH:mm')} tarihinde başlayacak.`,
        status: 'info',
        duration: 3000,
      });
      return;
    }

    // Navigate to channel chat with conference params
    const channelId = getChannelIdString(conference.channelId);
    if (channelId && channelId !== '[object Object]') {
      navigate(`${routes.channelChat.getPath(channelId)}?conference=active&roomId=${conference.roomId}`);
    } else {
      toast({
        title: 'Hata',
        description: 'Kanal bilgisi bulunamadı.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getTimeDisplay = (conference) => {
    const now = moment();
    const startTime = conference.startTime;
    const endTime = conference.endTime;

    if (conference.status === 'live') {
      const duration = moment.duration(now.diff(startTime));
      const mins = Math.floor(duration.asMinutes());
      if (mins < 1) return 'Az önce başladı';
      if (mins < 60) return `${mins} dk önce başladı`;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 
        ? `${hours} saat ${remainingMins} dk önce başladı`
        : `${hours} saat önce başladı`;
    }

    if (conference.status === 'upcoming') {
      const duration = moment.duration(startTime.diff(now));
      const days = Math.floor(duration.asDays());
      const hours = Math.floor(duration.asHours() % 24);
      const mins = Math.floor(duration.asMinutes() % 60);

      if (days > 0) return hours > 0 ? `${days} gün ${hours} saat sonra` : `${days} gün sonra`;
      if (hours > 0) return mins > 0 ? `${hours} saat ${mins} dk sonra` : `${hours} saat sonra`;
      if (mins > 0) return `${mins} dk sonra`;
      return 'Birazdan başlayacak';
    }

    return startTime.format('DD MMM YYYY, HH:mm');
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
            bg={useColorModeValue('gray.100', 'gray.700')}
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
