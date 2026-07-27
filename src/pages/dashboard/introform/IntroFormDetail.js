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

const IntroFormDetail = () => {
  const {id} = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();

  const {data, isLoading} = useQuery({
    queryKey: ['intro-form', id],
    queryFn: () => api.getIntroForm(id).then(res => res.data),
  });

  const {mutateAsync: deleteIntroForm, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteIntroForm(id),
  });

  const onDelete = async () => {
    try {
      await deleteIntroForm();
      toast({title: 'Başarıyla silindi.', status: 'success', position: 'top'});
      navigate(routes.introForms.path);
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
          Tanışma Formu Detayı
        </Heading>

        <Heading size="sm" mb={4} color="gray.500">
          Kişisel Bilgiler
        </Heading>
        <SimpleGrid columns={{base: 1, md: 3}} spacing={4} mb={6}>
          <ReadOnlyInfo label="Ad Soyad" value={data?.fullName} />
          <ReadOnlyInfo label="Telefon Numarası" value={data?.phone} />
          <ReadOnlyInfo label="E-posta" value={data?.email || '-'} />
        </SimpleGrid>

        <Heading size="sm" mb={4} color="gray.500">
          Borsa Deneyimi
        </Heading>
        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
          <ReadOnlyInfo label="Portföy Büyüklüğü" value={data?.portfolioSize} />
          <ReadOnlyInfo
            label="Şu anda Borsa İstanbul'da yatırımı var mı?"
            value={data?.hasBistInvestment}
          />
          <ReadOnlyInfo
            label="Takip Ettiği / Yatırım Yaptığı Hisseler"
            value={data?.trackedStocks || '-'}
          />
          <ReadOnlyInfo label="İşlem Yaklaşımı" value={data?.tradingApproach} />
          <ReadOnlyInfo label="Borsa Deneyim Süresi" value={data?.tradingExperience} />
        </SimpleGrid>

        <Heading size="sm" mb={4} color="gray.500">
          Hedefler
        </Heading>
        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
          <ReadOnlyInfo
            label="HisseChat'ten Beklentileri"
            value={(data?.expectations || []).join(', ') || '-'}
          />
          <ReadOnlyInfo
            label="Diğer Beklenti (varsa)"
            value={data?.expectationsOther || '-'}
          />
        </SimpleGrid>

        <Heading size="sm" mb={4} color="gray.500">
          Bizi Nereden Duydu?
        </Heading>
        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
          <ReadOnlyInfo label="Öneren Biri Oldu mu?" value={data?.referredBy} />
          <ReadOnlyInfo
            label="Önerenin İsmi (varsa)"
            value={data?.referrerName || '-'}
          />
        </SimpleGrid>

        <Heading size="sm" mb={4} color="gray.500">
          A Takımı
        </Heading>
        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
          <ReadOnlyInfo
            label="A Takımı Hakkında Bilgisi Var mı / Bilgilendirilmek İster mi?"
            value={data?.aTeamInterest}
          />
        </SimpleGrid>

        <SimpleGrid columns={{base: 1, md: 2}} spacing={4} mb={6}>
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

export default IntroFormDetail;
