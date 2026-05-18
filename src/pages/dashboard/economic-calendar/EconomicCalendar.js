import React, {useEffect, useState, useCallback} from 'react';
import {
  SimpleGrid,
  Text,
  Button,
  Flex,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  useToast,
  Select,
  HStack,
  VStack,
  Heading,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiCalendar,
  FiTrash2,
  FiDownloadCloud,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getEconomicCalendarStatus,
  getEconomicCalendarEvents,
  clearEconomicCalendarCache,
  refreshEconomicCalendarCache,
} from '../../../api/api';

const COUNTRY_OPTIONS = [
  {value: 'ALL', label: 'Tümü'},
  {value: 'TR', label: 'Türkiye'},
  {value: 'US', label: 'ABD'},
  {value: 'EU', label: 'Avrupa Birliği'},
  {value: 'DE', label: 'Almanya'},
  {value: 'GB', label: 'İngiltere'},
  {value: 'JP', label: 'Japonya'},
  {value: 'CN', label: 'Çin'},
];

const IMPORTANCE_LABEL = {1: 'Düşük', 2: 'Orta', 3: 'Yüksek'};
const IMPORTANCE_COLOR = {1: 'gray', 2: 'yellow', 3: 'red'};

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch (_) {
    return String(iso);
  }
};

const formatAge = (ms) => {
  if (ms === null || ms === undefined) return '-';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} sn`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa ${min % 60} dk`;
  const d = Math.floor(hr / 24);
  return `${d} gün ${hr % 24} sa`;
};

const EconomicCalendar = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [country, setCountry] = useState('ALL');
  const [limit, setLimit] = useState(50);

  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await getEconomicCalendarStatus();
      setStatus(res.data);
    } catch (e) {
      toast({
        title: 'Cache durumu alınamadı',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setStatusLoading(false);
    }
  }, [toast]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await getEconomicCalendarEvents({country, limit});
      setEvents(res.data.results || []);
    } catch (e) {
      toast({
        title: 'Olaylar yüklenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setEventsLoading(false);
    }
  }, [country, limit, toast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleClear = async () => {
    if (!window.confirm('Ekonomik takvim cache temizlensin mi?')) return;
    setClearing(true);
    try {
      await clearEconomicCalendarCache();
      toast({title: 'Cache temizlendi', status: 'success'});
      await fetchStatus();
    } catch (e) {
      toast({
        title: 'Temizlenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setClearing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await refreshEconomicCalendarCache({country, limit});
      toast({
        title: 'Cache yenilendi',
        description: `${res.data.count || 0} olay getirildi`,
        status: 'success',
      });
      await Promise.all([fetchStatus(), fetchEvents()]);
    } catch (e) {
      toast({
        title: 'Yenilenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const tv = status?.tradingView;
  const te = status?.tradingEconomics;

  return (
    <Page title="Ekonomik Takvim" subtitle="Cache ve sağlayıcı yönetimi">
      {/* Status cards */}
      <SimpleGrid columns={{base: 1, md: 3}} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="sm">TradingView Cache</Heading>
          </CardHeader>
          <CardBody pt={2}>
            {statusLoading ? (
              <Spinner size="sm" />
            ) : (
              <VStack align="stretch" spacing={1}>
                <Flex justify="space-between">
                  <Text color="gray.500">Durum</Text>
                  <Badge colorScheme={tv?.cached ? 'green' : 'gray'}>
                    {tv?.cached ? 'Yüklü' : 'Boş'}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Kayıt</Text>
                  <Text fontWeight="medium">{tv?.count ?? 0}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Yaş</Text>
                  <Text>{formatAge(tv?.ageMs)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Zaman</Text>
                  <Text fontSize="xs">{formatDate(tv?.cachedAt)}</Text>
                </Flex>
              </VStack>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="sm">Trading Economics</Heading>
          </CardHeader>
          <CardBody pt={2}>
            {statusLoading ? (
              <Spinner size="sm" />
            ) : (
              <VStack align="stretch" spacing={1}>
                <Flex justify="space-between">
                  <Text color="gray.500">Kimlik bilgileri</Text>
                  <Badge colorScheme={te?.credentialsConfigured ? 'green' : 'red'}>
                    {te?.credentialsConfigured ? (
                      <HStack spacing={1}>
                        <FiCheck />
                        <Text>Yapılandırılmış</Text>
                      </HStack>
                    ) : (
                      <HStack spacing={1}>
                        <FiX />
                        <Text>Yok</Text>
                      </HStack>
                    )}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Cache'li ülke</Text>
                  <Text fontWeight="medium">{te?.countries?.length ?? 0}</Text>
                </Flex>
              </VStack>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="sm">Cache Süresi</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <Stat>
              <StatLabel>TTL</StatLabel>
              <StatNumber>
                {status?.cacheDurationMs
                  ? `${Math.round(status.cacheDurationMs / 60000)} dk`
                  : '-'}
              </StatNumber>
              <StatHelpText>Cache geçerlilik süresi</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Trading Economics country breakdown */}
      {te?.countries?.length > 0 && (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
          <CardHeader pb={2}>
            <Heading size="sm">Trading Economics — Ülke Cache Detayı</Heading>
          </CardHeader>
          <CardBody pt={2}>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Ülke</Th>
                    <Th isNumeric>Kayıt</Th>
                    <Th>Yaş</Th>
                    <Th>Cache Zamanı</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {te.countries.map((c) => (
                    <Tr key={c.countryCode}>
                      <Td>
                        <Tag size="sm" colorScheme="blue">
                          <TagLabel>{c.countryCode}</TagLabel>
                        </Tag>
                      </Td>
                      <Td isNumeric>{c.count}</Td>
                      <Td>{formatAge(c.ageMs)}</Td>
                      <Td fontSize="xs">{formatDate(c.cachedAt)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
        <CardBody>
          <Flex align="center" justify="space-between" gap={3} wrap="wrap">
            <HStack spacing={3} wrap="wrap">
              <HStack>
                <Text fontSize="sm" color="gray.500">Ülke:</Text>
                <Select
                  size="sm"
                  maxW="180px"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </HStack>
              <HStack>
                <Text fontSize="sm" color="gray.500">Limit:</Text>
                <Select
                  size="sm"
                  maxW="100px"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                >
                  {[10, 25, 50, 100, 200].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </HStack>
            </HStack>
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<FiRefreshCw />}
                onClick={() => {
                  fetchStatus();
                  fetchEvents();
                }}
                isLoading={eventsLoading || statusLoading}
                variant="outline"
              >
                Yenile (görüntü)
              </Button>
              <Button
                size="sm"
                leftIcon={<FiDownloadCloud />}
                colorScheme="blue"
                onClick={handleRefresh}
                isLoading={refreshing}
              >
                Cache'i Yeniden Yükle
              </Button>
              <Button
                size="sm"
                leftIcon={<FiTrash2 />}
                colorScheme="red"
                variant="outline"
                onClick={handleClear}
                isLoading={clearing}
              >
                Cache'i Temizle
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Events table */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex align="center" gap={2}>
            <FiCalendar />
            <Heading size="sm">Olaylar ({events.length})</Heading>
          </Flex>
        </CardHeader>
        <CardBody pt={2}>
          {eventsLoading ? (
            <Flex justify="center" py={10}>
              <Spinner />
            </Flex>
          ) : events.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={6}>
              Olay bulunamadı.
            </Text>
          ) : (
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Tarih</Th>
                    <Th>Ülke</Th>
                    <Th>Başlık</Th>
                    <Th>Önem</Th>
                    <Th isNumeric>Tahmin</Th>
                    <Th isNumeric>Önceki</Th>
                    <Th isNumeric>Gerçekleşen</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {events.map((ev, i) => (
                    <Tr key={ev.id || `${ev.title}-${i}`} _hover={{bg: 'blackAlpha.50'}}>
                      <Td fontSize="xs" whiteSpace="nowrap">
                        {formatDate(ev.date)}
                      </Td>
                      <Td>
                        <Tag size="sm">{ev.countryCode || ev.country || '-'}</Tag>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{ev.title}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={IMPORTANCE_COLOR[ev.importance] || 'gray'}>
                          {IMPORTANCE_LABEL[ev.importance] || ev.importance || '-'}
                        </Badge>
                      </Td>
                      <Td isNumeric fontFamily="mono" fontSize="xs">{ev.forecast || '-'}</Td>
                      <Td isNumeric fontFamily="mono" fontSize="xs">{ev.previous || '-'}</Td>
                      <Td isNumeric fontFamily="mono" fontSize="xs" fontWeight="bold">
                        {ev.actual || '-'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>
    </Page>
  );
};

export default EconomicCalendar;
