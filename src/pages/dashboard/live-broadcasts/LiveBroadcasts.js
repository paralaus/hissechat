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
import {FiRefreshCw, FiTrash2, FiSearch, FiXCircle, FiVideo, FiUsers} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getBroadcastAdminStats,
  getBroadcastAdminList,
  forceEndBroadcast,
  deleteBroadcast,
} from '../../../api/api';

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch (_) {
    return String(iso);
  }
};

const durationOf = (c) => {
  if (!c?.startTime) return '-';
  const start = new Date(c.startTime).getTime();
  const end = c.endedAt ? new Date(c.endedAt).getTime() : Date.now();
  const ms = Math.max(0, end - start);
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} dk`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}sa ${m}dk`;
};

const isBroadcast = (c) => c?.meta?.sessionType === 'broadcast';

const activeParticipantCount = (c) => {
  if (!Array.isArray(c?.participants)) return 0;
  return c.participants.filter((p) => !p.leftAt).length;
};

const LiveBroadcasts = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [list, setList] = useState({results: [], page: 1, totalPages: 1, totalResults: 0});
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [type, setType] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getBroadcastAdminStats();
      setStats(data);
    } catch (err) {
      toast({status: 'error', title: 'İstatistik alınamadı', description: err?.message || ''});
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const params = {page, limit: 20};
      if (type) params.type = type;
      if (activeFilter) params.isActive = activeFilter;
      if (search) params.search = search;
      const data = await getBroadcastAdminList(params);
      setList(data);
    } catch (err) {
      toast({status: 'error', title: 'Liste alınamadı', description: err?.message || ''});
    } finally {
      setListLoading(false);
    }
  }, [page, type, activeFilter, search, toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleForceEnd = async (roomId) => {
    if (!window.confirm('Bu yayını/konferansı zorla sonlandırmak istediğinize emin misiniz?')) return;
    try {
      await forceEndBroadcast(roomId);
      toast({status: 'success', title: 'Sonlandırıldı'});
      loadStats();
      loadList();
    } catch (err) {
      toast({status: 'error', title: 'Sonlandırılamadı', description: err?.message || ''});
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await deleteBroadcast(id);
      toast({status: 'success', title: 'Silindi'});
      loadStats();
      loadList();
    } catch (err) {
      toast({status: 'error', title: 'Silinemedi', description: err?.message || ''});
    }
  };

  const renderStatCard = (label, value, helper) => (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardBody>
        <Stat>
          <StatLabel>{label}</StatLabel>
          <StatNumber>{statsLoading ? <Spinner size="sm" /> : value ?? 0}</StatNumber>
          {helper ? <Text fontSize="xs" color="gray.500">{helper}</Text> : null}
        </Stat>
      </CardBody>
    </Card>
  );

  return (
    <Page title="Canlı Yayınlar">
      <VStack align="stretch" spacing={4}>
        <Flex justify="space-between" align="center">
          <Heading size="md">Canlı Yayın & Konferans Yönetimi</Heading>
          <Button leftIcon={<FiRefreshCw />} onClick={() => { loadStats(); loadList(); }} size="sm">
            Yenile
          </Button>
        </Flex>

        <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={4}>
          {renderStatCard('Aktif Oturum', stats?.totalActive, `${stats?.activeBroadcasts ?? 0} yayın · ${stats?.activeConferences ?? 0} konferans`)}
          {renderStatCard('Planlı', stats?.totalScheduled)}
          {renderStatCard('Son 24 Saat', stats?.last24h, 'Oluşturulan oturum')}
          {renderStatCard('Aktif Katılımcı', stats?.activeParticipants, 'Şu an bağlı')}
        </SimpleGrid>

        {stats?.topHosts?.length ? (
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="sm">En Çok Yayın Açan Kullanıcılar</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <HStack spacing={2} flexWrap="wrap">
                {stats.topHosts.map((h, i) => (
                  <Tag key={i} size="md" colorScheme="purple">
                    {h.fullname || h.username || h.email || h.hostId} · {h.count}
                  </Tag>
                ))}
              </HStack>
            </CardBody>
          </Card>
        ) : null}

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <HStack spacing={3} flexWrap="wrap">
              <Select size="sm" maxW="200px" placeholder="Tüm türler" value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
                <option value="broadcast">Canlı Yayın</option>
                <option value="conference">Konferans</option>
              </Select>
              <Select size="sm" maxW="200px" placeholder="Tüm durumlar" value={activeFilter} onChange={(e) => { setPage(1); setActiveFilter(e.target.value); }}>
                <option value="true">Aktif</option>
                <option value="false">Bitmiş</option>
              </Select>
              <Input
                size="sm"
                maxW="280px"
                placeholder="Başlık ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    setSearch(searchInput.trim());
                  }
                }}
              />
              <IconButton
                size="sm"
                icon={<FiSearch />}
                aria-label="Ara"
                onClick={() => { setPage(1); setSearch(searchInput.trim()); }}
              />
              {(type || activeFilter || search) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setType('');
                    setActiveFilter('');
                    setSearch('');
                    setSearchInput('');
                    setPage(1);
                  }}>
                  Temizle
                </Button>
              )}
            </HStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            {listLoading ? (
              <Flex justify="center" py={8}><Spinner /></Flex>
            ) : (
              <>
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Tür</Th>
                        <Th>Başlık</Th>
                        <Th>Kanal</Th>
                        <Th>Host</Th>
                        <Th>Başlangıç</Th>
                        <Th>Süre</Th>
                        <Th isNumeric>Katılımcı</Th>
                        <Th>Durum</Th>
                        <Th textAlign="right">İşlem</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {list.results.length === 0 ? (
                        <Tr><Td colSpan={9}><Text color="gray.500" textAlign="center" py={4}>Kayıt yok</Text></Td></Tr>
                      ) : list.results.map((c) => (
                        <Tr key={c.id || c._id}>
                          <Td>
                            <Badge colorScheme={isBroadcast(c) ? 'red' : 'blue'}>
                              {isBroadcast(c) ? 'Yayın' : 'Konferans'}
                            </Badge>
                          </Td>
                          <Td maxW="240px" whiteSpace="normal">{c.title || '-'}</Td>
                          <Td>{c.channelId?.name || c.channelId?.title || '-'}</Td>
                          <Td>{c.host?.fullname || c.host?.username || c.host?.email || '-'}</Td>
                          <Td>{formatDate(c.startTime)}</Td>
                          <Td>{durationOf(c)}</Td>
                          <Td isNumeric>
                            <HStack justify="flex-end" spacing={1}>
                              <FiUsers />
                              <Text>{activeParticipantCount(c)}/{c.participants?.length || 0}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            {c.isActive ? (
                              <Badge colorScheme="green">Aktif</Badge>
                            ) : c.isScheduled ? (
                              <Badge colorScheme="orange">Planlı</Badge>
                            ) : (
                              <Badge colorScheme="gray">Bitti</Badge>
                            )}
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              {c.isActive && (
                                <IconButton
                                  size="xs"
                                  icon={<FiXCircle />}
                                  colorScheme="orange"
                                  aria-label="Sonlandır"
                                  title="Zorla sonlandır"
                                  onClick={() => handleForceEnd(c.roomId)}
                                />
                              )}
                              <IconButton
                                size="xs"
                                icon={<FiTrash2 />}
                                colorScheme="red"
                                aria-label="Sil"
                                title="Kaydı sil"
                                onClick={() => handleDelete(c.id || c._id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                <Flex justify="space-between" align="center" mt={4}>
                  <Text fontSize="sm" color="gray.500">
                    Toplam: {list.totalResults || 0} · Sayfa {list.page || 1}/{list.totalPages || 1}
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      isDisabled={(list.page || 1) <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Önceki
                    </Button>
                    <Button
                      size="sm"
                      isDisabled={(list.page || 1) >= (list.totalPages || 1)}
                      onClick={() => setPage((p) => p + 1)}>
                      Sonraki
                    </Button>
                  </HStack>
                </Flex>
              </>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Page>
  );
};

export default LiveBroadcasts;
