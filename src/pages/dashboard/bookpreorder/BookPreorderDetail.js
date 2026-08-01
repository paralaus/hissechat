import React, {useRef} from 'react';
import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Spinner,
  Center,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';
import {api} from '../../../api';
import {routes} from '../../../config/routes';
import {getErrorMessage} from '../../../utils/string';
import useDisclosure from '../../../hooks/useDisclosure';
import {Page as Layout, ReadOnlyInfo} from '../../../components';
import {formatDate} from '../../../utils/date';

const BookPreorderDetail = () => {
  const {id} = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();

  const {data, isLoading} = useQuery({
    queryKey: ['book-preorder', id],
    queryFn: () => api.getBookPreorder(id).then(res => res.data),
  });

  const {mutateAsync: deleteBookPreorder, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteBookPreorder(id),
  });

  const onDelete = async () => {
    try {
      await deleteBookPreorder();
      toast({title: 'Başarıyla silindi.', status: 'success', position: 'top'});
      navigate(routes.bookPreorders.path);
    } catch (error) {
      toast({title: getErrorMessage(error), status: 'error', position: 'top'});
    }
  };

  if (isLoading)
    return (
      <Center h="200px">
        <Spinner />
      </Center>
    );

  return (
    <Layout>
      <Box p={8} bg="white" borderRadius="lg" shadow="sm">
        <Heading size="md" mb={6}>
          Ön Talep Kaydı Detayı
        </Heading>

        <SimpleGrid columns={{base: 1, md: 3}} spacing={4} mb={6}>
          <ReadOnlyInfo label="Ad Soyad" value={data?.fullName} />
          <ReadOnlyInfo label="Telefon Numarası" value={data?.phone} />
          <ReadOnlyInfo label="E-posta" value={data?.email || '-'} />
        </SimpleGrid>

        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
          <ReadOnlyInfo
            label="İletişim Tercihi"
            value={(data?.contactPreferences || []).join(', ') || '-'}
          />
          <ReadOnlyInfo label="Kayıt Tarihi" value={formatDate(data?.createdAt)} />
        </SimpleGrid>

        <Box display="flex" justifyContent="end">
          <Button
            isLoading={isDeleting}
            colorScheme="red"
            type="button"
            onClick={deleteModal.open}
            fontSize="sm">
            Sil
          </Button>
        </Box>
      </Box>

      <AlertDialog
        closeOnOverlayClick
        closeOnEsc
        leastDestructiveRef={cancelRef}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Emin misiniz?
            </AlertDialogHeader>
            <AlertDialogBody>Silmek istediğinize emin misiniz?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteModal.close}>
                Vazgeç
              </Button>
              <Button
                colorScheme="red"
                onClick={onDelete}
                ml={3}
                isLoading={isDeleting}
                disabled={isDeleting}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};

export default BookPreorderDetail;
