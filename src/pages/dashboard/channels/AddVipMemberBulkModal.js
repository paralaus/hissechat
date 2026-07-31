import React, {useMemo, useState} from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Checkbox,
  Text,
  Badge,
  Divider,
  Spinner,
  Icon,
  useToast,
} from '@chakra-ui/react';
import {useQuery} from '@tanstack/react-query';
import {FiSearch, FiCheckCircle, FiXCircle} from 'react-icons/fi';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';

// Fetches every page of a paginated list endpoint
const fetchAll = async apiFunc => {
  const limit = 100;
  const firstRes = await apiFunc({limit, page: 1});
  if (!firstRes.data) return [];

  let allResults = firstRes.data.results || [];
  const totalPages = firstRes.data.totalPages || 1;

  if (totalPages > 1) {
    const promises = [];
    for (let page = 2; page <= totalPages; page += 1) {
      promises.push(apiFunc({limit, page}));
    }
    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.data?.results) {
        allResults = allResults.concat(res.data.results);
      }
    });
  }

  return allResults;
};

const AddVipMemberBulkModal = ({isOpen, onClose}) => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({current: 0, total: 0});
  const [results, setResults] = useState(null);

  const channelsQuery = useQuery({
    queryKey: ['vip-channels-all-for-bulk-add'],
    queryFn: () => fetchAll(api.getVipChannels),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const channels = useMemo(() => channelsQuery.data || [], [channelsQuery.data]);

  const filteredChannels = useMemo(() => {
    const query = channelSearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return channels;
    return channels.filter(channel =>
      String(channel?.name || '').toLocaleLowerCase('tr-TR').includes(query),
    );
  }, [channels, channelSearch]);

  const toggleChannel = channelId => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredChannels.forEach(channel => next.add(channel.id));
      return next;
    });
  };

  const clearAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredChannels.forEach(channel => next.delete(channel.id));
      return next;
    });
  };

  const resetForm = () => {
    setEmail('');
    setChannelSearch('');
    setSelectedIds(new Set());
    setProgress({current: 0, total: 0});
    setResults(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast({title: 'Email girin', status: 'warning', position: 'top'});
      return;
    }
    if (selectedIds.size === 0) {
      toast({title: 'En az bir kanal seçin', status: 'warning', position: 'top'});
      return;
    }

    setIsSubmitting(true);
    setResults(null);

    try {
      const {data} = await api.getUsers({query: normalizedEmail, limit: 20});
      const matchedUser = (data?.results || []).find(
        user => String(user?.email || '').trim().toLowerCase() === normalizedEmail,
      );

      if (!matchedUser?.id) {
        toast({
          title: 'Bu email ile kullanıcı bulunamadı',
          status: 'warning',
          position: 'top',
        });
        setIsSubmitting(false);
        return;
      }

      const targetChannels = channels.filter(channel => selectedIds.has(channel.id));
      setProgress({current: 0, total: targetChannels.length});

      const settled = await Promise.allSettled(
        targetChannels.map(channel =>
          api.grantVipMemberAccess(channel.id, matchedUser.id).then(
            () => {
              setProgress(prev => ({...prev, current: prev.current + 1}));
              return {channel, status: 'success'};
            },
            error => {
              setProgress(prev => ({...prev, current: prev.current + 1}));
              return {channel, status: 'error', message: getErrorMessage(error)};
            },
          ),
        ),
      );

      const outcomes = settled.map(item => item.value);
      setResults(outcomes);

      const successCount = outcomes.filter(o => o.status === 'success').length;
      const failCount = outcomes.length - successCount;

      toast({
        title: 'Toplu ekleme tamamlandı',
        description: `${successCount} kanala eklendi, ${failCount} başarısız`,
        status: failCount ? 'warning' : 'success',
        position: 'top',
        duration: 6000,
      });
    } catch (error) {
      toast({title: getErrorMessage(error), status: 'error', position: 'top'});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={!isSubmitting}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Kullanıcıyı Birden Fazla VIP Kanala Ekle</ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Email</FormLabel>
              <Input
                placeholder="ornek@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                isDisabled={isSubmitting}
              />
            </FormControl>

            <Divider />

            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="sm">
                Kanallar ({selectedIds.size} / {channels.length} seçili)
              </Text>
              <HStack spacing={2}>
                <Button size="xs" variant="outline" onClick={selectAllFiltered} isDisabled={isSubmitting}>
                  Tümünü Seç
                </Button>
                <Button size="xs" variant="outline" onClick={clearAllFiltered} isDisabled={isSubmitting}>
                  Temizle
                </Button>
              </HStack>
            </HStack>

            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Kanal ara..."
                value={channelSearch}
                onChange={e => setChannelSearch(e.target.value)}
                isDisabled={isSubmitting}
              />
            </InputGroup>

            <VStack
              align="stretch"
              spacing={1}
              maxH="280px"
              overflowY="auto"
              borderWidth="1px"
              borderRadius="md"
              p={2}>
              {channelsQuery.isLoading ? (
                <HStack justify="center" py={6}>
                  <Spinner size="sm" />
                </HStack>
              ) : filteredChannels.length === 0 ? (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  Kanal bulunamadı
                </Text>
              ) : (
                filteredChannels.map(channel => (
                  <Checkbox
                    key={channel.id}
                    isChecked={selectedIds.has(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    isDisabled={isSubmitting}
                    py={1}>
                    {channel.name}
                    {typeof channel.memberCount === 'number' && (
                      <Badge ml={2} variant="subtle">
                        {channel.memberCount} üye
                      </Badge>
                    )}
                  </Checkbox>
                ))
              )}
            </VStack>

            {isSubmitting && progress.total > 0 && (
              <Text fontSize="sm" color="gray.500">
                İşleniyor: {progress.current} / {progress.total}
              </Text>
            )}

            {results && (
              <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto">
                {results.map(({channel, status, message}) => (
                  <HStack key={channel.id} fontSize="sm">
                    <Icon
                      as={status === 'success' ? FiCheckCircle : FiXCircle}
                      color={status === 'success' ? 'green.500' : 'red.500'}
                    />
                    <Text>{channel.name}</Text>
                    {status === 'error' && (
                      <Text color="red.500" fontSize="xs">
                        ({message})
                      </Text>
                    )}
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose} isDisabled={isSubmitting}>
            Kapat
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!email.trim() || selectedIds.size === 0}>
            Ekle
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddVipMemberBulkModal;
