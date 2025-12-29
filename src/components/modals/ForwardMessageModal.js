import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Badge,
  Spinner,
  Icon,
  Box,
  Button,
  useToast
} from '@chakra-ui/react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSearch, FiChevronDown, FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { api } from '../../api'; // Adjust path as needed
import { getCombinedLogoUrl } from '../../utils/image'; // Adjust path as needed

const PAGE_SIZE = 50;

const ChannelItem = ({ channel, onSelect, isSelected }) => {
  const lastMessageTime = channel.lastMessageAt 
    ? formatDistanceToNow(new Date(channel.lastMessageAt), {addSuffix: true, locale: tr})
    : '';

  return (
    <Box
      onClick={() => onSelect(channel)}
      cursor="pointer"
      p="3"
      bg={isSelected ? 'blue.50' : 'white'}
      borderRadius="md"
      border="1px solid"
      borderColor={isSelected ? 'blue.400' : 'gray.100'}
      transition="all 0.2s"
      _hover={{
        bg: 'gray.50',
      }}
    >
      <HStack spacing="3">
        <Avatar
          size="sm"
          name={channel.name}
          src={getCombinedLogoUrl(channel.thumbnail)}
        />
        <Box flex="1" minW="0">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing="0" flex="1" minW="0">
              <HStack>
                <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                  {channel.name}
                </Text>
                {channel.type === 'vip' && (
                  <Badge colorScheme="purple" size="xs">VIP</Badge>
                )}
              </HStack>
            </VStack>
            {isSelected && <Icon as={FiSend} color="blue.500" />}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

const ForwardMessageModal = ({ isOpen, onClose, messageToForward }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch channels
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['channels-for-forward', searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      // Assuming api.getAllChannels supports search query if not it will just return all
      // You might need to implement search endpoint or filter client side if API doesn't support
      const params = { 
        limit: PAGE_SIZE, 
        page: pageParam,
        // search: searchQuery // Add if API supports it
      };
      
      // If we have a search query, let's try to search in all channels endpoint if supported
      // Or we can rely on client side filtering as we do below
      // API doesn't support search param for this endpoint yet, so we filter client side
      /*
      if (searchQuery) {
          params.search = searchQuery;
      }
      */

      const res = await api.getAllChannels(params);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: isOpen, // Only fetch when modal is open
  });

  const channels = data?.pages.flatMap(page => page.channels || page.results || []) || [];
  
  // Filter client-side if API search is not available/reliable for this specific modal use case
  const filteredChannels = (searchQuery 
    ? channels.filter(c => c && c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : channels).filter(c => c && (c.id || c._id)); // Ensure valid channels only

  const handleSend = async () => {
    if (!selectedChannel || !messageToForward) return;

    try {
      setIsSending(true);

      // Prepare message content
      const messageData = {
        text: messageToForward.text,
        image: messageToForward.image,
        video: messageToForward.video,
        audio: messageToForward.audio,
        file: messageToForward.file,
      };

      await api.sendChannelMessage(selectedChannel.id || selectedChannel._id, messageData);

      toast({
        title: 'Mesaj iletildi',
        description: `Mesaj "${selectedChannel.name}" kanalına iletildi.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setSelectedChannel(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Forward error:', error);
      toast({
        title: 'İletme başarısız',
        description: error.message || 'Bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Mesajı İlet</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="6">
          {messageToForward && (
            <Box bg="gray.50" p="3" borderRadius="md" mb="4" borderLeft="3px solid" borderColor="blue.400">
              <Text fontSize="xs" color="gray.500" mb="1">İletilecek Mesaj:</Text>
              <Text fontSize="sm" noOfLines={3}>
                {messageToForward.text || (messageToForward.image ? '📷 Görsel' : '📎 Ek')}
              </Text>
            </Box>
          )}

          <InputGroup mb="4">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Kanal ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <VStack spacing="2" align="stretch" maxH="400px" overflowY="auto">
            {isLoading ? (
              <Box textAlign="center" py="4">
                <Spinner size="sm" />
              </Box>
            ) : filteredChannels.length === 0 ? (
              <Text textAlign="center" color="gray.500" fontSize="sm" py="4">
                Kanal bulunamadı
              </Text>
            ) : (
              <>
                {filteredChannels.map(channel => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannel?.id === channel.id}
                    onSelect={setSelectedChannel}
                  />
                ))}
                
                {hasNextPage && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => fetchNextPage()}
                    isLoading={isFetchingNextPage}
                    w="full"
                  >
                    Daha fazla yükle
                  </Button>
                )}
              </>
            )}
          </VStack>

          <Box mt="4" pt="4" borderTop="1px solid" borderColor="gray.100" display="flex" justifyContent="flex-end">
             <Button mr="3" variant="ghost" onClick={onClose}>İptal</Button>
             <Button 
               colorScheme="blue" 
               onClick={handleSend}
               isDisabled={!selectedChannel}
               isLoading={isSending}
               rightIcon={<FiSend />}
             >
               Gönder
             </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ForwardMessageModal;
