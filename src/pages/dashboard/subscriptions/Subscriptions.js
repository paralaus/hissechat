import {
  Text,
  Badge,
  HStack,
  Select,
  Box,
} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {api} from '../../../api';
import {useState} from 'react';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {FaApple, FaGooglePlay} from 'react-icons/fa';

const fetchData = async options => {
  const params = {...options};
  if (params.query) {
    params.productId = params.query;
    delete params.query;
  }
  const response = await api.getPurchases(params);
  return response.data;
};

const Subscriptions = () => {
  const [filterParams, setFilterParams] = useState({});

  const handlePlatformFilter = e => {
    const value = e.target.value;
    const newParams = {...filterParams};
    if (value) {
      newParams.platform = value;
    } else {
      delete newParams.platform;
    }
    setFilterParams(newParams);
  };

  const columns = [
    {
      header: 'Kullanıcı',
      accessorKey: 'user',
      cell: ({getValue}) => {
        const value = getValue();
        return (
          <Box>
            <Text fontWeight="bold">{value?.name || 'İsimsiz'}</Text>
            <Text fontSize="sm" color="gray.500">
              {value?.email}
            </Text>
          </Box>
        );
      },
    },
    {
      header: 'Ürün',
      accessorKey: 'productId',
      cell: ({getValue}) => <Badge>{getValue()}</Badge>,
    },
    {
      header: 'Platform',
      accessorKey: 'platform',
      cell: ({getValue}) => {
        const value = getValue();
        if (value === 'apple') {
          return (
            <Badge colorScheme="gray" display="flex" alignItems="center" gap={1}>
              <FaApple /> Apple
            </Badge>
          );
        }
        if (value === 'google') {
          return (
            <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
              <FaGooglePlay /> Google
            </Badge>
          );
        }
        return <Badge>{value}</Badge>;
      },
    },
    {
      header: 'Başlangıç',
      accessorKey: 'purchaseTime',
      cell: ({row}) => {
        const date = row.original.createdAt || row.original.purchaseTime;
        return date ? format(new Date(date), 'dd MMM yyyy HH:mm', {locale: tr}) : '-';
      },
    },
    {
      header: 'Bitiş',
      accessorKey: 'expiryTime',
      cell: ({getValue}) => {
        const value = getValue();
        return value ? format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr}) : '-';
      },
    },
    {
      header: 'Durum',
      id: 'status',
      cell: ({row}) => {
        const isExpired = row.original.isExpired;
        const expiryTime = new Date(row.original.expiryTime).getTime();
        const now = Date.now();
        const expired = isExpired || expiryTime < now;
        
        return (
          <Badge colorScheme={expired ? 'red' : 'green'}>
            {expired ? 'Süresi Dolmuş' : 'Aktif'}
          </Badge>
        );
      },
    },
  ];

  return (
    <Page title="Abonelikler">
      <HStack mb={4} spacing={4}>
        <Select
          placeholder="Tüm Platformlar"
          maxW="200px"
          onChange={handlePlatformFilter}
        >
          <option value="apple">Apple App Store</option>
          <option value="google">Google Play Store</option>
        </Select>
      </HStack>
      <DataTable
        columns={columns}
        fetchData={fetchData}
        filters={filterParams}
        queryEnabled={true}
        searchPlaceholder="Ürün ID ara..."
      />
    </Page>
  );
};

export default Subscriptions;
