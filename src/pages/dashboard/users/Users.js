import {
  Text,
  Badge,
  HStack,
  Button,
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Tooltip,
  useToast,
  Select,
} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {useNavigate} from 'react-router-dom';
import {api} from '../../../api';
import {RoleLabel} from '../../../config';
import {routes} from '../../../config/routes';
import {useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {FiStar} from 'react-icons/fi';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';

const fetchData = async options => {
  const response = await api.getUsers(options);
  return response.data;
};

const fetchUserCount = async filters => {
  const response = await api.getUsers({
    ...filters,
    page: 1,
    limit: 1,
  });

  return Number(response?.data?.totalResults || 0);
};

const fetchUserStats = async filters => {
  const baseFilters = {...filters};
  delete baseFilters.isDeleted;

  const [activeCount, deletedCount] = await Promise.all([
    fetchUserCount(baseFilters),
    fetchUserCount({...baseFilters, isDeleted: true}),
  ]);

  return {
    activeCount,
    deletedCount,
    totalCount: activeCount + deletedCount,
  };
};

const Users = () => {
  const navigate = useNavigate();
  const [filterParams, setFilterParams] = useState({});
  const queryClient = useQueryClient();
  const toast = useToast();
  const {data: userStats, isLoading: isLoadingUserStats} = useQuery({
    queryKey: ['users-stats', filterParams],
    queryFn: () => fetchUserStats(filterParams),
  });

  const togglePrivilegeMutation = useMutation({
    mutationFn: ({userId, isPrivileged}) =>
      api.updateUser(userId, {isPrivileged}),
    onSuccess: () => {
      queryClient.invalidateQueries(['data']);
      queryClient.invalidateQueries(['users-stats']);
      toast({
        title: 'Kullanıcı güncellendi',
        status: 'success',
        duration: 2000,
      });
    },
    onError: error => {
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

  const handleRoleFilter = type => {
    const newParams = {...filterParams};
    delete newParams.role;
    delete newParams.isPrivileged;

    switch (type) {
      case 'admin':
        newParams.role = 'admin';
        break;
      case 'privileged':
        newParams.isPrivileged = true;
        break;
      case 'user':
        newParams.role = 'user';
        break;
      default:
        break;
    }
    setFilterParams(newParams);
  };

  const handleActivityFilter = e => {
    const value = e.target.value;
    const newParams = {...filterParams};

    if (value) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(value));
      newParams.lastActiveAfter = date.toISOString();
    } else {
      delete newParams.lastActiveAfter;
    }
    setFilterParams(newParams);
  };

  const getActiveFilter = () => {
    if (filterParams.role === 'admin') return 'admin';
    if (filterParams.isPrivileged) return 'privileged';
    if (filterParams.role === 'user') return 'user';
    return 'all';
  };

  const activeFilter = getActiveFilter();
  const formatCount = value =>
    Number(value || 0).toLocaleString('tr-TR');

  return (
    <Page>
      <SimpleGrid columns={{base: 1, md: 3}} spacing={4} mb={4}>
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Stat>
            <StatLabel>Toplam Kayıt</StatLabel>
            <StatNumber>
              {isLoadingUserStats ? '-' : formatCount(userStats?.totalCount)}
            </StatNumber>
          </Stat>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Stat>
            <StatLabel>Aktif Kayıt</StatLabel>
            <StatNumber>
              {isLoadingUserStats ? '-' : formatCount(userStats?.activeCount)}
            </StatNumber>
          </Stat>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg">
          <Stat>
            <StatLabel>Silinen Kayıt</StatLabel>
            <StatNumber>
              {isLoadingUserStats ? '-' : formatCount(userStats?.deletedCount)}
            </StatNumber>
          </Stat>
        </Box>
      </SimpleGrid>
      <Box mb={4}>
        <HStack spacing={4} justify="space-between">
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme={activeFilter === 'all' ? 'blue' : 'gray'}
              onClick={() => handleRoleFilter('all')}>
              Tümü
            </Button>
            <Button
              size="sm"
              colorScheme={activeFilter === 'admin' ? 'blue' : 'gray'}
              onClick={() => handleRoleFilter('admin')}>
              Yöneticiler
            </Button>
            <Button
              size="sm"
              colorScheme={activeFilter === 'privileged' ? 'blue' : 'gray'}
              onClick={() => handleRoleFilter('privileged')}>
              Ayrıcalıklı Üyeler
            </Button>
            <Button
              size="sm"
              colorScheme={activeFilter === 'user' ? 'blue' : 'gray'}
              onClick={() => handleRoleFilter('user')}>
              Kullanıcılar
            </Button>
          </HStack>

          <Box width="200px">
            <Select
              size="sm"
              placeholder="Son Aktivite: Tümü"
              onChange={handleActivityFilter}>
              <option value="1">Son 24 Saat</option>
              <option value="3">Son 3 Gün</option>
              <option value="7">Son 7 Gün</option>
              <option value="30">Son 30 Gün</option>
              <option value="90">Son 3 Ay</option>
            </Select>
          </Box>
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
            header: 'Son Aktivite',
            accessorKey: 'lastActivityAt',
            cell: ({getValue}) => {
              const value = getValue();
              if (!value)
                return (
                  <Text fontSize="sm" color="gray.500">
                    -
                  </Text>
                );
              return (
                <Text fontSize="sm">
                  {format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr})}
                </Text>
              );
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
                <Tooltip
                  label={
                    isPrivileged ? 'Ayrıcalığı Kaldır' : 'Ayrıcalıklı Üye Yap'
                  }>
                  <IconButton
                    icon={
                      <FiStar
                        fill={isPrivileged ? 'orange' : 'none'}
                        color={isPrivileged ? 'orange' : 'gray'}
                      />
                    }
                    onClick={e => {
                      e.stopPropagation();
                      togglePrivilegeMutation.mutate({
                        userId,
                        isPrivileged: !isPrivileged,
                      });
                    }}
                    isLoading={
                      togglePrivilegeMutation.isPending &&
                      togglePrivilegeMutation.variables?.userId === userId
                    }
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
