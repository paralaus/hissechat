import React, { useEffect, useState } from 'react';
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
  AlertIcon
} from '@chakra-ui/react';
import Page from '../../components/common/Page';
import axios from 'axios';

const DbStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Localhost:3001'deki geçici sunucudan veri çek
      const response = await axios.get('http://localhost:3001/', {
        headers: { 'Accept': 'application/json' }
      });
      setData(response.data);
    } catch (err) {
      setError('Veri sunucusuna bağlanılamadı. Lütfen sunucunun (port 3001) çalıştığından emin olun.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

  return (
    <Page title="Veritabanı İstatistikleri">
      <Stack spacing={6}>
        <Flex justify="space-between" align="center">
            <Heading size="md">MongoDB İstatistikleri</Heading>
            <Button 
                colorScheme="blue" 
                onClick={fetchData} 
                isLoading={loading}
                loadingText="Yükleniyor"
            >
                Yenile
            </Button>
        </Flex>

        {error && (
            <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
            </Alert>
        )}

        {data && (
            <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                    <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
                        <CardBody>
                            <Stat>
                                <StatLabel>Toplam Depolama</StatLabel>
                                <StatNumber>{toMB(data.summary.totalStorage)} MB</StatNumber>
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

                <Card bg={bgColor} borderColor={borderColor} borderWidth="1px" overflow="hidden">
                    <Box overflowX="auto">
                        <Table variant="simple">
                            <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                                <Tr>
                                    <Th>Koleksiyon</Th>
                                    <Th isNumeric>Kayıt Sayısı</Th>
                                    <Th>Depolama (Disk)</Th>
                                    <Th isNumeric>Veri Boyutu</Th>
                                    <Th isNumeric>Index Boyutu</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {data.collections.map((col) => (
                                    <Tr key={col.name}>
                                        <Td fontWeight="medium">{col.name}</Td>
                                        <Td isNumeric>{col.count.toLocaleString()}</Td>
                                        <Td>
                                            <Box width="100%">
                                                <Flex align="center" mb={1}>
                                                    <Text fontSize="sm" fontWeight="bold" mr={2}>
                                                        {toMB(col.storageSize)} MB
                                                    </Text>
                                                    <Badge colorScheme={col.storagePercent > 10 ? 'red' : 'green'}>
                                                        %{col.storagePercent.toFixed(1)}
                                                    </Badge>
                                                </Flex>
                                                <Progress 
                                                    value={col.storagePercent} 
                                                    size="xs" 
                                                    colorScheme={col.storagePercent > 10 ? 'red' : 'green'} 
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
      </Stack>
    </Page>
  );
};

export default DbStats;
