import React, {useState} from 'react';
import {
  Box,
  Badge,
  Text,
  IconButton,
  Tooltip,
  useToast,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiTrash2,
  FiXCircle,
  FiMoreVertical,
  FiCheckCircle,
} from 'react-icons/fi';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '../../api';
import DataTable from '../../components/common/DataTable';
import Page from '../../components/common/Page';
import {formatDate} from '../../utils/functions';

const Polls = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(undefined);

  // Close Poll Mutation
  const closePollMutation = useMutation({
    mutationFn: id => api.closePollAdmin(id),
    onSuccess: () => {
      toast({
        title: 'Anket kapatıldı.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries(['polls-admin']);
    },
    onError: error => {
      toast({
        title: 'Hata oluştu.',
        description: error?.response?.data?.message || 'Anket kapatılamadı.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // Delete Poll Mutation
  const deletePollMutation = useMutation({
    mutationFn: id => api.deletePollAdmin(id),
    onSuccess: () => {
      toast({
        title: 'Anket silindi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries(['polls-admin']);
    },
    onError: error => {
      toast({
        title: 'Hata oluştu.',
        description: error?.response?.data?.message || 'Anket silinemedi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const columns = [
    {
      header: 'Soru',
      accessorKey: 'question',
      cell: ({getValue}) => (
        <Text noOfLines={2} title={getValue()}>
          {getValue()}
        </Text>
      ),
    },
    {
      header: 'Kanal',
      accessorKey: 'channelId',
      cell: ({row}) => (
        <Text fontSize="sm">{row.original.channelId?.name || '-'}</Text>
      ),
    },
    {
      header: 'Oluşturan',
      accessorKey: 'createdBy',
      cell: ({row}) => (
        <Text fontSize="sm">{row.original.createdBy?.fullname || '-'}</Text>
      ),
    },
    {
      header: 'Oy Sayısı',
      accessorKey: 'votes',
      cell: ({row}) => <Text>{row.original.votes?.length || 0}</Text>,
    },
    {
      header: 'Durum',
      accessorKey: 'isActive',
      cell: ({getValue}) => (
        <Badge colorScheme={getValue() ? 'green' : 'red'}>
          {getValue() ? 'Aktif' : 'Kapalı'}
        </Badge>
      ),
    },
    {
      header: 'Bitiş Tarihi',
      accessorKey: 'endsAt',
      cell: ({getValue}) => (
        <Text fontSize="sm">{getValue() ? formatDate(getValue()) : '-'}</Text>
      ),
    },
    {
      header: 'Oluşturulma',
      accessorKey: 'createdAt',
      cell: ({getValue}) => (
        <Text fontSize="sm">{formatDate(getValue())}</Text>
      ),
    },
    {
      header: 'İşlemler',
      id: 'actions',
      cell: ({row}) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            variant="ghost"
            size="sm"
          />
          <MenuList>
            {row.original.isActive && (
              <MenuItem
                icon={<FiXCircle />}
                onClick={() => {
                  if (
                    window.confirm(
                      'Bu anketi kapatmak istediğinize emin misiniz?',
                    )
                  ) {
                    closePollMutation.mutate(row.original.id);
                  }
                }}>
                Anketi Kapat
              </MenuItem>
            )}
            <MenuItem
              icon={<FiTrash2 />}
              color="red.500"
              onClick={() => {
                if (
                  window.confirm('Bu anketi silmek istediğinize emin misiniz?')
                ) {
                  deletePollMutation.mutate(row.original.id);
                }
              }}>
              Sil
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    },
  ];

  const fetchData = async ({pageParam = 1, queryKey}) => {
    const [_, filters] = queryKey;
    const params = {
      page: pageParam,
      limit: 20,
      sortBy: 'createdAt:desc',
      question: filters.query,
    };

    if (filters.isActive !== undefined) {
      params.isActive = filters.isActive;
    }

    const res = await api.getPollsAdmin(params);
    return res.data;
  };

  return (
    <Page title="Anket Yönetimi">
      <Box mb={4}>
        <HStack spacing={2}>
          <Badge
            cursor="pointer"
            colorScheme={isActive === undefined ? 'blue' : 'gray'}
            onClick={() => setIsActive(undefined)}
            p={2}
            borderRadius="md">
            Tümü
          </Badge>
          <Badge
            cursor="pointer"
            colorScheme={isActive === true ? 'green' : 'gray'}
            onClick={() => setIsActive(true)}
            p={2}
            borderRadius="md">
            Aktif
          </Badge>
          <Badge
            cursor="pointer"
            colorScheme={isActive === false ? 'red' : 'gray'}
            onClick={() => setIsActive(false)}
            p={2}
            borderRadius="md">
            Kapalı
          </Badge>
        </HStack>
      </Box>

      <DataTable
        columns={columns}
        fetchData={fetchData}
        queryKey={['polls-admin', {isActive}]}
        searchPlaceholder="Anket sorusu ara..."
        queryEnabled
      />
    </Page>
  );
};

export default Polls;