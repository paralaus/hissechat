import React, {useMemo, useState} from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import {useQuery} from '@tanstack/react-query';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {DataTable, Page} from '../../../components';
import {api} from '../../../api';
import useDisclosure from '../../../hooks/useDisclosure';
import TelemetryDetailModal from './TelemetryDetailModal';

const XIAOMI_FAMILY_BRANDS = ['xiaomi', 'redmi', 'poco'];

const fetchData = async options => {
  const response = await api.getClientTelemetryEvents(options);
  return response.data;
};

const fetchStats = async options => {
  const response = await api.getClientTelemetryStats(options);
  return response.data;
};

const EVENT_TYPE_LABELS = {
  session_start: 'Session Start',
  navigation_ready: 'Navigation Ready',
  navigation_change: 'Navigation Change',
  navigation_settled: 'Navigation Settled',
  heartbeat: 'Heartbeat',
  app_state_change: 'App State',
};

const eventColorScheme = eventType => {
  switch (eventType) {
    case 'navigation_settled':
      return 'purple';
    case 'navigation_change':
      return 'blue';
    case 'app_state_change':
      return 'orange';
    case 'heartbeat':
      return 'green';
    default:
      return 'gray';
  }
};

const appModeColorScheme = appMode => {
  return appMode === 'premium'
    ? 'purple'
    : appMode === 'standard'
    ? 'blue'
    : 'gray';
};

const normalizeFilters = filters => {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== '' && value !== null && value !== undefined,
    ),
  );
};

const DeviceTelemetry = () => {
  const detailModal = useDisclosure();
  const [filters, setFilters] = useState({
    brand: '',
    eventType: '',
    appMode: '',
    platform: '',
    xiaomiFamily: false,
    routeName: '',
    userId: '',
    from: '',
    to: '',
  });

  const activeFilters = useMemo(() => normalizeFilters(filters), [filters]);

  const {data: stats, isLoading: isStatsLoading} = useQuery({
    queryKey: ['device-telemetry-stats', activeFilters],
    queryFn: () => fetchStats(activeFilters),
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      brand: '',
      eventType: '',
      appMode: '',
      platform: '',
      xiaomiFamily: false,
      routeName: '',
      userId: '',
      from: '',
      to: '',
    });
  };

  const setXiaomiFamilyFilter = enabled => {
    setFilters(prev => ({
      ...prev,
      xiaomiFamily: enabled,
      brand:
        enabled && !XIAOMI_FAMILY_BRANDS.includes(prev.brand) ? '' : prev.brand,
    }));
  };

  const renderCount = value => {
    if (isStatsLoading) {
      return <Spinner size="sm" color="brand.500" />;
    }

    return Number(value || 0).toLocaleString('tr-TR');
  };

  return (
    <Page title="Cihaz Telemetri Kayitlari">
      <SimpleGrid columns={{base: 1, md: 2, xl: 4}} spacing={4} mb={4}>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel>Toplam Kayit</StatLabel>
            <StatNumber>{renderCount(stats?.totalEvents)}</StatNumber>
          </Stat>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel>Session</StatLabel>
            <StatNumber>{renderCount(stats?.uniqueSessions)}</StatNumber>
          </Stat>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel>Kullanici</StatLabel>
            <StatNumber>{renderCount(stats?.uniqueUsers)}</StatNumber>
          </Stat>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <Stat>
            <StatLabel>Son Event</StatLabel>
            <StatNumber fontSize="lg">
              {isStatsLoading ? (
                <Spinner size="sm" color="brand.500" />
              ) : stats?.latestEventAt ? (
                format(new Date(stats.latestEventAt), 'dd MMM HH:mm', {
                  locale: tr,
                })
              ) : (
                '-'
              )}
            </StatNumber>
          </Stat>
        </Box>
      </SimpleGrid>

      <HStack mb={4} spacing={3}>
        <Button
          size="sm"
          colorScheme={!filters.xiaomiFamily ? 'blue' : 'gray'}
          onClick={() => setXiaomiFamilyFilter(false)}>
          Tum Markalar
        </Button>
        <Button
          size="sm"
          colorScheme={filters.xiaomiFamily ? 'purple' : 'gray'}
          onClick={() => setXiaomiFamilyFilter(true)}>
          Xiaomi / Redmi / Poco
        </Button>
      </HStack>

      <Box mb={4}>
        <SimpleGrid columns={{base: 1, md: 3, xl: 5}} spacing={3}>
          <Input
            placeholder="Marka (ornegin samsung, huawei, oppo)"
            value={filters.brand}
            onChange={e => updateFilter('brand', e.target.value)}
          />
          <Select
            placeholder="Event tipi"
            value={filters.eventType}
            onChange={e => updateFilter('eventType', e.target.value)}>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            placeholder="App mode"
            value={filters.appMode}
            onChange={e => updateFilter('appMode', e.target.value)}>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </Select>
          <Select
            placeholder="Platform"
            value={filters.platform}
            onChange={e => updateFilter('platform', e.target.value)}>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </Select>
          <Input
            placeholder="Route adi"
            value={filters.routeName}
            onChange={e => updateFilter('routeName', e.target.value)}
          />
          <Input
            placeholder="User ID"
            value={filters.userId}
            onChange={e => updateFilter('userId', e.target.value)}
          />
          <Input
            type="datetime-local"
            value={filters.from}
            onChange={e => updateFilter('from', e.target.value)}
          />
          <Input
            type="datetime-local"
            value={filters.to}
            onChange={e => updateFilter('to', e.target.value)}
          />
          <Button variant="outline" onClick={resetFilters}>
            Filtreleri Temizle
          </Button>
        </SimpleGrid>
      </Box>

      <DataTable
        queryEnabled
        searchPlaceholder="Route, model, session veya surum ara..."
        emptyMessage="Telemetri kaydi bulunamadi"
        filters={activeFilters}
        onRow={row => detailModal.open(row)}
        columns={[
          {
            header: 'Tarih',
            accessorKey: 'createdAt',
            cell: ({getValue}) => {
              const value = getValue();
              if (!value) {
                return <Text>-</Text>;
              }

              return (
                <Text fontSize="sm">
                  {format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr})}
                </Text>
              );
            },
          },
          {
            header: 'Kullanici',
            accessorKey: 'user',
            cell: ({getValue}) => {
              const user = getValue();

              return (
                <HStack spacing={3}>
                  <Avatar
                    size="sm"
                    name={user?.fullname || user?.email || 'Kullanici'}
                    src={user?.thumbnail}
                  />
                  <Box minW="0">
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                      {user?.fullname || 'Bilinmeyen kullanici'}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                      {user?.email || '-'}
                    </Text>
                  </Box>
                </HStack>
              );
            },
          },
          {
            header: 'Event',
            accessorKey: 'eventType',
            cell: ({getValue}) => {
              const eventType = getValue();
              return (
                <Badge colorScheme={eventColorScheme(eventType)}>
                  {EVENT_TYPE_LABELS[eventType] || eventType || '-'}
                </Badge>
              );
            },
          },
          {
            header: 'Route',
            accessorKey: 'routeName',
            cell: ({row}) => (
              <Box minW="0">
                <Text fontWeight="medium" noOfLines={1}>
                  {row.original.routeName || '-'}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  Onceki: {row.original.previousRouteName || '-'}
                </Text>
              </Box>
            ),
          },
          {
            header: 'Cihaz',
            accessorKey: 'model',
            cell: ({row}) => (
              <Box minW="0">
                <Text fontWeight="medium" noOfLines={1}>
                  {[row.original.brand, row.original.model]
                    .filter(Boolean)
                    .join(' / ') || '-'}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  API {row.original.apiLevel || '-'} /{' '}
                  {row.original.performanceTier || '-'}
                </Text>
              </Box>
            ),
          },
          {
            header: 'Durum',
            accessorKey: 'appMode',
            cell: ({row}) => (
              <HStack spacing={2}>
                <Badge colorScheme={appModeColorScheme(row.original.appMode)}>
                  {row.original.appMode || '-'}
                </Badge>
                <Badge variant="outline">{row.original.appState || '-'}</Badge>
              </HStack>
            ),
          },
          {
            header: 'Ozet',
            accessorKey: 'sessionId',
            cell: ({row}) => (
              <Box minW="0">
                <Text fontSize="sm" noOfLines={1}>
                  {row.original.sessionId || '-'}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  v{row.original.appVersion || '-'} (
                  {row.original.buildNumber || '-'})
                </Text>
              </Box>
            ),
          },
        ]}
        fetchData={fetchData}
      />

      <TelemetryDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        event={detailModal.variable}
      />
    </Page>
  );
};

export default DeviceTelemetry;
