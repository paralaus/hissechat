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
  Badge,
  useToast,
  HStack,
  VStack,
  Heading,
  Input,
  IconButton,
  Spinner,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tag,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Textarea,
  NumberInput,
  NumberInputField,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiSearch,
  FiXCircle,
  FiDollarSign,
  FiClock,
  FiRotateCcw,
} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getPurchaseAdminStats,
  getPurchaseAdminList,
  adminSyncUserPurchases,
  adminRefundPurchase,
  adminExtendPurchase,
  adminForceExpirePurchase,
} from '../../../api/api';

const formatDate = (val) => {
  if (!val) return '-';
  try {
    const d = typeof val === 'number' ? new Date(val) : new Date(val);
    return d.toLocaleString('tr-TR');
  } catch (_) {
    return String(val);
  }
};

const isActive = (p) => !p.isExpired && p.expiryTime && p.expiryTime > Date.now();

const PurchaseManagement = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);

  const [platform, setPlatform] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const refundModal = useDisclosure();
  const extendModal = useDisclosure();
  const [selected, setSelected] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [extendDays, setExtendDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await getPurchaseAdminStats();
      setStats(res.data);
    } catch (e) {
      toast({status: 'error', title: 'İstatistikler yüklenemedi', description: e.message});
    } finally {
      setLoadingStats(false);
    }
  }, [toast]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {limit: 20, page, sortBy: 'createdAt:desc'};
      if (platform) params.platform = platform;
      if (statusFilter === 'active') params.activeOnly = true;
      if (statusFilter === 'expired') params.isExpired = true;
      if (statusFilter === 'refunded') params.refundedOnly = true;
      if (search) params.search = search;
      const res = await getPurchaseAdminList(params);
      const data = res.data || {};
      setItems(data.results || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalResults || 0);
    } catch (e) {
      toast({status: 'error', title: 'Liste yüklenemedi', description: e.message});
    } finally {
      setLoading(false);
    }
  }, [page, platform, statusFilter, search, toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSyncUser = async (userId) => {
    if (!userId) return;
    if (!window.confirm('Bu kullanıcının satın alımları yeniden senkronize edilsin mi?')) return;
    try {
      await adminSyncUserPurchases(userId);
      toast({status: 'success', title: 'Senkronizasyon tamamlandı'});
      loadList();
    } catch (e) {
      toast({status: 'error', title: 'Senkronizasyon başarısız', description: e.message});
    }
  };

  const handleForceExpire = async (p) => {
    if (!window.confirm('Bu satın alma süresi dolmuş olarak işaretlensin mi?')) return;
    try {
      await adminForceExpirePurchase(p.id || p._id);
      toast({status: 'success', title: 'Satın alma süresi dolduruldu'});
      loadStats();
      loadList();
    } catch (e) {
      toast({status: 'error', title: 'İşlem başarısız', description: e.message});
    }
  };

  const openRefund = (p) => {
    setSelected(p);
    setRefundReason('');
    refundModal.onOpen();
  };

  const submitRefund = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminRefundPurchase(selected.id || selected._id, refundReason);
      toast({status: 'success', title: 'İade işlendi'});
      refundModal.onClose();
      loadStats();
      loadList();
    } catch (e) {
      toast({status: 'error', title: 'İade başarısız', description: e.message});
    } finally {
      setActionLoading(false);
    }
  };

  const openExtend = (p) => {
    setSelected(p);
    setExtendDays(30);
    extendModal.onOpen();
  };

  const submitExtend = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminExtendPurchase(selected.id || selected._id, Number(extendDays));
      toast({status: 'success', title: 'Süre uzatıldı'});
      extendModal.onClose();
      loadStats();
      loadList();
    } catch (e) {
      toast({status: 'error', title: 'Uzatma başarısız', description: e.message});
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Page title="Satın Alma Yönetimi">
      <VStack align="stretch" spacing={6}>
        <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={4}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Satın Alma</StatLabel>
                <StatNumber>{loadingStats ? <Spinner size="sm" /> : (stats?.totalPurchases ?? 0)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Aktif Abonelik</StatLabel>
                <StatNumber>{loadingStats ? <Spinner size="sm" /> : (stats?.activeSubscriptions ?? 0)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Süresi Dolmuş</StatLabel>
                <StatNumber>{loadingStats ? <Spinner size="sm" /> : (stats?.expiredCount ?? 0)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>İade Edilen</StatLabel>
                <StatNumber>{loadingStats ? <Spinner size="sm" /> : (stats?.refundedCount ?? 0)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{base: 1, md: 3}} spacing={4}>
          <Card bg={cardBg}>
            <CardHeader pb={1}>
              <Heading size="sm">Son 24 Saat</Heading>
            </CardHeader>
            <CardBody pt={1}>
              <Text fontSize="2xl" fontWeight="bold">{stats?.last24h ?? 0}</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg}>
            <CardHeader pb={1}>
              <Heading size="sm">Son 7 Gün</Heading>
            </CardHeader>
            <CardBody pt={1}>
              <Text fontSize="2xl" fontWeight="bold">{stats?.last7d ?? 0}</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg}>
            <CardHeader pb={1}>
              <Heading size="sm">Son 30 Gün</Heading>
            </CardHeader>
            <CardBody pt={1}>
              <Text fontSize="2xl" fontWeight="bold">{stats?.last30d ?? 0}</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {stats?.topProducts?.length > 0 && (
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="sm">En Çok Alınan Ürünler</Heading>
            </CardHeader>
            <CardBody>
              <HStack flexWrap="wrap" spacing={2}>
                {stats.topProducts.map((p) => (
                  <Tag key={p._id} colorScheme="purple" size="md">
                    {p._id}: {p.count}
                  </Tag>
                ))}
              </HStack>
            </CardBody>
          </Card>
        )}

        <Card bg={cardBg}>
          <CardBody>
            <Flex gap={3} flexWrap="wrap" align="end">
              <VStack align="stretch" spacing={1}>
                <Text fontSize="sm">Platform</Text>
                <Select
                  size="sm"
                  value={platform}
                  onChange={(e) => {
                    setPage(1);
                    setPlatform(e.target.value);
                  }}
                  minW="160px">
                  <option value="">Tümü</option>
                  <option value="apple">Apple</option>
                  <option value="google">Google</option>
                </Select>
              </VStack>
              <VStack align="stretch" spacing={1}>
                <Text fontSize="sm">Durum</Text>
                <Select
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  minW="160px">
                  <option value="">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="expired">Süresi Dolmuş</option>
                  <option value="refunded">İade Edilen</option>
                </Select>
              </VStack>
              <VStack align="stretch" spacing={1} flex={1} minW="240px">
                <Text fontSize="sm">Ara (kullanıcı / ürün / receipt / id)</Text>
                <HStack>
                  <Input
                    size="sm"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                    placeholder="Ara..."
                  />
                  <IconButton size="sm" icon={<FiSearch />} aria-label="Ara" onClick={applySearch} />
                </HStack>
              </VStack>
              <Button size="sm" leftIcon={<FiRefreshCw />} onClick={() => { loadStats(); loadList(); }}>
                Yenile
              </Button>
            </Flex>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="sm">Satın Almalar ({totalResults})</Heading>
              {loading && <Spinner size="sm" />}
            </Flex>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Platform</Th>
                    <Th>Ürün</Th>
                    <Th>Kullanıcı</Th>
                    <Th>Kanal</Th>
                    <Th>Başlangıç</Th>
                    <Th>Bitiş</Th>
                    <Th>Durum</Th>
                    <Th isNumeric>İşlemler</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((p) => {
                    const active = isActive(p);
                    const refunded = !!p.refundedAt;
                    const user = p.user || {};
                    const channel = p.channel || {};
                    return (
                      <Tr key={p.id || p._id}>
                        <Td>
                          <Badge colorScheme={p.platform === 'apple' ? 'gray' : 'green'}>
                            {p.platform}
                          </Badge>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">{p.product || '-'}</Text>
                            <Text fontSize="xs" color="gray.500">{p.platformId || ''}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">{user.name || user.username || user.email || '-'}</Text>
                            <Text fontSize="xs" color="gray.500">{user.email || ''}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{channel.name || (channel._id ? String(channel._id) : '-')}</Text>
                        </Td>
                        <Td>{formatDate(p.startTime || p.date || p.createdAt)}</Td>
                        <Td>{formatDate(p.expiryTime)}</Td>
                        <Td>
                          <HStack spacing={1}>
                            {refunded ? (
                              <Badge colorScheme="orange">İade</Badge>
                            ) : active ? (
                              <Badge colorScheme="green">Aktif</Badge>
                            ) : (
                              <Badge colorScheme="red">Süresi Dolmuş</Badge>
                            )}
                            {p.isVerified && <Badge colorScheme="blue">Doğrulanmış</Badge>}
                          </HStack>
                        </Td>
                        <Td isNumeric>
                          <HStack spacing={1} justify="flex-end">
                            <IconButton
                              size="xs"
                              aria-label="Süre Uzat"
                              title="Süre Uzat"
                              icon={<FiClock />}
                              onClick={() => openExtend(p)}
                            />
                            <IconButton
                              size="xs"
                              aria-label="İade"
                              title="İade"
                              icon={<FiDollarSign />}
                              colorScheme="orange"
                              onClick={() => openRefund(p)}
                              isDisabled={refunded}
                            />
                            <IconButton
                              size="xs"
                              aria-label="Süresini Dolduğunu İşaretle"
                              title="Süresini Dolduğunu İşaretle"
                              icon={<FiXCircle />}
                              colorScheme="red"
                              onClick={() => handleForceExpire(p)}
                              isDisabled={!active}
                            />
                            <IconButton
                              size="xs"
                              aria-label="Kullanıcıyı Senkronize Et"
                              title="Kullanıcıyı Senkronize Et"
                              icon={<FiRotateCcw />}
                              onClick={() => handleSyncUser(user.id || user._id)}
                              isDisabled={!user.id && !user._id}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                  {!loading && items.length === 0 && (
                    <Tr>
                      <Td colSpan={8}>
                        <Text textAlign="center" color="gray.500" py={4}>
                          Kayıt bulunamadı
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
            <Flex justify="space-between" align="center" mt={4}>
              <Text fontSize="sm">Sayfa {page} / {totalPages}</Text>
              <HStack>
                <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page <= 1}>
                  Önceki
                </Button>
                <Button size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} isDisabled={page >= totalPages}>
                  Sonraki
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      </VStack>

      <Modal isOpen={refundModal.isOpen} onClose={refundModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>İade İşle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Satın alma iade olarak işaretlenecek ve abonelik sonlandırılacak.</Text>
            <Textarea
              placeholder="İade gerekçesi (opsiyonel)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={refundModal.onClose} variant="ghost">İptal</Button>
            <Button colorScheme="orange" onClick={submitRefund} isLoading={actionLoading}>
              İade Et
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={extendModal.isOpen} onClose={extendModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Süre Uzat</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2}>Mevcut bitiş tarihine eklenecek gün sayısı:</Text>
            <NumberInput min={1} max={3650} value={extendDays} onChange={(v) => setExtendDays(v)}>
              <NumberInputField />
            </NumberInput>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={extendModal.onClose} variant="ghost">İptal</Button>
            <Button colorScheme="blue" onClick={submitExtend} isLoading={actionLoading}>
              Uzat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default PurchaseManagement;
