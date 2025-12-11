import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Icon,
  Select,
} from '@chakra-ui/react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {FiSearch, FiMessageCircle, FiTrendingUp, FiStar, FiFilter} from 'react-icons/fi';
import {getCombinedLogoUrl} from '../../../utils/image';
import {formatDistanceToNow} from 'date-fns';
import {tr} from 'date-fns/locale';

const ChannelItem = ({channel, onClick}) => {
  const lastMessageTime = channel.lastMessageAt 
    ? formatDistanceToNow(new Date(channel.lastMessageAt), {addSuffix: true, locale: tr})
    : '';

  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      p="4"
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{
        bg: 'gray.50',
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }}
      borderLeft="4px solid"
      borderLeftColor={channel.type === 'vip' ? 'purple.400' : channel.type === 'market' ? 'green.400' : 'blue.400'}
    >
      <HStack spacing="4">
        <Avatar
          size="md"
          name={channel.name}
          src={getCombinedLogoUrl(channel.thumbnail)}
          bg={channel.type === 'vip' ? 'purple.100' : channel.type === 'market' ? 'green.100' : 'blue.100'}
        />
        <Box flex="1" minW="0">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing="0" flex="1" minW="0">
              <HStack>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {channel.name}
                </Text>
                {channel.type === 'vip' && (
                  <Badge colorScheme="purple" size="sm">VIP</Badge>
                )}
                {channel.type === 'market' && (
                  <Badge colorScheme="green" size="sm">Market</Badge>
                )}
              </HStack>
              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                {channel.lastMessage || 'Henüz mesaj yok'}
              </Text>
            </VStack>
            <VStack align="end" spacing="1">
              <Text fontSize="xs" color="gray.400">
                {lastMessageTime}
              </Text>
              {channel.messageCount > 0 && (
                <Badge colorScheme="blue" borderRadius="full" px="2">
                  {channel.messageCount}
                </Badge>
              )}
            </VStack>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

const ChannelList = ({channels, isLoading, onChannelClick, emptyMessage}) => {
  if (isLoading) {
    return (
      <Box textAlign="center" py="10">
        <Spinner size="lg" color="blue.500" />
        <Text mt="4" color="gray.500">Kanallar yükleniyor...</Text>
      </Box>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <Box textAlign="center" py="10">
        <Icon as={FiMessageCircle} boxSize="12" color="gray.300" />
        <Text mt="4" color="gray.500">{emptyMessage || 'Kanal bulunamadı'}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing="3" align="stretch">
      {channels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          onClick={() => onChannelClick(channel)}
        />
      ))}
    </VStack>
  );
};

const SORT_OPTIONS = {
  MOST_MESSAGES: 'most_messages',
  RECENT_MESSAGE: 'recent_message',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

const Channels = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.MOST_MESSAGES);

  // Fetch all channels
  const {data: allChannelsData, isLoading: isLoadingAll} = useQuery({
    queryKey: ['all-channels-messaging'],
    queryFn: () => api.getAllChannels({limit: 1000}),
    select: (res) => res.data?.results || [],
  });

  // Fetch VIP channels
  const {data: vipChannelsData, isLoading: isLoadingVip} = useQuery({
    queryKey: ['vip-channels-messaging'],
    queryFn: () => api.getVipChannels({limit: 1000}),
    select: (res) => res.data?.results || [],
  });

  const handleChannelClick = (channel) => {
    navigate(`/dashboard/messaging/channels/${channel.id}`);
  };

  // Filter and sort channels based on search query and selected sort option
  const filterAndSortChannels = (channels) => {
    let filtered = channels || [];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort based on selected option
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case SORT_OPTIONS.MOST_MESSAGES:
          // Sort by message count (highest first)
          const countDiff = (b.messageCount || 0) - (a.messageCount || 0);
          if (countDiff !== 0) return countDiff;
          // Tie-breaker: most recent message
          const dateA1 = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB1 = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB1 - dateA1;
          
        case SORT_OPTIONS.RECENT_MESSAGE:
          // Sort by last message date (most recent first)
          const dateA2 = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB2 = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB2 - dateA2;
          
        case SORT_OPTIONS.NAME_ASC:
          // Sort by name A-Z
          return (a.name || '').localeCompare(b.name || '', 'tr');
          
        case SORT_OPTIONS.NAME_DESC:
          // Sort by name Z-A
          return (b.name || '').localeCompare(a.name || '', 'tr');
          
        default:
          return 0;
      }
    });
  };

  // Separate channels by type and sort by message count
  const marketChannels = filterAndSortChannels(allChannelsData?.filter(c => c.type === 'market'));
  const vipChannels = filterAndSortChannels(vipChannelsData);
  const otherChannels = filterAndSortChannels(allChannelsData?.filter(c => c.type !== 'market' && c.type !== 'vip'));
  const allFiltered = filterAndSortChannels(allChannelsData);

  return (
    <Page>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Kanallar & Mesajlaşma
        </Text>
        <Text color="gray.500" mt="1">
          Kanallara girin ve mesajlaşın.
        </Text>
      </Box>

      {/* Search and Sort */}
      <HStack mb="6" spacing="4" flexWrap="wrap">
        <InputGroup size="lg" flex="1" minW="200px">
          <InputLeftElement>
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Kanal ara..."
            bg="white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <HStack spacing="2" bg="white" borderRadius="lg" px="3" py="2" boxShadow="sm">
          <Icon as={FiFilter} color="gray.500" />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="md"
            border="none"
            bg="transparent"
            fontWeight="500"
            _focus={{ boxShadow: 'none' }}
            minW="180px"
          >
            <option value={SORT_OPTIONS.MOST_MESSAGES}>📊 En Çok Mesaj</option>
            <option value={SORT_OPTIONS.RECENT_MESSAGE}>🕐 En Son Mesaj</option>
            <option value={SORT_OPTIONS.NAME_ASC}>🔤 İsim (A-Z)</option>
            <option value={SORT_OPTIONS.NAME_DESC}>🔤 İsim (Z-A)</option>
          </Select>
        </HStack>
      </HStack>

      {/* Tabs */}
      <Box bg="white" borderRadius="xl" boxShadow="md" p="4">
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb="4" flexWrap="wrap" gap="2">
            <Tab>
              <HStack spacing="2">
                <Icon as={FiMessageCircle} />
                <Text>Tümü ({allFiltered?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiTrendingUp} />
                <Text>Piyasalar ({marketChannels?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing="2">
                <Icon as={FiStar} />
                <Text>VIP ({vipChannels?.length || 0})</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* All Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={allFiltered}
                isLoading={isLoadingAll}
                onChannelClick={handleChannelClick}
                emptyMessage="Kanal bulunamadı"
              />
            </TabPanel>

            {/* Market Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={marketChannels}
                isLoading={isLoadingAll}
                onChannelClick={handleChannelClick}
                emptyMessage="Piyasa kanalı bulunamadı"
              />
            </TabPanel>

            {/* VIP Channels */}
            <TabPanel p="0">
              <ChannelList
                channels={vipChannels}
                isLoading={isLoadingVip}
                onChannelClick={handleChannelClick}
                emptyMessage="VIP kanal bulunamadı"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Page>
  );
};

export default Channels;

