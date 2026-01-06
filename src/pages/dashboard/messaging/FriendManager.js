import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
} from '@chakra-ui/react';
import { FiUserPlus, FiMessageSquare, FiX, FiCheck, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api';

const FriendItem = ({ friend, currentUserId, onMessage, onRemove, isRemoving }) => {
  const otherUser = friend.user1.id === currentUserId ? friend.user2 : friend.user1;
  const isOnline = false; // We don't have real-time online status here yet

  return (
    <HStack
      p="4"
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      justify="space-between"
      align="center"
      _hover={{ bg: 'gray.50' }}
    >
      <HStack spacing="4">
        <Avatar name={otherUser.fullname} src={otherUser.thumbnail} size="md">
          {isOnline && <Avatar.Badge boxSize="1.25em" bg="green.500" />}
        </Avatar>
        <VStack align="start" spacing="0">
          <Text fontWeight="600">{otherUser.fullname}</Text>
          <Text fontSize="sm" color="gray.500">@{otherUser.username || otherUser.email?.split('@')[0] || 'Bilinmiyor'}</Text>
        </VStack>
      </HStack>
      <HStack spacing="2">
        <IconButton
          icon={<FiMessageSquare />}
          aria-label="Mesaj Gönder"
          colorScheme="blue"
          variant="ghost"
          onClick={() => onMessage(otherUser.id)}
        />
        <IconButton
          icon={<FiTrash2 />}
          aria-label="Arkadaşlıktan Çıkar"
          colorScheme="red"
          variant="ghost"
          isLoading={isRemoving}
          onClick={() => onRemove(otherUser.id)}
        />
      </HStack>
    </HStack>
  );
};

const RequestItem = ({ request, currentUserId, onAccept, onReject, isProcessing }) => {
  const otherUser = request.user1.id === currentUserId ? request.user2 : request.user1;
  // If I am user1, I sent the request. If I am user2, I received it.
  // BUT fetchFriends returns relationships.
  // Usually, "requests" means incoming.
  // If I sent it, I should see "Pending" status.
  // If I received it, I should see "Accept/Reject".
  
  const isIncoming = request.user2.id === currentUserId;

  return (
    <HStack
      p="4"
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      justify="space-between"
      align="center"
      _hover={{ bg: 'gray.50' }}
    >
      <HStack spacing="4">
        <Avatar name={otherUser.fullname} src={otherUser.thumbnail} size="md" />
        <VStack align="start" spacing="0">
          <Text fontWeight="600">{otherUser.fullname}</Text>
          <Text fontSize="sm" color="gray.500">
            {isIncoming ? 'Arkadaşlık isteği gönderdi' : 'İstek gönderildi'}
          </Text>
        </VStack>
      </HStack>
      <HStack spacing="2">
        {isIncoming ? (
          <>
            <IconButton
              icon={<FiCheck />}
              aria-label="Kabul Et"
              colorScheme="green"
              onClick={() => onAccept(otherUser.id)}
              isLoading={isProcessing}
            />
            <IconButton
              icon={<FiX />}
              aria-label="Reddet"
              colorScheme="red"
              variant="outline"
              onClick={() => onReject(otherUser.id)}
              isLoading={isProcessing}
            />
          </>
        ) : (
          <Button size="sm" variant="outline" colorScheme="gray" isDisabled>
            Bekliyor
          </Button>
        )}
      </HStack>
    </HStack>
  );
};

const UserSearchItem = ({ user, onAdd, isAdding, friendshipStatus }) => {
  return (
    <HStack
      p="3"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      justify="space-between"
      align="center"
    >
      <HStack spacing="3">
        <Avatar name={user.fullname} src={user.thumbnail} size="sm" />
        <VStack align="start" spacing="0">
          <Text fontWeight="600" fontSize="sm">{user.fullname}</Text>
          <Text fontSize="xs" color="gray.500">@{user.username || user.email?.split('@')[0] || 'Bilinmiyor'}</Text>
        </VStack>
      </HStack>
      
      {friendshipStatus === 'friend' ? (
        <Badge colorScheme="green">Arkadaş</Badge>
      ) : friendshipStatus === 'pending' ? (
        <Badge colorScheme="orange">İstek Gönderildi</Badge>
      ) : (
        <IconButton
          icon={<FiUserPlus />}
          aria-label="Ekle"
          size="sm"
          colorScheme="blue"
          variant="ghost"
          onClick={() => onAdd(user.id)}
          isLoading={isAdding}
        />
      )}
    </HStack>
  );
};

const FriendManager = ({ currentUserId, navigate }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch Friends (Accepted)
  const { data: friendsData, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends', currentUserId, 'accepted'],
    queryFn: () => api.fetchFriends(currentUserId, { status: true, limit: 100 }),
    select: (res) => res.data.results,
  });

  // Fetch Requests (Pending)
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['friends', currentUserId, 'pending'],
    queryFn: () => api.fetchFriends(currentUserId, { status: false, limit: 100 }),
    select: (res) => res.data.results,
  });

  // Search Users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.getUsers({ query: searchQuery, limit: 10 });
      setSearchResults(res.data.results);
    } catch (error) {
      toast({
        title: 'Arama hatası',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Mutations
  const addFriendMutation = useMutation({
    mutationFn: (userId) => api.addFriend(userId),
    onSuccess: () => {
      toast({ title: 'İstek gönderildi', status: 'success' });
      queryClient.invalidateQueries(['friends']);
      // Update local search results state if needed
      handleSearch(); // Refresh search to show status update
    },
    onError: () => toast({ title: 'İşlem başarısız', status: 'error' }),
  });

  const acceptFriendMutation = useMutation({
    mutationFn: (userId) => api.acceptFriend(userId),
    onSuccess: () => {
      toast({ title: 'Arkadaşlık kabul edildi', status: 'success' });
      queryClient.invalidateQueries(['friends']);
    },
    onError: () => toast({ title: 'İşlem başarısız', status: 'error' }),
  });

  const removeFriendMutation = useMutation({
    mutationFn: (userId) => api.removeFriend(userId),
    onSuccess: () => {
      toast({ title: 'İşlem başarılı', status: 'success' });
      queryClient.invalidateQueries(['friends']);
    },
    onError: () => toast({ title: 'İşlem başarısız', status: 'error' }),
  });

  const initiateChannelMutation = useMutation({
    mutationFn: (userId) => api.initiatePrivateChannel(userId),
    onSuccess: (res) => {
      if (res.data?.id) {
        navigate(`/dashboard/messaging/channels/${res.data.id}`);
      }
    },
    onError: () => toast({ title: 'Mesajlaşma başlatılamadı', status: 'error' }),
  });

  const getFriendshipStatus = (userId) => {
    if (friendsData?.some(f => f.user1.id === userId || f.user2.id === userId)) return 'friend';
    if (requestsData?.some(r => r.user1.id === userId || r.user2.id === userId)) return 'pending';
    return 'none';
  };

  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Arkadaşlar ({friendsData?.length || 0})</Tab>
          <Tab>İstekler ({requestsData?.length || 0})</Tab>
          <Tab>Arkadaş Ekle</Tab>
        </TabList>

        <TabPanels>
          {/* Friends List */}
          <TabPanel px="0">
            <VStack spacing="3" align="stretch">
              {isLoadingFriends ? (
                <Spinner alignSelf="center" />
              ) : friendsData?.length > 0 ? (
                friendsData.map((friend) => (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    currentUserId={currentUserId}
                    onMessage={(uid) => initiateChannelMutation.mutate(uid)}
                    onRemove={(uid) => removeFriendMutation.mutate(uid)}
                    isRemoving={removeFriendMutation.isPending}
                  />
                ))
              ) : (
                <Text textAlign="center" color="gray.500" py="8">
                  Henüz arkadaşınız yok.
                </Text>
              )}
            </VStack>
          </TabPanel>

          {/* Requests List */}
          <TabPanel px="0">
            <VStack spacing="3" align="stretch">
              {isLoadingRequests ? (
                <Spinner alignSelf="center" />
              ) : requestsData?.length > 0 ? (
                requestsData.map((request) => (
                  <RequestItem
                    key={request.id}
                    request={request}
                    currentUserId={currentUserId}
                    onAccept={(uid) => acceptFriendMutation.mutate(uid)}
                    onReject={(uid) => removeFriendMutation.mutate(uid)}
                    isProcessing={acceptFriendMutation.isPending || removeFriendMutation.isPending}
                  />
                ))
              ) : (
                <Text textAlign="center" color="gray.500" py="8">
                  Bekleyen istek yok.
                </Text>
              )}
            </VStack>
          </TabPanel>

          {/* Add Friend */}
          <TabPanel px="0">
            <VStack spacing="4" align="stretch">
              <HStack>
                <InputGroup>
                  <Input
                    placeholder="Kullanıcı adı veya e-posta ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Ara"
                      icon={<FiSearch />}
                      size="sm"
                      variant="ghost"
                      onClick={handleSearch}
                      isLoading={isSearching}
                    />
                  </InputRightElement>
                </InputGroup>
              </HStack>

              <VStack spacing="2" align="stretch">
                {searchResults.map((user) => (
                  <UserSearchItem
                    key={user.id}
                    user={user}
                    onAdd={(uid) => addFriendMutation.mutate(uid)}
                    isAdding={addFriendMutation.isPending}
                    friendshipStatus={getFriendshipStatus(user.id)}
                  />
                ))}
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <Text textAlign="center" color="gray.500" fontSize="sm">
                    Sonuç bulunamadı.
                  </Text>
                )}
              </VStack>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FriendManager;
