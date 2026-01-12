import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  IconButton,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useClipboard,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Progress,
  Icon,
} from '@chakra-ui/react';
import { FiCopy, FiDownload, FiSearch, FiRefreshCw, FiSmartphone, FiUpload } from 'react-icons/fi';
import { FaApple, FaAndroid } from 'react-icons/fa';
import { Page } from '../../../components';
import { api } from '../../../api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const AppDistribution = () => {
  const [loading, setLoading] = useState(true);
  const [testers, setTesters] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [chunkSize, setChunkSize] = useState('500');
  const [debouncedChunkSize, setDebouncedChunkSize] = useState('500');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const toast = useToast();
  
  // Upload modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFile, setSelectedFile] = useState(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const fetchTesters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getTesters(
        selectedPlatform,
        parseInt(debouncedChunkSize, 10) || undefined
      );
      setTesters(response.data);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Testerlar yüklenirken bir hata oluştu',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform, debouncedChunkSize, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChunkSize(chunkSize);
    }, 400);
    return () => clearTimeout(timer);
  }, [chunkSize]);

  useEffect(() => {
    fetchTesters();
  }, [fetchTesters]);

  const filteredUsers = useMemo(() => {
    if (!testers?.users) return [];
    const term = searchTerm.toLowerCase();
    if (!term) return testers.users;
    return testers.users.filter((user) => {
      return (
        user.email?.toLowerCase().includes(term) ||
        user.fullname?.toLowerCase().includes(term)
      );
    });
  }, [testers, searchTerm]);

  useEffect(() => {
    setPageIndex(0);
  }, [selectedPlatform, searchTerm]);

  const getEmailsForCopy = useCallback(
    (platform) => {
      if (!testers) return '';
      if (platform === 'ios') return testers.ios?.emails?.join(', ') || '';
      if (platform === 'android') return testers.android?.emails?.join(', ') || '';
      return [
        ...(testers.ios?.emails || []),
        ...(testers.android?.emails || []),
      ].join(', ');
    },
    [testers]
  );

  const { hasCopied: hasCopiedIos, onCopy: onCopyIos } = useClipboard(getEmailsForCopy('ios'));
  const { hasCopied: hasCopiedAndroid, onCopy: onCopyAndroid } = useClipboard(getEmailsForCopy('android'));
  const { hasCopied: hasCopiedAll, onCopy: onCopyAll } = useClipboard(getEmailsForCopy('all'));

  const exportToCSV = () => {
    if (!testers?.users) return;
    
    // TestFlight CSV format: First Name, Last Name, Email
    const headers = ['First Name', 'Last Name', 'Email'];
    const rows = testers.users.map(u => {
      const fullname = u.fullname || '';
      const nameParts = fullname.trim().split(' ');
      const firstName = nameParts[0] || 'Tester';
      const lastName = nameParts.slice(1).join(' ') || '-';
      return [firstName, lastName, u.email?.trim() || ''];
    });
    
    const maxRows = Math.max(1, parseInt(chunkSize, 10) || 5805);
    const totalRows = rows.length;
    const parts = Math.ceil(totalRows / maxRows);
    const dateStr = new Date().toISOString().split('T')[0];
    for (let i = 0; i < parts; i++) {
      const start = i * maxRows;
      const end = Math.min(start + maxRows, totalRows);
      const chunkRows = rows.slice(start, end);
      const csvContent = [
        headers.join(','),
        ...chunkRows.map(r => r.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `testers_${selectedPlatform}_${dateStr}_part${i + 1}_of_${parts}.csv`;
      link.click();
    }
    
    const description = parts > 1 
      ? `${totalRows} kullanıcı ${parts} dosyaya bölünerek indirildi`
      : `${totalRows} kullanıcı indirildi`;
    toast({
      title: 'Dışa Aktarıldı',
      description,
      status: 'success',
      duration: 2000,
    });
  };

  // Email validation regex
  const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Export for TestFlight (Apple's required format)
  const exportToTestFlightCSV = () => {
    if (!testers?.users) return;
    
    // Filter only iOS users with valid emails
    const iosUsers = testers.users.filter(u => u.platform === 'ios' && isValidEmail(u.email));
    const invalidCount = testers.users.filter(u => u.platform === 'ios' && !isValidEmail(u.email)).length;
    
    if (iosUsers.length === 0) {
      toast({
        title: 'iOS Kullanıcı Yok',
        description: 'iOS platformunda geçerli email ile kayıtlı kullanıcı bulunamadı',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    // TestFlight CSV format: First Name, Last Name, Email
    const headers = ['First Name', 'Last Name', 'Email'];
    const rows = iosUsers.map(u => {
      const fullname = u.fullname || '';
      const nameParts = fullname.trim().split(' ');
      const firstName = nameParts[0] || 'Tester';
      const lastName = nameParts.slice(1).join(' ') || '-';
      return [firstName, lastName, u.email.trim()];
    });
    
    const maxRows = Math.max(1, parseInt(chunkSize, 10) || 5805);
    const totalRows = rows.length;
    const parts = Math.ceil(totalRows / maxRows);
    const dateStr = new Date().toISOString().split('T')[0];
    for (let i = 0; i < parts; i++) {
      const start = i * maxRows;
      const end = Math.min(start + maxRows, totalRows);
      const chunkRows = rows.slice(start, end);
      const csvContent = [
        headers.join(','),
        ...chunkRows.map(r => r.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `testflight_testers_${dateStr}_part${i + 1}_of_${parts}.csv`;
      link.click();
    }
    const description = invalidCount > 0 
      ? `${iosUsers.length} iOS kullanıcısı ${parts} dosyaya bölünerek indirildi (${invalidCount} geçersiz email filtrelendi)`
      : `${iosUsers.length} iOS kullanıcısı ${parts} dosyaya bölünerek indirildi`;
    toast({
      title: 'TestFlight CSV İndirildi',
      description,
      status: 'success',
      duration: 4000,
    });
  };

  // File selection handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['ipa', 'apk', 'aab'].includes(ext)) {
        toast({
          title: 'Geçersiz Dosya',
          description: 'Sadece .ipa, .apk veya .aab dosyaları kabul edilir',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Upload and distribute
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const response = await api.distributeApp(
        selectedFile,
        releaseNotes,
        'testers',
        (progress) => setUploadProgress(progress)
      );

      setUploadResult({
        success: true,
        message: response.data.message,
        platform: response.data.platform,
      });

      toast({
        title: 'Başarılı!',
        description: `${response.data.platform.toUpperCase()} uygulaması dağıtıldı`,
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      setUploadResult({
        success: false,
        message: errorMessage,
      });

      toast({
        title: 'Hata',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset upload modal
  const resetUploadModal = () => {
    setSelectedFile(null);
    setReleaseNotes('');
    setUploadProgress(0);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    resetUploadModal();
    onClose();
  };

  // Get file icon based on extension
  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'ipa') return FaApple;
    if (ext === 'apk' || ext === 'aab') return FaAndroid;
    return FiSmartphone;
  };

  return (
    <Page title="Test Dağıtımı">
      <VStack spacing={6} align="stretch">
        {/* Upload Card */}
        <Card bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white">
          <CardBody>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="md">Uygulama Dağıtımı</Heading>
                <Text opacity={0.9}>IPA veya APK dosyasını yükleyip testerlara dağıtın</Text>
              </VStack>
              <Button
                leftIcon={<FiUpload />}
                colorScheme="whiteAlpha"
                size="lg"
                onClick={onOpen}
              >
                Dosya Yükle
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Header Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Toplam Tester</StatLabel>
                <StatNumber>{testers?.total || 0}</StatNumber>
                <StatHelpText>Tüm platformlar</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <FaApple size={20} />
                  <StatLabel>iOS</StatLabel>
                </HStack>
                <StatNumber color="gray.600">{testers?.ios?.count || 0}</StatNumber>
                <StatHelpText>
                  <Button size="xs" leftIcon={<FiCopy />} onClick={onCopyIos} variant="ghost">
                    {hasCopiedIos ? 'Kopyalandı!' : 'Emailleri Kopyala'}
                  </Button>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <HStack mb={2}>
                  <FaAndroid size={20} color="#3DDC84" />
                  <StatLabel>Android</StatLabel>
                </HStack>
                <StatNumber color="green.600">{testers?.android?.count || 0}</StatNumber>
                <StatHelpText>
                  <Button size="xs" leftIcon={<FiCopy />} onClick={onCopyAndroid} variant="ghost">
                    {hasCopiedAndroid ? 'Kopyalandı!' : 'Emailleri Kopyala'}
                  </Button>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Bilinmeyen Platform</StatLabel>
                <StatNumber color="orange.500">{testers?.other?.count || 0}</StatNumber>
                <StatHelpText>Platform belirtilmemiş</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Hızlı İşlemler</Heading>
          </CardHeader>
          <CardBody>
            <HStack mb={4} spacing={4} align="center">
              <FormControl maxW="260px">
                <FormLabel>Dosya başına kayıt</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(e.target.value)}
                  placeholder="Örn: 500"
                />
              </FormControl>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button
                leftIcon={<FiUpload />}
                colorScheme="purple"
                onClick={onOpen}
                size="lg"
              >
                Uygulama Yükle ve Dağıt
              </Button>
              <Button
                leftIcon={<FiDownload />}
                colorScheme="blue"
                onClick={exportToCSV}
                size="lg"
              >
                Tester Listesini İndir (CSV)
              </Button>
              <Button
                leftIcon={<FaApple />}
                colorScheme="gray"
                onClick={exportToTestFlightCSV}
                size="lg"
              >
                TestFlight CSV İndir
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Testers Table */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Tester Listesi</Heading>
              <HStack>
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <FiSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Email veya isim ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
                <Tooltip label="Yenile">
                  <IconButton
                    icon={<FiRefreshCw />}
                    onClick={fetchTesters}
                    isLoading={loading}
                    aria-label="Yenile"
                  />
                </Tooltip>
                <Button
                  size="sm"
                  leftIcon={<FiCopy />}
                  onClick={onCopyAll}
                  variant="outline"
                >
                  {hasCopiedAll ? 'Kopyalandı!' : 'Tümünü Kopyala'}
                </Button>
                <HStack ml={4} spacing={2}>
                  <Text fontSize="sm" color="gray.600">Sayfa Boyutu</Text>
                  <Input
                    type="number"
                    value={pageSize}
                    min={10}
                    max={500}
                    width="90px"
                    onChange={(e) => {
                      const v = parseInt(e.target.value || '50', 10);
                      setPageSize(Number.isFinite(v) ? Math.max(10, Math.min(500, v)) : 50);
                      setPageIndex(0);
                    }}
                  />
                </HStack>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <Tabs onChange={(index) => setSelectedPlatform(['all', 'ios', 'android'][index])}>
              <TabList>
                <Tab>
                  <HStack>
                    <FiSmartphone />
                    <Text>Tümü ({testers?.total || 0})</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <FaApple />
                    <Text>iOS ({testers?.ios?.count || 0})</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <FaAndroid color="#3DDC84" />
                    <Text>Android ({testers?.android?.count || 0})</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {['all', 'ios', 'android'].map((platform) => (
                  <TabPanel key={platform} px={0}>
                    {loading ? (
                      <Box textAlign="center" py={10}>
                        <Spinner size="xl" />
                      </Box>
                    ) : (
                      <Box overflowX="auto">
                        {(() => {
                          const platformFiltered = filteredUsers.filter(
                            (u) => platform === 'all' || u.platform === platform
                          );
                          const totalForPlatform = platformFiltered.length;
                          const totalPages = Math.max(1, Math.ceil(totalForPlatform / pageSize));
                          const safePageIndex = Math.min(pageIndex, totalPages - 1);
                          const start = safePageIndex * pageSize;
                          const end = Math.min(start + pageSize, totalForPlatform);
                          const displayedUsers = platformFiltered.slice(start, end);
                          return (
                            <>
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" color="gray.600">
                                  Toplam {totalForPlatform} kayıt • {safePageIndex + 1}/{totalPages}
                                </Text>
                                <HStack>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                                    isDisabled={safePageIndex <= 0}
                                  >
                                    Önceki
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                                    isDisabled={safePageIndex >= totalPages - 1}
                                  >
                                    Sonraki
                                  </Button>
                                </HStack>
                              </HStack>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Email</Th>
                                    <Th>Ad Soyad</Th>
                                    <Th>Platform</Th>
                                    <Th>Son Aktivite</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {displayedUsers.map((user, index) => (
                                    <Tr key={`${user.email}-${start + index}`}>
                                      <Td>{user.email}</Td>
                                      <Td>{user.fullname || '-'}</Td>
                                      <Td>
                                        <Badge
                                          colorScheme={
                                            user.platform === 'ios' ? 'gray' :
                                            user.platform === 'android' ? 'green' : 'orange'
                                          }
                                        >
                                          <HStack spacing={1}>
                                            {user.platform === 'ios' && <FaApple size={12} />}
                                            {user.platform === 'android' && <FaAndroid size={12} />}
                                            <Text>{user.platform || 'Bilinmiyor'}</Text>
                                          </HStack>
                                        </Badge>
                                      </Td>
                                      <Td>
                                        {user.lastActivity ? (
                                          <Tooltip label={new Date(user.lastActivity).toLocaleString('tr-TR')}>
                                            <Text fontSize="sm" color="gray.500">
                                              {formatDistanceToNow(new Date(user.lastActivity), { 
                                                addSuffix: true, 
                                                locale: tr 
                                              })}
                                            </Text>
                                          </Tooltip>
                                        ) : (
                                          <Text fontSize="sm" color="gray.400">-</Text>
                                        )}
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                              {platformFiltered.length === 0 && (
                                <Box textAlign="center" py={10}>
                                  <Text color="gray.500">Kullanıcı bulunamadı</Text>
                                </Box>
                              )}
                            </>
                          );
                        })()}
                      </Box>
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiUpload />
              <Text>Uygulama Yükle ve Dağıt</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* File Input */}
              <FormControl>
                <FormLabel>Uygulama Dosyası</FormLabel>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".ipa,.apk,.aab"
                  onChange={handleFileSelect}
                  p={1}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Desteklenen formatlar: .ipa (iOS), .apk/.aab (Android)
                </Text>
              </FormControl>

              {/* Selected File Info */}
              {selectedFile && (
                <Alert status="info" borderRadius="md">
                  <Icon as={getFileIcon(selectedFile.name)} mr={2} />
                  <Box>
                    <Text fontWeight="bold">{selectedFile.name}</Text>
                    <Text fontSize="sm">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Text>
                  </Box>
                </Alert>
              )}

              {/* Release Notes */}
              <FormControl>
                <FormLabel>Sürüm Notları (Opsiyonel)</FormLabel>
                <Textarea
                  placeholder="Bu sürümde yapılan değişiklikler..."
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={3}
                />
              </FormControl>

              {/* Upload Progress */}
              {uploading && (
                <Box>
                  <Text mb={2}>Yükleniyor... {uploadProgress}%</Text>
                  <Progress value={uploadProgress} colorScheme="purple" borderRadius="md" />
                </Box>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <Alert
                  status={uploadResult.success ? 'success' : 'error'}
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      {uploadResult.success ? 'Başarılı!' : 'Hata!'}
                    </AlertTitle>
                    <AlertDescription>
                      {uploadResult.message}
                      {uploadResult.platform && (
                        <Badge ml={2} colorScheme={uploadResult.platform === 'ios' ? 'gray' : 'green'}>
                          {uploadResult.platform.toUpperCase()}
                        </Badge>
                      )}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              İptal
            </Button>
            <Button
              colorScheme="purple"
              leftIcon={uploading ? <Spinner size="sm" /> : <FiUpload />}
              onClick={handleUpload}
              isDisabled={!selectedFile || uploading}
              isLoading={uploading}
              loadingText="Yükleniyor..."
            >
              Yükle ve Dağıt
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  );
};

export default AppDistribution;
