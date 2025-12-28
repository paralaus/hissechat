import {Text, Badge, HStack, Button, Box, IconButton, Tooltip, useToast} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {useNavigate} from 'react-router-dom';
import {api} from '../../../api';
import {RoleLabel} from '../../../config';
import {routes} from '../../../config/routes';
import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {FiStar} from 'react-icons/fi';

const fetchData = async options => {
  const response = await api.getUsers(options);
  return response.data;
};

const Users = () => {
  const navigate = useNavigate();
  const [filterParams, setFilterParams] = useState({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const togglePrivilegeMutation = useMutation({
    mutationFn: ({userId, isPrivileged}) => api.updateUser(userId, {isPrivileged}),
    onSuccess: () => {
      queryClient.invalidateQueries(['data']);
      toast({
        title: 'Kullanıcı güncellendi',
        status: 'success',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.response?.data?.message || 'İşlem başarısız',
        status: 'error',
        duration: 3000,
      });
    },
  });

  const onRow = async item => {
    navigate(routes.editUser.getPath(item.id));
  };

  const handleFilter = (type) => {
    switch (type) {
      case 'admin':
        setFilterParams({ role: 'admin' });
        break;
      case 'privileged':
        setFilterParams({ isPrivileged: true });
        break;
      case 'user':
        setFilterParams({ role: 'user' });
        break;
      default:
        setFilterParams({});
    }
  };

  const getActiveFilter = () => {
    if (filterParams.role === 'admin') return 'admin';
    if (filterParams.isPrivileged) return 'privileged';
    if (filterParams.role === 'user') return 'user';
    return 'all';
  };

  const activeFilter = getActiveFilter();

  return (
    <Page>
      <Box mb={4}>
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme={activeFilter === 'all' ? 'blue' : 'gray'}
            onClick={() => handleFilter('all')}
          >
            Tümü
          </Button>
          <Button
            size="sm"
            colorScheme={activeFilter === 'admin' ? 'blue' : 'gray'}
            onClick={() => handleFilter('admin')}
          >
            Yöneticiler
          </Button>
          <Button
            size="sm"
            colorScheme={activeFilter === 'privileged' ? 'blue' : 'gray'}
            onClick={() => handleFilter('privileged')}
          >
            Ayrıcalıklı Üyeler
          </Button>
          <Button
            size="sm"
            colorScheme={activeFilter === 'user' ? 'blue' : 'gray'}
            onClick={() => handleFilter('user')}
          >
            Kullanıcılar
          </Button>
        </HStack>
      </Box>
      <DataTable
        queryEnabled
        editVisible
        onRow={onRow}
        filters={filterParams}
        columns={[
          {
            header: 'Ad Soyad',
            accessorKey: 'fullname',
          },
          {
            header: 'E-posta',
            accessorKey: 'email',
          },
          {
            header: 'Rol',
            accessorKey: 'role',
            cell: ({getValue, row}) => {
              const role = getValue();
              const isPrivileged = row.original.isPrivileged;
              const label = RoleLabel[role];
              
              let colorScheme = 'gray';
              if (role === 'admin') colorScheme = 'red';
              else if (isPrivileged) colorScheme = 'orange';
              
              return <Badge colorScheme={colorScheme}>{label}</Badge>;
            },
          },
          {
            header: '',
            accessorKey: 'actions',
            cell: ({row}) => {
              const user = row.original;
              const isPrivileged = user.isPrivileged;
              const userId = user.id || user._id;
              
              return (
                <Tooltip label={isPrivileged ? "Ayrıcalığı Kaldır" : "Ayrıcalıklı Üye Yap"}>
                  <IconButton
                    icon={<FiStar fill={isPrivileged ? "orange" : "none"} color={isPrivileged ? "orange" : "gray"} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePrivilegeMutation.mutate({ userId, isPrivileged: !isPrivileged });
                    }}
                    isLoading={togglePrivilegeMutation.isPending && togglePrivilegeMutation.variables?.userId === userId}
                    variant="ghost"
                    size="sm"
                    aria-label="Toggle Privilege"
                  />
                </Tooltip>
              );
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Users;
