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
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { api } from '../../../api'; // Yolu kontrol edin

const VipApplications = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vipapplications'],
    queryFn: () => api.getVipApplications(),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteVipApplication,
    onSuccess: () => {
      queryClient.invalidateQueries(['vipapplications']);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <Center h="200px"><Spinner /></Center>;
  if (error) return <Box color="red.500">Veriler yüklenirken hata oluştu.</Box>;

  // API'den dönen verinin data.data içinde olduğunu varsayıyoruz (Axios + Backend yapınıza göre)
  // Güvenli veri çekimi: Dizi olup olmadığını kontrol ediyoruz
  let applications = [];
  if (Array.isArray(data?.data)) {
    applications = data.data;
  } else if (Array.isArray(data?.data?.data)) {
      // Bazen backend { data: [...] } döner, axios da bunu data içine koyar -> data.data.data olur
    applications = data.data.data;
  } else if (Array.isArray(data)) {
      // React Query select kullanılmadıysa ve direkt array dönüyorsa
      applications = data;
  }

  return (
    <Box p={8} bg="white" borderRadius="lg" shadow="sm">
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="md">VIP Başvuruları</Heading>
        <Button as={Link} to="/dashboard/vipapplications/new" colorScheme="blue" size="sm">
          Yeni Ekle
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Ad Soyad</Th>
              <Th>Telefon</Th>
              <Th>Takipçi</Th>
              <Th>Fiyat Beklentisi</Th>
              <Th>İçerik Türü</Th>
              <Th>Durum</Th>
              <Th>İşlemler</Th>
            </Tr>
          </Thead>
          <Tbody>
            {applications.length === 0 && (
              <Tr>
                <Td colSpan={7} textAlign="center">Henüz başvuru yok.</Td>
              </Tr>
            )}
            {applications.map((app) => (
              <Tr key={app._id || app.id}>
                <Td fontWeight="bold">{app.fullName}</Td>
                <Td>{app.phone}</Td>
                <Td>{app.followerCount}</Td>
                <Td>{app.subscriptionPriceExpectation} TL</Td>
                <Td>{app.contentType}</Td>
                <Td>
                  <Badge colorScheme={app.hasVipExperience ? 'green' : 'gray'}>
                    {app.hasVipExperience ? 'Deneyimli' : 'Yeni'}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    {/* Detay butonu eklenebilir */}
                    <IconButton
                      aria-label="Sil"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(app._id || app.id)}
                      isLoading={deleteMutation.isPending}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VipApplications;
