import React, {useState} from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  HStack,
  Spinner,
  Center,
  useToast,
  Text,
  Flex,
  Select,
} from '@chakra-ui/react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {FaTrash, FaLink, FaEye} from 'react-icons/fa';
import {api} from '../../../api';
import {routes} from '../../../config/routes';
import {Page as Layout} from '../../../components';
import {formatDate} from '../../../utils/date';

const PUBLIC_FORM_PATH = '/hissechat-tanisma-formu/';
const PUBLIC_RESULTS_PATH = '/hissechat-tanisma-sonuclari/';

const IntroFormSubmissions = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {data, isLoading, error} = useQuery({
    queryKey: ['intro-forms', page, limit],
    queryFn: () => api.getIntroForms({page, limit, sortBy: 'createdAt:desc'}),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteIntroForm,
    onSuccess: () => {
      queryClient.invalidateQueries(['intro-forms']);
    },
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
      toast({title: 'Başarıyla silindi.', status: 'success', position: 'top'});
    }
  };

  const copyToClipboard = link => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast({
          title: 'Link kopyalandı',
          description: link,
          status: 'success',
          duration: 4000,
          position: 'top',
        });
      })
      .catch(() => {
        toast({
          title: 'Link kopyalanamadı',
          description: link,
          status: 'warning',
          position: 'top',
        });
      });
  };

  const handleCopyLink = () =>
    copyToClipboard(`${window.location.origin}${PUBLIC_FORM_PATH}`);

  const handleCopyResultsLink = () =>
    copyToClipboard(`${window.location.origin}${PUBLIC_RESULTS_PATH}`);

  if (isLoading)
    return (
      <Center h="200px">
        <Spinner />
      </Center>
    );
  if (error) return <Box color="red.500">Veriler yüklenirken hata oluştu.</Box>;

  let submissions = [];
  if (Array.isArray(data?.data?.results)) {
    submissions = data.data.results;
  } else if (Array.isArray(data?.data)) {
    submissions = data.data;
  }

  const totalPages = data?.data?.totalPages || 1;
  const totalResults = data?.data?.totalResults ?? submissions.length;

  return (
    <Layout>
      <Box p={8} bg="white" borderRadius="lg" shadow="sm">
        <HStack justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
          <Heading size="md">HisseChat Tanışma Formu Kayıtları</Heading>
          <HStack>
            <Button
              leftIcon={<FaLink />}
              colorScheme="blue"
              size="sm"
              onClick={handleCopyLink}>
              Form Linkini Kopyala
            </Button>
            <Button
              leftIcon={<FaEye />}
              colorScheme="purple"
              size="sm"
              onClick={handleCopyResultsLink}>
              Sonuç Sayfası Linkini Kopyala
            </Button>
          </HStack>
        </HStack>
        <Text fontSize="sm" color="gray.500" mb={1}>
          Kullanıcılara gönderilecek link: {window.location.origin}
          {PUBLIC_FORM_PATH}
        </Text>
        <Text fontSize="sm" color="orange.500" mb={6}>
          Sonuç sayfası (giriş gerektirmez, herkese açıktır): {window.location.origin}
          {PUBLIC_RESULTS_PATH}
        </Text>

        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Ad Soyad</Th>
                <Th>Telefon</Th>
                <Th>Portföy Büyüklüğü</Th>
                <Th>BIST Yatırımı</Th>
                <Th>Tarih</Th>
                <Th>İşlemler</Th>
              </Tr>
            </Thead>
            <Tbody>
              {submissions.length === 0 && (
                <Tr>
                  <Td colSpan={6} textAlign="center">
                    Henüz kayıt yok.
                  </Td>
                </Tr>
              )}
              {submissions.map(item => (
                <Tr
                  key={item._id || item.id}
                  onClick={() =>
                    navigate(routes.introFormDetail.getPath(item._id || item.id))
                  }
                  cursor="pointer"
                  _hover={{bg: 'gray.50'}}>
                  <Td fontWeight="bold">{item.fullName}</Td>
                  <Td>{item.phone}</Td>
                  <Td>{item.portfolioSize}</Td>
                  <Td>
                    <Badge colorScheme={item.hasBistInvestment === 'Evet' ? 'green' : 'gray'}>
                      {item.hasBistInvestment}
                    </Badge>
                  </Td>
                  <Td>{formatDate(item.createdAt)}</Td>
                  <Td>
                    <IconButton
                      aria-label="Sil"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      onClick={e => handleDelete(e, item._id || item.id)}
                      isLoading={deleteMutation.isPending}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={3}>
          <HStack spacing={4}>
            <Text fontSize="sm" color="gray.500">
              Toplam {totalResults} sonuç
            </Text>
            <Select
              size="sm"
              w="auto"
              value={limit}
              onChange={e => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}>
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>
                  {size} / sayfa
                </option>
              ))}
            </Select>
          </HStack>

          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              isDisabled={page <= 1}>
              Önceki
            </Button>
            <Text fontSize="sm" color="gray.600">
              Sayfa {page} / {totalPages}
            </Text>
            <Button
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              isDisabled={page >= totalPages}>
              Sonraki
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Layout>
  );
};

export default IntroFormSubmissions;
