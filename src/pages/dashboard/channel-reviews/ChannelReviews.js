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
} from '@chakra-ui/react';
import {FiRefreshCw, FiSearch, FiTrash2, FiStar} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getChannelReviewAdminStats,
  getChannelReviewAdminList,
  deleteChannelReviewAdmin,
  bulkDeleteChannelReviews,
} from '../../../api/api';

const formatDate = (val) => {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleString('tr-TR');
  } catch (_) {
    return String(val);
  }
};

const Stars = ({value}) => {
  const v = Number(value) || 0;
  return (
    <HStack spacing={0}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          color={i <= v ? '#F6AD55' : '#CBD5E0'}
          fill={i <= v ? '#F6AD55' : 'none'}
          size={14}
        />
      ))}
      <Text ml={2} fontSize="sm" fontWeight="semibold">
        {v}
      </Text>
    </HStack>
  );
};

const ChannelReviews = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const [rating, setRating] = useState('');
  const [hasComment, setHasComment] = useState('');
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState([]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const {data} = await getChannelReviewAdminStats();
      setStats(data);
    } catch (e) {
      toast({status: 'error', title: 'İstatistikler alınamadı'});
    } finally {
      setLoadingStats(false);
    }
  }, [toast]);

  const fetchList = useCallback(
    async (p = page) => {
      setLoadingList(true);
      try {
        const params = {page: p, limit: 20, sortBy: 'createdAt:desc'};
        if (rating) params.rating = rating;
        if (hasComment) params.hasComment = hasComment;
        if (search) params.search = search;
        const {data} = await getChannelReviewAdminList(params);
        setItems(data.results || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || p);
      } catch (e) {
        toast({status: 'error', title: 'Yorumlar alınamadı'});
      } finally {
        setLoadingList(false);
      }
    },
    [page, rating, hasComment, search, toast]
  );

  useEffect(() => {
    fetchStats();
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => fetchList(1);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteChannelReviewAdmin(id);
      toast({status: 'success', title: 'Yorum silindi'});
      fetchList(page);
      fetchStats();
    } catch (e) {
      toast({status: 'error', title: 'Silme başarısız'});
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`${selected.length} yorumu silmek istediğinize emin misiniz?`)) return;
    try {
      const {data} = await bulkDeleteChannelReviews(selected);
      toast({status: 'success', title: `${data.deleted || 0} yorum silindi`});
      setSelected([]);
      fetchList(page);
      fetchStats();
    } catch (e) {
      toast({status: 'error', title: 'Toplu silme başarısız'});
    }
  };

  const ratingCount = (r) => {
    if (!stats || !stats.byRating) return 0;
    const e = stats.byRating.find((x) => x._id === r);
    return e ? e.count : 0;
  };

  return (
    <Page title="Kanal Yorumları Moderasyonu">
      <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={4} mb={6}>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Toplam Yorum</StatLabel>
              <StatNumber>{stats?.total ?? '-'}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Ortalama Puan</StatLabel>
              <StatNumber>
                {stats?.averageRating ? stats.averageRating.toFixed(2) : '-'}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Son 7 Gün</StatLabel>
              <StatNumber>{stats?.last7d ?? '-'}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg}>
          <CardBody>
            <Stat>
              <StatLabel>Son 30 Gün</StatLabel>
              <StatNumber>{stats?.last30d ?? '-'}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{base: 1, lg: 3}} spacing={4} mb={6}>
        <Card bg={cardBg}>
          <CardHeader pb={2}>
            <Heading size="sm">Puan Dağılımı</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={1}>
              {[5, 4, 3, 2, 1].map((r) => (
                <Flex key={r} justify="space-between">
                  <HStack>
                    <Text fontSize="sm">{r} yıldız</Text>
                  </HStack>
                  <Badge>{ratingCount(r)}</Badge>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader pb={2}>
            <Heading size="sm">En İyi Kanallar</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={1}>
              {(stats?.topChannels || []).slice(0, 5).map((c, i) => (
                <Flex key={i} justify="space-between">
                  <Text fontSize="sm" noOfLines={1}>
                    {c.channel?.name || c._id}
                  </Text>
                  <Tag size="sm" colorScheme="green">
                    {(c.avg || 0).toFixed(2)} ({c.count})
                  </Tag>
                </Flex>
              ))}
              {(!stats?.topChannels || stats.topChannels.length === 0) && (
                <Text fontSize="sm" color="gray.500">
                  Veri yok
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader pb={2}>
            <Heading size="sm">En Düşük Puanlı Kanallar</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={1}>
              {(stats?.worstChannels || []).slice(0, 5).map((c, i) => (
                <Flex key={i} justify="space-between">
                  <Text fontSize="sm" noOfLines={1}>
                    {c.channel?.name || c._id}
                  </Text>
                  <Tag size="sm" colorScheme="red">
                    {(c.avg || 0).toFixed(2)} ({c.count})
                  </Tag>
                </Flex>
              ))}
              {(!stats?.worstChannels || stats.worstChannels.length === 0) && (
                <Text fontSize="sm" color="gray.500">
                  Veri yok
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={cardBg} mb={4}>
        <CardBody>
          <Flex gap={3} wrap="wrap" align="end">
            <VStack align="start" spacing={1} flex="1" minW="180px">
              <Text fontSize="xs" color="gray.500">
                Puan
              </Text>
              <Select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Tümü"
                size="sm">
                <option value="5">5 Yıldız</option>
                <option value="4">4 Yıldız</option>
                <option value="3">3 Yıldız</option>
                <option value="2">2 Yıldız</option>
                <option value="1">1 Yıldız</option>
              </Select>
            </VStack>
            <VStack align="start" spacing={1} flex="1" minW="180px">
              <Text fontSize="xs" color="gray.500">
                Yorum
              </Text>
              <Select
                value={hasComment}
                onChange={(e) => setHasComment(e.target.value)}
                placeholder="Tümü"
                size="sm">
                <option value="true">Sadece yorumlu</option>
              </Select>
            </VStack>
            <VStack align="start" spacing={1} flex="2" minW="240px">
              <Text fontSize="xs" color="gray.500">
                Ara (yorum, kullanıcı, ID)
              </Text>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ara..."
                size="sm"
              />
            </VStack>
            <Button leftIcon={<FiSearch />} colorScheme="blue" onClick={handleSearch} size="sm">
              Ara
            </Button>
            <IconButton
              icon={<FiRefreshCw />}
              onClick={() => {
                fetchList(page);
                fetchStats();
              }}
              aria-label="Yenile"
              size="sm"
            />
            {selected.length > 0 && (
              <Button
                leftIcon={<FiTrash2 />}
                colorScheme="red"
                size="sm"
                onClick={handleBulkDelete}>
                Seçilenleri Sil ({selected.length})
              </Button>
            )}
          </Flex>
        </CardBody>
      </Card>

      <Card bg={cardBg}>
        <CardBody>
          {loadingList ? (
            <Flex justify="center" p={8}>
              <Spinner />
            </Flex>
          ) : (
            <TableContainer>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th width="40px"></Th>
                    <Th>Kanal</Th>
                    <Th>Kullanıcı</Th>
                    <Th>Puan</Th>
                    <Th>Yorum</Th>
                    <Th>Tarih</Th>
                    <Th width="80px">İşlem</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((r) => {
                    const id = r.id || r._id;
                    return (
                      <Tr key={id}>
                        <Td>
                          <input
                            type="checkbox"
                            checked={selected.includes(id)}
                            onChange={() => toggleSelect(id)}
                          />
                        </Td>
                        <Td>
                          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                            {r.channel?.name || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">{r.user?.name || '-'}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {r.user?.email || ''}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Stars value={r.rating} />
                        </Td>
                        <Td maxW="320px">
                          <Text fontSize="sm" noOfLines={2}>
                            {r.comment || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs">{formatDate(r.createdAt)}</Text>
                        </Td>
                        <Td>
                          <IconButton
                            icon={<FiTrash2 />}
                            size="xs"
                            colorScheme="red"
                            aria-label="Sil"
                            onClick={() => handleDelete(id)}
                          />
                        </Td>
                      </Tr>
                    );
                  })}
                  {items.length === 0 && (
                    <Tr>
                      <Td colSpan={7}>
                        <Text textAlign="center" color="gray.500" py={4}>
                          Yorum bulunamadı
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          <Flex justify="space-between" align="center" mt={4}>
            <Text fontSize="sm" color="gray.500">
              Sayfa {page} / {totalPages}
            </Text>
            <HStack>
              <Button
                size="sm"
                onClick={() => fetchList(page - 1)}
                isDisabled={page <= 1 || loadingList}>
                Önceki
              </Button>
              <Button
                size="sm"
                onClick={() => fetchList(page + 1)}
                isDisabled={page >= totalPages || loadingList}>
                Sonraki
              </Button>
            </HStack>
          </Flex>
        </CardBody>
      </Card>
    </Page>
  );
};

export default ChannelReviews;
