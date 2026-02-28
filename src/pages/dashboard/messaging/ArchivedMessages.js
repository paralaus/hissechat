import React, {useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Spinner,
  Badge,
  Button,
  Select,
  useToast,
} from '@chakra-ui/react';
import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '../../../api';
import {Page} from '../../../components';
import {
  FiSearch,
  FiExternalLink,
  FiTrash2,
  FiCopy,
  FiArrowLeft,
} from 'react-icons/fi';
import {routes} from '../../../config/routes';

const useQueryParam = key => {
  const {search} = useLocation();
  return useMemo(() => new URLSearchParams(search).get(key), [search, key]);
};

const ArchivedMessages = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const initialChannelId = useQueryParam('channelId') || '';
  const [query, setQuery] = React.useState('');
  const [channelId, setChannelId] = React.useState(initialChannelId);

  const {data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage} =
    useInfiniteQuery({
      queryKey: ['admin-archives', {channelId, query}],
      queryFn: ({pageParam}) =>
        api.getArchivedMessages({
          cursor: pageParam,
          limit: 30,
          channelId: channelId || undefined,
          q: query || undefined,
        }),
      getNextPageParam: lastPage => {
        const p = lastPage?.data;
        return p?.nextCursor;
      },
    });

  const deleteMutation = useMutation({
    mutationFn: archiveId => api.deleteArchivedMessage(archiveId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-archives']});
      toast({
        title: 'Arşiv silindi',
        status: 'success',
        position: 'top',
        duration: 1500,
      });
    },
    onError: error => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Arşiv silinemedi',
        status: 'error',
        position: 'top',
      });
    },
  });

  const archives = useMemo(() => {
    const pages = data?.pages || [];
    const list = pages.flatMap(p => p?.data?.results || []);
    return list;
  }, [data]);

  return (
    <Page>
      <Box bg="white" p="4" borderRadius="xl" boxShadow="sm" mb="4">
        <HStack justify="space-between">
          <HStack spacing="2">
            <IconButton
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate(routes.messagingChannels.path)}
              aria-label="Geri"
            />
            <Text fontWeight="600">Arşivlenmiş Mesajlar</Text>
          </HStack>
          <HStack spacing="2">
            <Select
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="Kanal filtresi"
              width="280px">
              {/* Optional: Could be populated via a query of user's channels */}
              {Array.from(
                new Set(
                  archives.map(a =>
                    JSON.stringify({
                      id: a.channelId || a.channel?._id || a.channel?.id,
                      name: a.channel?.name || a.channelName || a.channelId,
                    }),
                  ),
                ),
              )
                .map(str => JSON.parse(str))
                .filter(item => item.id)
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </Select>
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Metin ile ara"
              width="280px"
            />
            <IconButton icon={<FiSearch />} aria-label="Ara" />
          </HStack>
        </HStack>
      </Box>

      <Box bg="white" p="4" borderRadius="xl" boxShadow="sm">
        {isLoading ? (
          <Box textAlign="center" py="20">
            <Spinner size="xl" color="blue.500" />
          </Box>
        ) : archives.length === 0 ? (
          <Box textAlign="center" py="10">
            <Text color="gray.600">Arşivlenmiş mesaj bulunamadı</Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing="4">
            {archives.map(a => {
              const id = a._id || a.id;
              const channel = a.channel || {};
              const channelName =
                channel?.name || a.channelName || a.channelId || 'Kanal';
              const messageText =
                a.messageContent?.text ||
                a.content ||
                a.text ||
                a.message?.text ||
                '';
              const derivedChannelId =
                a.channelId || channel?._id || channel?.id;
              const derivedMessageId =
                a.message?._id || a.message?.id || a.messageId;
              return (
                <Box
                  key={id}
                  border="1px solid"
                  borderColor="gray.100"
                  p="3"
                  borderRadius="md">
                  <HStack justify="space-between" mb="2">
                    <HStack spacing="2">
                      <Badge colorScheme="purple">Arşiv</Badge>
                      <Text fontWeight="600">{channelName}</Text>
                    </HStack>
                    <HStack spacing="2">
                      <IconButton
                        icon={<FiExternalLink />}
                        aria-label="Mesaja git"
                        onClick={() => {
                          const url = `${window.location.origin}${routes.channelChat.getPath(derivedChannelId)}${derivedMessageId ? `?messageId=${derivedMessageId}` : ''}`;
                          window.open(url, '_blank');
                        }}
                      />
                      <IconButton
                        icon={<FiCopy />}
                        aria-label="Metni kopyala"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              messageText || '',
                            );
                            toast({
                              title: 'Kopyalandı',
                              status: 'success',
                              position: 'top',
                              duration: 1200,
                            });
                          } catch (e) {
                            toast({
                              title: 'Kopyalanamadı',
                              status: 'error',
                              position: 'top',
                            });
                          }
                        }}
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        aria-label="Arşivi sil"
                        colorScheme="red"
                        onClick={() => id && deleteMutation.mutate(id)}
                        isLoading={deleteMutation.isPending}
                      />
                    </HStack>
                  </HStack>
                  <Text fontSize="sm" color="gray.700">
                    {messageText || '(Metin içeriği yok)'}
                  </Text>
                </Box>
              );
            })}
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                variant="outline">
                Daha Fazla Yükle
              </Button>
            )}
          </VStack>
        )}
      </Box>
    </Page>
  );
};

export default ArchivedMessages;
