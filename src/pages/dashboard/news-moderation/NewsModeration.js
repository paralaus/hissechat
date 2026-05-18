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
  VStack,
  Heading,
  Input,
  IconButton,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tag,
  Link,
} from '@chakra-ui/react';
import {FiRefreshCw, FiTrash2, FiExternalLink, FiSearch} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import {
  getNewsAdminStats,
  getNewsAdminList,
  deleteAdminNews,
  getAdminBookmarks,
  deleteAdminBookmark,
} from '../../../api/api';

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch (_) {
    return String(iso);
  }
};

const truncate = (s, n = 80) => {
  if (!s) return '';
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

const NewsModeration = () => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // News tab
  const [news, setNews] = useState({results: [], page: 1, totalPages: 1, totalResults: 0});
  const [newsLoading, setNewsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [newsPage, setNewsPage] = useState(1);

  // Bookmarks tab
  const [bookmarks, setBookmarks] = useState({results: [], page: 1, totalPages: 1, totalResults: 0});
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksPage, setBookmarksPage] = useState(1);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getNewsAdminStats();
      setStats(res.data);
    } catch (e) {
      toast({
        title: 'İstatistikler alınamadı',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await getNewsAdminList({
        search: search || undefined,
        page: newsPage,
        limit: 20,
      });
      setNews(res.data);
    } catch (e) {
      toast({
        title: 'Haberler yüklenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setNewsLoading(false);
    }
  }, [search, newsPage, toast]);

  const fetchBookmarks = useCallback(async () => {
    setBookmarksLoading(true);
    try {
      const res = await getAdminBookmarks({page: bookmarksPage, limit: 25});
      setBookmarks(res.data);
    } catch (e) {
      toast({
        title: 'Bookmark\'lar yüklenemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    } finally {
      setBookmarksLoading(false);
    }
  }, [bookmarksPage, toast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchNews(); }, [fetchNews]);
  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleDeleteNews = async (newsId, title) => {
    if (!window.confirm(`"${truncate(title, 60)}" haberini silmek istiyor musunuz? Bu işlem haberin tüm bookmark'larını da kaldıracak.`)) return;
    try {
      const res = await deleteAdminNews(newsId);
      toast({
        title: 'Haber silindi',
        description: `${res.data.removedBookmarks || 0} bookmark da kaldırıldı`,
        status: 'success',
      });
      fetchNews();
      fetchStats();
    } catch (e) {
      toast({
        title: 'Silinemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!window.confirm('Bu bookmark silinsin mi?')) return;
    try {
      await deleteAdminBookmark(bookmarkId);
      toast({title: 'Bookmark silindi', status: 'success'});
      fetchBookmarks();
      fetchStats();
    } catch (e) {
      toast({
        title: 'Silinemedi',
        description: e?.response?.data?.message || e.message,
        status: 'error',
      });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setNewsPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <Page title="Haber Moderasyonu" subtitle="Haber ve yer imi yönetimi">
      {/* Stats */}
      <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Toplam Haber</StatLabel>
              <StatNumber>{statsLoading ? <Spinner size="sm" /> : (stats?.totalNews ?? 0)}</StatNumber>
              <StatHelpText>Cache'de bekleyen (30 gün TTL)</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Son 24 Saat</StatLabel>
              <StatNumber>{statsLoading ? <Spinner size="sm" /> : (stats?.last24hNews ?? 0)}</StatNumber>
              <StatHelpText>Yeni haber girişi</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Toplam Bookmark</StatLabel>
              <StatNumber>{statsLoading ? <Spinner size="sm" /> : (stats?.totalBookmarks ?? 0)}</StatNumber>
              <StatHelpText>Kullanıcı yer imi kaydı</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Stat>
              <StatLabel>Aktif Kullanıcı</StatLabel>
              <StatNumber>{statsLoading ? <Spinner size="sm" /> : (stats?.distinctUsers ?? 0)}</StatNumber>
              <StatHelpText>En az 1 bookmark sahibi</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Provider breakdown + top news */}
      <SimpleGrid columns={{base: 1, lg: 2}} spacing={4} mb={6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="sm">Sağlayıcılar</Heading>
          </CardHeader>
          <CardBody pt={2}>
            {statsLoading ? <Spinner size="sm" /> : (
              <VStack align="stretch" spacing={2}>
                {(stats?.providers || []).length === 0 && (
                  <Text color="gray.500">Veri yok.</Text>
                )}
                {(stats?.providers || []).map((p) => (
                  <Flex key={p._id || 'unknown'} justify="space-between">
                    <Tag colorScheme="blue">{p._id || 'unknown'}</Tag>
                    <Text fontWeight="medium">{p.count}</Text>
                  </Flex>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="sm">En Çok Kaydedilen 10 Haber</Heading>
          </CardHeader>
          <CardBody pt={2}>
            {statsLoading ? <Spinner size="sm" /> : (
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Başlık</Th>
                      <Th>Kaynak</Th>
                      <Th isNumeric>Bookmark</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(stats?.topNews || []).length === 0 && (
                      <Tr><Td colSpan={3}><Text color="gray.500">Veri yok.</Text></Td></Tr>
                    )}
                    {(stats?.topNews || []).map((n) => (
                      <Tr key={String(n.newsId)}>
                        <Td><Text fontSize="sm">{truncate(n.title, 60)}</Text></Td>
                        <Td><Tag size="sm">{n.source || '-'}</Tag></Td>
                        <Td isNumeric fontWeight="bold">{n.count}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Tabs: News / Bookmarks */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>Haberler</Tab>
              <Tab>Yer İmleri</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Flex as="form" onSubmit={handleSearchSubmit} gap={2} mb={3} align="center" wrap="wrap">
                  <Input
                    placeholder="Başlıkta ara..."
                    size="sm"
                    maxW="320px"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button size="sm" leftIcon={<FiSearch />} type="submit">Ara</Button>
                  <Button
                    size="sm"
                    leftIcon={<FiRefreshCw />}
                    variant="outline"
                    onClick={() => {
                      setSearchInput('');
                      setSearch('');
                      setNewsPage(1);
                      fetchNews();
                    }}
                  >Sıfırla</Button>
                  <Text fontSize="sm" color="gray.500" ml="auto">
                    {news.totalResults || 0} kayıt
                  </Text>
                </Flex>

                {newsLoading ? (
                  <Flex justify="center" py={10}><Spinner /></Flex>
                ) : (
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Tarih</Th>
                          <Th>Başlık</Th>
                          <Th>Kaynak</Th>
                          <Th>Sağlayıcı</Th>
                          <Th isNumeric>Bookmark</Th>
                          <Th>Bağlantı</Th>
                          <Th>İşlem</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {news.results.length === 0 && (
                          <Tr><Td colSpan={7}><Text color="gray.500" textAlign="center">Haber bulunamadı.</Text></Td></Tr>
                        )}
                        {news.results.map((n) => (
                          <Tr key={n.id || n._id}>
                            <Td fontSize="xs" whiteSpace="nowrap">{formatDate(n.published)}</Td>
                            <Td><Text fontSize="sm">{truncate(n.title, 80)}</Text></Td>
                            <Td><Tag size="sm">{n.source || '-'}</Tag></Td>
                            <Td><Tag size="sm" colorScheme="purple">{n.provider || '-'}</Tag></Td>
                            <Td isNumeric>
                              {n.bookmarkCount > 0 ? (
                                <Badge colorScheme="blue">{n.bookmarkCount}</Badge>
                              ) : (
                                <Text fontSize="xs" color="gray.500">0</Text>
                              )}
                            </Td>
                            <Td>
                              {n.originalLink && (
                                <Link href={n.originalLink} isExternal>
                                  <IconButton aria-label="Aç" size="xs" icon={<FiExternalLink />} variant="ghost" />
                                </Link>
                              )}
                            </Td>
                            <Td>
                              <IconButton
                                aria-label="Sil"
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                icon={<FiTrash2 />}
                                onClick={() => handleDeleteNews(n.id || n._id, n.title)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                <Flex justify="center" mt={4} gap={2} align="center">
                  <Button size="sm" onClick={() => setNewsPage((p) => Math.max(1, p - 1))} isDisabled={newsPage <= 1}>‹ Önceki</Button>
                  <Text fontSize="sm">Sayfa {news.page || newsPage} / {news.totalPages || 1}</Text>
                  <Button size="sm" onClick={() => setNewsPage((p) => p + 1)} isDisabled={newsPage >= (news.totalPages || 1)}>Sonraki ›</Button>
                </Flex>
              </TabPanel>

              <TabPanel px={0}>
                <Flex gap={2} mb={3} align="center">
                  <Button size="sm" leftIcon={<FiRefreshCw />} variant="outline" onClick={fetchBookmarks}>Yenile</Button>
                  <Text fontSize="sm" color="gray.500" ml="auto">
                    {bookmarks.totalResults || 0} kayıt
                  </Text>
                </Flex>

                {bookmarksLoading ? (
                  <Flex justify="center" py={10}><Spinner /></Flex>
                ) : (
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Tarih</Th>
                          <Th>Kullanıcı</Th>
                          <Th>Haber</Th>
                          <Th>Kaynak</Th>
                          <Th>İşlem</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {bookmarks.results.length === 0 && (
                          <Tr><Td colSpan={5}><Text color="gray.500" textAlign="center">Bookmark bulunamadı.</Text></Td></Tr>
                        )}
                        {bookmarks.results.map((b) => (
                          <Tr key={b.id || b._id}>
                            <Td fontSize="xs" whiteSpace="nowrap">{formatDate(b.createdAt)}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {b.user?.username || b.user?.email || '(silinmiş)'}
                                </Text>
                                {b.user?.email && (
                                  <Text fontSize="xs" color="gray.500">{b.user.email}</Text>
                                )}
                              </VStack>
                            </Td>
                            <Td><Text fontSize="sm">{truncate(b.news?.title, 70) || '(silinmiş)'}</Text></Td>
                            <Td>{b.news?.source ? <Tag size="sm">{b.news.source}</Tag> : '-'}</Td>
                            <Td>
                              <IconButton
                                aria-label="Sil"
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                icon={<FiTrash2 />}
                                onClick={() => handleDeleteBookmark(b.id || b._id)}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}

                <Flex justify="center" mt={4} gap={2} align="center">
                  <Button size="sm" onClick={() => setBookmarksPage((p) => Math.max(1, p - 1))} isDisabled={bookmarksPage <= 1}>‹ Önceki</Button>
                  <Text fontSize="sm">Sayfa {bookmarks.page || bookmarksPage} / {bookmarks.totalPages || 1}</Text>
                  <Button size="sm" onClick={() => setBookmarksPage((p) => p + 1)} isDisabled={bookmarksPage >= (bookmarks.totalPages || 1)}>Sonraki ›</Button>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Page>
  );
};

export default NewsModeration;
