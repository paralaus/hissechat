import React, {useEffect, useState, useCallback, useRef} from 'react';
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
  Input,
  Select,
  HStack,
  VStack,
  Heading,
  IconButton,
  Tag,
  TagLabel,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  InputGroup,
  InputLeftElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiSearch,
  FiBell,
  FiTrash2,
  FiSlash,
  FiEye,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getAdminPriceAlerts,
  getAdminPriceAlertStats,
  cancelAdminPriceAlert,
  deleteAdminPriceAlert,
} from '../../../api/api';

const STATUS_LABEL = {
  active: 'Aktif',
  triggered: 'Tetiklendi',
  cancelled: 'İptal',
};

const STATUS_COLOR = {
  active: 'green',
  triggered: 'orange',
  cancelled: 'gray',
};

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch (_) {
    return String(iso);
  }
};

const formatNumber = (n) => {
  if (n === null || n === undefined || n === '') return '-';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('tr-TR', {maximumFractionDigits: 6});
};

const PriceAlerts = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [marketSearch, setMarketSearch] = useState('');
  const searchTimer = useRef(null);

  const detailModal = useDisclosure();
  const [selected, setSelected] = useState(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getAdminPriceAlertStats();
      setStats(res.data);
    } catch (e) {
      // sessiz
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: 25,
        page,
        sortBy: 'createdAt:desc',
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.alertType = typeFilter;
      if (marketSearch.trim()) params.marketCode = marketSearch.trim().toUpperCase();

      const res = await getAdminPriceAlerts(params);
      setItems(res.data.results || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalResults(res.data.totalResults || 0);
    } catch (e) {
      toast({
        title: 'Liste yüklenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, marketSearch, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onMarketChange = (val) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setMarketSearch(val);
    }, 400);
  };

  const handleCancel = async (item) => {
    if (!window.confirm(`${item.marketCode} alarmı iptal edilsin mi?`)) return;
    try {
      await cancelAdminPriceAlert(item.id);
      toast({title: 'Alarm iptal edildi', status: 'success'});
      await Promise.all([fetchItems(), fetchStats()]);
    } catch (e) {
      toast({
        title: 'İptal edilemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`${item.marketCode} alarmı kalıcı olarak silinsin mi?`)) return;
    try {
      await deleteAdminPriceAlert(item.id);
      toast({title: 'Alarm silindi', status: 'success'});
      await Promise.all([fetchItems(), fetchStats()]);
    } catch (e) {
      toast({
        title: 'Silinemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    }
  };

  const openDetail = (item) => {
    setSelected(item);
    detailModal.onOpen();
  };

  return (
    <Page title="Fiyat Alarmları" subtitle="Tüm kullanıcı alarmlarını yönetin">
      {/* Stats */}
      <SimpleGrid columns={{base: 2, md: 5}} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Toplam</StatLabel>
              <StatNumber>{statsLoading ? <Spinner size="sm" /> : stats?.total ?? '-'}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Aktif</StatLabel>
              <StatNumber color="green.500">
                {statsLoading ? <Spinner size="sm" /> : stats?.active ?? '-'}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Tetiklenmiş</StatLabel>
              <StatNumber color="orange.500">
                {statsLoading ? <Spinner size="sm" /> : stats?.triggered ?? '-'}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>İptal</StatLabel>
              <StatNumber color="gray.500">
                {statsLoading ? <Spinner size="sm" /> : stats?.cancelled ?? '-'}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Bildirim Bekleyen</StatLabel>
              <StatNumber color="red.500">
                {statsLoading ? <Spinner size="sm" /> : stats?.notificationPending ?? '-'}
              </StatNumber>
              <StatHelpText>Tetiklendi ama bildirim gitmedi</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Top Markets + Type Breakdown */}
      {stats && (
        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="sm">En Çok Alarm Olan Marketler (Aktif)</Heading>
            </CardHeader>
            <CardBody pt={2}>
              {stats.topMarkets?.length ? (
                <VStack align="stretch" spacing={1} divider={<Divider />}>
                  {stats.topMarkets.map((m) => (
                    <Flex key={m.marketCode} justify="space-between" py={1}>
                      <HStack>
                        <Text fontWeight="medium" fontFamily="mono">
                          {m.marketCode}
                        </Text>
                        {m.marketName && (
                          <Text fontSize="xs" color="gray.500">
                            {m.marketName}
                          </Text>
                        )}
                      </HStack>
                      <Badge colorScheme="blue">{m.count}</Badge>
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text color="gray.500" fontSize="sm">
                  Aktif alarm yok.
                </Text>
              )}
            </CardBody>
          </Card>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="sm">Tip Dağılımı (Aktif)</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <HStack spacing={6}>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <FiArrowUp />
                      <Text>Üst (above)</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{stats.byType?.above ?? 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>
                    <HStack>
                      <FiArrowDown />
                      <Text>Alt (below)</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber>{stats.byType?.below ?? 0}</StatNumber>
                </Stat>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* List */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex align="center" justify="space-between" gap={3} wrap="wrap">
            <Flex align="center" gap={2}>
              <FiBell />
              <Heading size="sm">Alarmlar ({totalResults})</Heading>
            </Flex>
            <HStack spacing={2} wrap="wrap">
              <InputGroup size="sm" maxW="200px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  placeholder="Market kodu..."
                  defaultValue={marketSearch}
                  onChange={(e) => onMarketChange(e.target.value)}
                />
              </InputGroup>
              <Select
                size="sm"
                maxW="160px"
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="triggered">Tetiklenmiş</option>
                <option value="cancelled">İptal</option>
              </Select>
              <Select
                size="sm"
                maxW="140px"
                value={typeFilter}
                onChange={(e) => {
                  setPage(1);
                  setTypeFilter(e.target.value);
                }}
              >
                <option value="all">Tüm Tipler</option>
                <option value="above">Üst</option>
                <option value="below">Alt</option>
              </Select>
              <IconButton
                size="sm"
                aria-label="Yenile"
                icon={<FiRefreshCw />}
                onClick={() => {
                  fetchItems();
                  fetchStats();
                }}
                isLoading={loading}
              />
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody pt={2}>
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner />
            </Flex>
          ) : items.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={6}>
              Kayıt bulunamadı.
            </Text>
          ) : (
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Market</Th>
                    <Th>Tip</Th>
                    <Th isNumeric>Hedef</Th>
                    <Th isNumeric>Başlangıç</Th>
                    <Th isNumeric>Tetik Fiyat</Th>
                    <Th>Durum</Th>
                    <Th>Kullanıcı</Th>
                    <Th>Oluşturma</Th>
                    <Th>İşlem</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((item) => (
                    <Tr key={item.id} _hover={{bg: 'blackAlpha.50'}}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontFamily="mono" fontWeight="bold">
                            {item.marketCode}
                          </Text>
                          {item.marketName && (
                            <Text fontSize="xs" color="gray.500">
                              {item.marketName}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Tag size="sm" colorScheme={item.alertType === 'above' ? 'green' : 'red'}>
                          {item.alertType === 'above' ? <FiArrowUp /> : <FiArrowDown />}
                          <TagLabel ml={1}>
                            {item.alertType === 'above' ? 'Üst' : 'Alt'}
                          </TagLabel>
                        </Tag>
                      </Td>
                      <Td isNumeric fontFamily="mono">{formatNumber(item.targetPrice)}</Td>
                      <Td isNumeric fontFamily="mono" color="gray.500">
                        {formatNumber(item.currentPriceAtCreation)}
                      </Td>
                      <Td isNumeric fontFamily="mono">
                        {formatNumber(item.triggeredPrice)}
                      </Td>
                      <Td>
                        <Badge colorScheme={STATUS_COLOR[item.status] || 'gray'}>
                          {STATUS_LABEL[item.status] || item.status}
                        </Badge>
                        {item.status === 'triggered' && !item.notificationSent && (
                          <Tooltip label="Bildirim gönderilmedi">
                            <Badge ml={1} colorScheme="red" variant="outline">
                              !
                            </Badge>
                          </Tooltip>
                        )}
                      </Td>
                      <Td>
                        <Text fontSize="xs">
                          {item.user?.username || item.user?.email || item.user?.id || '-'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(item.createdAt)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Detay">
                            <IconButton
                              size="xs"
                              aria-label="Detay"
                              icon={<FiEye />}
                              variant="ghost"
                              onClick={() => openDetail(item)}
                            />
                          </Tooltip>
                          {item.status === 'active' && (
                            <Tooltip label="İptal Et">
                              <IconButton
                                size="xs"
                                aria-label="İptal"
                                icon={<FiSlash />}
                                colorScheme="orange"
                                variant="ghost"
                                onClick={() => handleCancel(item)}
                              />
                            </Tooltip>
                          )}
                          <Tooltip label="Sil">
                            <IconButton
                              size="xs"
                              aria-label="Sil"
                              icon={<FiTrash2 />}
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {totalPages > 1 && (
            <Flex justify="center" align="center" gap={3} pt={4}>
              <Button
                size="sm"
                isDisabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Önceki
              </Button>
              <Text fontSize="sm" color="gray.500">
                Sayfa {page} / {totalPages}
              </Text>
              <Button
                size="sm"
                isDisabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sonraki
              </Button>
            </Flex>
          )}
        </CardBody>
      </Card>

      {/* Detail modal */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Alarm Detayı</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selected && (
              <VStack align="stretch" spacing={2} divider={<Divider />}>
                <Flex justify="space-between">
                  <Text color="gray.500">Market</Text>
                  <Text fontFamily="mono" fontWeight="bold">
                    {selected.marketCode}
                    {selected.marketName ? ` — ${selected.marketName}` : ''}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Tip</Text>
                  <Text>{selected.alertType === 'above' ? 'Üst (above)' : 'Alt (below)'}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Hedef Fiyat</Text>
                  <Text fontFamily="mono">{formatNumber(selected.targetPrice)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Oluşturma Fiyatı</Text>
                  <Text fontFamily="mono">
                    {formatNumber(selected.currentPriceAtCreation)}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Tetik Fiyatı</Text>
                  <Text fontFamily="mono">{formatNumber(selected.triggeredPrice)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Durum</Text>
                  <Badge colorScheme={STATUS_COLOR[selected.status] || 'gray'}>
                    {STATUS_LABEL[selected.status] || selected.status}
                  </Badge>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Bildirim Gönderildi</Text>
                  <Text>{selected.notificationSent ? 'Evet' : 'Hayır'}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Tetiklenme</Text>
                  <Text>{formatDate(selected.triggeredAt)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Kullanıcı</Text>
                  <Text fontSize="sm">
                    {selected.user?.username || selected.user?.email || selected.user?.id || '-'}
                  </Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Oluşturma</Text>
                  <Text fontSize="sm">{formatDate(selected.createdAt)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray.500">Güncelleme</Text>
                  <Text fontSize="sm">{formatDate(selected.updatedAt)}</Text>
                </Flex>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={detailModal.onClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default PriceAlerts;
