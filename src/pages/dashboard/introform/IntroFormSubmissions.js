import React from 'react';
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
} from '@chakra-ui/react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {FaTrash, FaLink} from 'react-icons/fa';
import {api} from '../../../api';
import {routes} from '../../../config/routes';
import {Page as Layout} from '../../../components';
import {formatDate} from '../../../utils/date';

const PUBLIC_FORM_PATH = '/hissechat-tanisma-formu/';

const IntroFormSubmissions = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const {data, isLoading, error} = useQuery({
    queryKey: ['intro-forms'],
    queryFn: () => api.getIntroForms(),
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

  const handleCopyLink = () => {
    const link = `${window.location.origin}${PUBLIC_FORM_PATH}`;
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

  return (
    <Layout>
      <Box p={8} bg="white" borderRadius="lg" shadow="sm">
        <HStack justifyContent="space-between" mb={2}>
          <Heading size="md">HisseChat Tanışma Formu Kayıtları</Heading>
          <Button
            leftIcon={<FaLink />}
            colorScheme="blue"
            size="sm"
            onClick={handleCopyLink}>
            Form Linkini Kopyala
          </Button>
        </HStack>
        <Text fontSize="sm" color="gray.500" mb={6}>
          Kullanıcılara gönderilecek link: {window.location.origin}
          {PUBLIC_FORM_PATH}
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
      </Box>
    </Layout>
  );
};

export default IntroFormSubmissions;
