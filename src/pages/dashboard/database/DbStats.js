import React, {useEffect, useState} from 'react';
import {
  Box,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Progress,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  Card,
  CardBody,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Alert,
  AlertIcon,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  HStack,
} from '@chakra-ui/react';
import {FiDownload} from 'react-icons/fi';
import Page from '../../../components/common/Page';
import axios from 'axios';

const DB_STATS_URL =
  process.env.REACT_APP_DB_STATS_URL ||
  `${process.env.REACT_APP_API_URL?.replace(/\/v1$/, '')}/v1/db-stats`;

const DbStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cleanup states
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedDays, setSelectedDays] = useState('30');
  const [cleaning, setCleaning] = useState(false);
  const {isOpen, onOpen, onClose} = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const theadBg = useColorModeValue('gray.50', 'gray.900');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${DB_STATS_URL}/`, {
        headers: {Accept: 'application/json'},
      });
      setData(response.data);
    } catch (err) {
      setError(
        'Veri sunucusuna bağlanılamadı. Lütfen sunucunun (port 3001) çalıştığından emin olun.',
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toMB = bytes => (bytes / (1024 * 1024)).toFixed(2);

  const SAFE_COLLECTIONS = [
    {id: 'notifications', label: 'Bildirimler (notifications)'},
    {id: 'logs', label: 'Loglar (logs)'},
    {id: 'system_logs', label: 'Sistem Logları (system_logs)'},
    {id: 'audit_logs', label: 'Denetim Logları (audit_logs)'},
    {id: 'activity_logs', label: 'Aktivite Logları (activity_logs)'},
    {id: 'otp_codes', label: 'OTP Kodları (otp_codes)'},
    {id: 'email_logs', label: 'Email Logları (email_logs)'},
    {id: 'sms_logs', label: 'SMS Logları (sms_logs)'},
    {
      id: 'archived_messages',
      label: 'Arşivlenmiş Mesajlar (archived_messages)',
    },
    {id: 'price_alerts', label: 'Fiyat Alarmları (price_alerts)'},
  ];

  const handleCleanup = async () => {
    if (!selectedCollection) return;

    setCleaning(true);
    try {
      const response = await axios.post(
        `${DB_STATS_URL}/cleanup`,
        {
          collection: selectedCollection,
          days: parseInt(selectedDays),
        },
        {
          headers: {'Content-Type': 'application/json'},
        },
      );

      toast({
        title: 'Başarılı',
        description: response.data.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      fetchData(); // Refresh stats
    } catch (err) {
      toast({
        title: 'Hata',
        description:
          err.response?.data?.error || 'Temizlik işlemi başarısız oldu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <Page title="Veritabanı İstatistikleri">
      <Stack spacing={6}>
        <Flex justify="space-between" align="center">
          <Heading size="md">MongoDB İstatistikleri</Heading>
          <HStack spacing={2}>
            <Button
              leftIcon={<Icon as={FiDownload} />}
              colorScheme="green"
              onClick={() => (window.location.href = `${DB_STATS_URL}/backup`)}>
              Veritabanını Yedekle
            </Button>
            <Button
              colorScheme="blue"
              onClick={fetchData}
              isLoading={loading}
              loadingText="Yükleniyor">
              Yenile
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {data && (
          <>
            {/* Cleanup Section */}
            <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Heading size="sm" mb={4}>
                  Veri Temizliği
                </Heading>
                <Text fontSize="sm" color="gray.500" mb={4}>
                  Sadece güvenli olarak işaretlenmiş, ilişkisel bütünlüğü
                  bozmayacak tablolar (loglar, bildirimler vb.) temizlenebilir.
                </Text>
                <SimpleGrid
                  columns={{base: 1, md: 3}}
                  spacing={4}
                  alignItems="end">
                  <FormControl>
                    <FormLabel>Koleksiyon</FormLabel>
                    <Select
                      placeholder="Seçiniz"
                      value={selectedCollection}
                      onChange={e => setSelectedCollection(e.target.value)}>
                      {SAFE_COLLECTIONS.map(col => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Zaman Aralığı</FormLabel>
                    <Select
                      value={selectedDays}
                      onChange={e => setSelectedDays(e.target.value)}>
                      <option value="7">7 Günden Eski</option>
                      <option value="30">30 Günden Eski</option>
                      <option value="90">3 Ay (90 Gün)dan Eski</option>
                      <option value="180">6 Ay (180 Gün)dan Eski</option>
                      <option value="365">1 Yıldan Eski</option>
                    </Select>
                  </FormControl>
                  <Button
                    colorScheme="red"
                    onClick={onOpen}
                    isDisabled={!selectedCollection}>
                    Temizle
                  </Button>
                </SimpleGrid>
              </CardBody>
            </Card>

            <SimpleGrid columns={{base: 1, md: 2, lg: 4}} spacing={5}>
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Toplam Depolama</StatLabel>
                    <StatNumber>
                      {toMB(data.summary.totalStorage)} MB
                    </StatNumber>
                    <StatHelpText>Disk Kullanımı</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Toplam Veri</StatLabel>
                    <StatNumber>{toMB(data.summary.totalData)} MB</StatNumber>
                    <StatHelpText>Sıkıştırmasız</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Index Boyutu</StatLabel>
                    <StatNumber>{toMB(data.summary.totalIndex)} MB</StatNumber>
                    <StatHelpText>İndeksler</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
              <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Koleksiyon Sayısı</StatLabel>
                    <StatNumber>{data.summary.collectionCount}</StatNumber>
                    <StatHelpText>Adet</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            <Card
              bg={bgColor}
              borderColor={borderColor}
              borderWidth="1px"
              overflow="hidden">
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg={theadBg}>
                    <Tr>
                      <Th>Koleksiyon</Th>
                      <Th isNumeric>Kayıt Sayısı</Th>
                      <Th>Depolama (Disk)</Th>
                      <Th isNumeric>Veri Boyutu</Th>
                      <Th isNumeric>Index Boyutu</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.collections.map(col => (
                      <Tr key={col.name}>
                        <Td fontWeight="medium">{col.name}</Td>
                        <Td isNumeric>{col.count.toLocaleString()}</Td>
                        <Td>
                          <Box width="100%">
                            <Flex align="center" mb={1}>
                              <Text fontSize="sm" fontWeight="bold" mr={2}>
                                {toMB(col.storageSize)} MB
                              </Text>
                              <Badge
                                colorScheme={
                                  col.storagePercent > 10 ? 'red' : 'green'
                                }>
                                %{col.storagePercent.toFixed(1)}
                              </Badge>
                            </Flex>
                            <Progress
                              value={col.storagePercent}
                              size="xs"
                              colorScheme={
                                col.storagePercent > 10 ? 'red' : 'green'
                              }
                              borderRadius="full"
                            />
                          </Box>
                        </Td>
                        <Td isNumeric>{toMB(col.size)} MB</Td>
                        <Td isNumeric>{toMB(col.totalIndexSize)} MB</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Card>
          </>
        )}

        {/* Confirmation Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Veri Silme Onayı</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Alert status="warning" mb={4}>
                <AlertIcon />
                Bu işlem geri alınamaz!
              </Alert>
              <Text>
                <b>
                  {
                    SAFE_COLLECTIONS.find(c => c.id === selectedCollection)
                      ?.label
                  }
                </b>{' '}
                koleksiyonundan
                <b> {selectedDays} günden eski</b> verileri silmek istediğinize
                emin misiniz?
              </Text>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                İptal
              </Button>
              <Button
                colorScheme="red"
                onClick={handleCleanup}
                isLoading={cleaning}>
                Evet, Sil
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Page>
  );
};

export default DbStats;
