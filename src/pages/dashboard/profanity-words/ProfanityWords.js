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
  Textarea,
  FormControl,
  FormLabel,
  Input,
  HStack,
  VStack,
  Heading,
  IconButton,
  Tag,
  TagLabel,
  Switch,
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
} from '@chakra-ui/react';
import {FiPlus, FiTrash2, FiRefreshCw, FiSearch, FiUpload, FiShield} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getBlacklists,
  getBlacklistStats,
  createBlacklist,
  updateBlacklist,
  deleteBlacklist,
  bulkCreateBlacklist,
} from '../../../api/api';

const SCOPE = 'banned-text';
const TYPE = 'text';

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch (_) {
    return String(iso);
  }
};

const ProfanityWords = () => {
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

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | active | inactive
  const searchTimer = useRef(null);

  const [newWord, setNewWord] = useState('');
  const [creating, setCreating] = useState(false);

  const bulkModal = useDisclosure();
  const [bulkText, setBulkText] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getBlacklistStats();
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
        scope: SCOPE,
        type: TYPE,
        limit: 20,
        page,
        sortBy: 'createdAt:desc',
      };
      if (search.trim()) params.query = search.trim();
      if (activeFilter === 'active') params.isActive = 'true';
      if (activeFilter === 'inactive') params.isActive = 'false';

      const res = await getBlacklists(params);
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
  }, [page, search, activeFilter, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onSearchChange = (val) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 350);
  };

  const handleCreate = async () => {
    const value = newWord.trim().toLowerCase();
    if (!value) return;
    setCreating(true);
    try {
      await createBlacklist({scope: SCOPE, type: TYPE, value, isActive: true});
      toast({title: 'Kelime eklendi', description: value, status: 'success'});
      setNewWord('');
      setPage(1);
      await Promise.all([fetchItems(), fetchStats()]);
    } catch (e) {
      toast({
        title: 'Eklenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await updateBlacklist(item.id, {
        scope: item.scope,
        type: item.type,
        value: item.value,
        isActive: !item.isActive,
      });
      await Promise.all([fetchItems(), fetchStats()]);
    } catch (e) {
      toast({
        title: 'Güncellenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.value}" silinsin mi?`)) return;
    try {
      await deleteBlacklist(item.id);
      toast({title: 'Silindi', status: 'success'});
      await Promise.all([fetchItems(), fetchStats()]);
    } catch (e) {
      toast({
        title: 'Silinemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    }
  };

  const handleBulkSubmit = async () => {
    const lines = bulkText
      .split(/[\n,;]+/)
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean);
    if (lines.length === 0) {
      toast({title: 'Boş liste', status: 'warning'});
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await bulkCreateBlacklist({
        scope: SCOPE,
        type: TYPE,
        values: lines,
      });
      toast({
        title: 'Toplu ekleme tamamlandı',
        description: `${res.data.createdCount} eklendi, ${res.data.skippedCount} mevcut, ${res.data.errorCount} hata`,
        status: 'success',
        duration: 6000,
      });
      setBulkText('');
      bulkModal.onClose();
      setPage(1);
      await Promise.all([fetchItems(), fetchStats()]);
    } catch (e) {
      toast({
        title: 'Toplu ekleme başarısız',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <Page title="Yasaklı Kelimeler" subtitle="İçerik moderasyonu için yasaklı kelime yönetimi">
      {/* Stats */}
      <SimpleGrid columns={{base: 1, md: 3}} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Toplam Kelime</StatLabel>
              <StatNumber>{statsLoading ? <Spinner size="sm" /> : stats?.total ?? '-'}</StatNumber>
              <StatHelpText>Veritabanındaki tüm yasaklı kelimeler</StatHelpText>
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
              <StatHelpText>Şu anda filtrelenen kelime sayısı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Pasif</StatLabel>
              <StatNumber color="gray.500">
                {statsLoading ? <Spinner size="sm" /> : stats?.inactive ?? '-'}
              </StatNumber>
              <StatHelpText>Geçici olarak devre dışı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Add + Bulk */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={6}>
        <CardHeader pb={2}>
          <Flex align="center" gap={2}>
            <FiShield />
            <Heading size="sm">Kelime Ekle</Heading>
          </Flex>
        </CardHeader>
        <CardBody pt={2}>
          <HStack spacing={3} align="end" wrap="wrap">
            <FormControl flex="1" minW="240px">
              <FormLabel fontSize="sm">Tek Kelime</FormLabel>
              <Input
                placeholder="örn. küfür"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
            </FormControl>
            <Button
              colorScheme="blue"
              leftIcon={<FiPlus />}
              onClick={handleCreate}
              isLoading={creating}
              isDisabled={!newWord.trim()}
            >
              Ekle
            </Button>
            <Button
              variant="outline"
              leftIcon={<FiUpload />}
              onClick={bulkModal.onOpen}
            >
              Toplu Ekle
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* List */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Flex align="center" justify="space-between" gap={3} wrap="wrap">
            <Heading size="sm">Kelime Listesi ({totalResults})</Heading>
            <HStack spacing={2} wrap="wrap">
              <InputGroup size="sm" maxW="240px">
                <InputLeftElement pointerEvents="none">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  placeholder="Ara..."
                  defaultValue={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </InputGroup>
              <HStack spacing={1}>
                {['all', 'active', 'inactive'].map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={activeFilter === f ? 'solid' : 'outline'}
                    onClick={() => {
                      setPage(1);
                      setActiveFilter(f);
                    }}
                  >
                    {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}
                  </Button>
                ))}
              </HStack>
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
            <VStack align="stretch" spacing={0} divider={<Divider />}>
              {items.map((item) => (
                <Flex
                  key={item.id}
                  justify="space-between"
                  align="center"
                  py={2}
                  gap={3}
                  wrap="wrap"
                >
                  <HStack spacing={3} flex="1" minW="200px">
                    <Tag size="md" colorScheme={item.isActive ? 'red' : 'gray'}>
                      <TagLabel fontFamily="mono">{item.value}</TagLabel>
                    </Tag>
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(item.createdAt)}
                    </Text>
                    {item.resource && (
                      <Badge variant="subtle">{item.resource}</Badge>
                    )}
                  </HStack>
                  <HStack spacing={2}>
                    <HStack>
                      <Text fontSize="xs" color="gray.500">
                        {item.isActive ? 'Aktif' : 'Pasif'}
                      </Text>
                      <Switch
                        size="sm"
                        isChecked={item.isActive}
                        onChange={() => handleToggleActive(item)}
                      />
                    </HStack>
                    <IconButton
                      size="sm"
                      aria-label="Sil"
                      icon={<FiTrash2 />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(item)}
                    />
                  </HStack>
                </Flex>
              ))}
            </VStack>
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

      {/* Bulk modal */}
      <Modal isOpen={bulkModal.isOpen} onClose={bulkModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Toplu Kelime Ekle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Her satıra bir kelime yazın. Virgül veya noktalı virgül de
              ayraç olarak kullanılabilir. Var olan kelimeler atlanır.
            </Text>
            <Textarea
              rows={10}
              placeholder={'kelime1\nkelime2\nkelime3'}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              fontFamily="mono"
            />
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={bulkModal.onClose}>
              İptal
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FiUpload />}
              onClick={handleBulkSubmit}
              isLoading={bulkSubmitting}
              isDisabled={!bulkText.trim()}
            >
              Ekle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default ProfanityWords;
