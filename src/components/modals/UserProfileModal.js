import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  Box,
  Divider,
  List,
  ListItem,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { getCombinedLogoUrl } from '../../utils/image';
import { FiUserPlus, FiUserMinus, FiUserCheck } from 'react-icons/fi';
import { useUserStore } from '../../store';

const UserProfileModal = ({ isOpen, onClose, userId }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const userStore = useUserStore((state) => state.user);
  const currentUserId = userStore?.id;

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => api.getUserProfile(userId).then(res => res.data),
    enabled: !!userId && isOpen,
  });

  const { data: commonChannels, isLoading: isLoadingChannels } = useQuery({
    queryKey: ['common-channels', userId],
    queryFn: () => api.getCommonJoinedChannels(userId).then(res => res.data),
    enabled: !!userId && isOpen,
  });

  const addFriendMutation = useMutation({
    mutationFn: () => api.addFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userId]);
      toast({ title: 'Arkadaşlık isteği gönderildi.', status: 'success' });
    },
    onError: (error) => {
        toast({ title: 'İşlem başarısız.', description: error?.message || 'Bir hata oluştu', status: 'error' });
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId) => api.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', userId]);
      toast({ title: 'Arkadaş silindi.', status: 'info' });
    },
     onError: (error) => {
        toast({ title: 'İşlem başarısız.', description: error?.message || 'Bir hata oluştu', status: 'error' });
    }
  });
  
  const acceptFriendMutation = useMutation({
      mutationFn: (friendId) => api.acceptFriend(friendId),
      onSuccess: () => {
          queryClient.invalidateQueries(['user-profile', userId]);
          toast({ title: 'Arkadaşlık isteği kabul edildi.', status: 'success' });
      },
       onError: (error) => {
        toast({ title: 'İşlem başarısız.', description: error?.message || 'Bir hata oluştu', status: 'error' });
    }
  })

  const user = profileData?.user;
  const friend = profileData?.friend;
  
  const renderFriendButton = () => {
      if (userId === currentUserId) return null;

      if (friend?.status) {
          return (
              <Button leftIcon={<FiUserMinus />} colorScheme="red" variant="outline" size="sm" onClick={() => removeFriendMutation.mutate(friend.id)} isLoading={removeFriendMutation.isPending}>
                  Arkadaşlıktan Çıkar
              </Button>
          )
      }
      
      if (friend && !friend.status) {
          // Check if I am user1 (requester) or user2 (recipient)
          // Usually friend model: user1 is requester, user2 is recipient.
          // But we need to be sure about IDs.
          const isRequester = (friend.user1 === currentUserId || friend.user1?._id === currentUserId || friend.user1?.id === currentUserId);
          
          if (isRequester) {
               return (
                  <Button leftIcon={<FiUserCheck />} colorScheme="gray" variant="solid" size="sm" isDisabled>
                      İstek Gönderildi
                  </Button>
               )
          } else {
              return (
                  <HStack>
                      <Button leftIcon={<FiUserCheck />} colorScheme="green" size="sm" onClick={() => acceptFriendMutation.mutate(friend.id)} isLoading={acceptFriendMutation.isPending}>
                          Kabul Et
                      </Button>
                       <Button leftIcon={<FiUserMinus />} colorScheme="red" variant="ghost" size="sm" onClick={() => removeFriendMutation.mutate(friend.id)} isLoading={removeFriendMutation.isPending}>
                          Reddet
                      </Button>
                  </HStack>
              )
          }
      }

      return (
          <Button leftIcon={<FiUserPlus />} colorScheme="blue" size="sm" onClick={() => addFriendMutation.mutate()} isLoading={addFriendMutation.isPending}>
              Arkadaş Ekle
          </Button>
      );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Kullanıcı Profili</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoadingProfile ? (
            <Box textAlign="center" py={10}>
              <Spinner />
            </Box>
          ) : user ? (
            <VStack spacing={6}>
              <VStack align="center" spacing={3}>
                <Avatar size="2xl" src={getCombinedLogoUrl(user.thumbnail)} name={user.fullname} />
                <VStack align="center" spacing={1}>
                  <Text fontWeight="bold" fontSize="xl">{user.fullname}</Text>
                  <Text color="gray.500" fontSize="sm">@{user.username}</Text>
                </VStack>
                {renderFriendButton()}
              </VStack>

              <Divider />

              <Box width="100%">
                <Text fontWeight="bold" mb={3}>Ortak Kanallar</Text>
                {isLoadingChannels ? (
                   <Box textAlign="center"><Spinner size="sm"/></Box>
                ) : commonChannels && commonChannels.length > 0 ? (
                  <List spacing={2}>
                    {commonChannels.map(channel => (
                      <ListItem key={channel.id} p={2} borderRadius="md" _hover={{ bg: 'gray.50' }}>
                        <HStack spacing={3}>
                          <Avatar size="sm" src={getCombinedLogoUrl(channel.thumbnail)} name={channel.name} />
                          <Text fontSize="sm" fontWeight="medium">{channel.name}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text color="gray.500" fontSize="sm">Ortak kanal bulunamadı.</Text>
                )}
              </Box>
            </VStack>
          ) : (
            <Text textAlign="center">Kullanıcı bulunamadı</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default UserProfileModal;
