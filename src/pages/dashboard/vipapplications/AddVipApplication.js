import React, {useRef} from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Textarea,
  VStack,
  useToast, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialog,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useNavigate, useParams} from 'react-router-dom';
import { api } from '../../../api';
import { routes } from '../../../config/routes';
import { getErrorMessage } from '../../../utils/string';
import useDisclosure from '../../../hooks/useDisclosure';
import {Page as Layout, Condition, ReadOnlyInfo} from '../../../components';
import {pick} from '../../../utils/object';
import {formatDate} from '../../../utils/date';

// Validasyon Şeması
const schema = yup.object({
  fullName: yup.string().required('Ad Soyad zorunludur'),
  phone: yup.string().required('Telefon numarası zorunludur'),
  email: yup.string().email('Geçerli bir e-posta giriniz').required('E-posta zorunludur'),
  socialMediaLinks: yup.string().required('Sosyal medya hesapları zorunludur'),
  telegramLink: yup.string().nullable(),
  instagramLink: yup.string().nullable(),
  otherLinks: yup.string().nullable(),
  followerCount: yup.string().typeError('Sayı girmelisiniz').required('Takipçi sayısı zorunludur'),
  contentType: yup.string().required('İçerik türü zorunludur'),
  vipContentPlan: yup.string().required('VIP içerik açıklaması zorunludur'),
  priceExpectation: yup.string().typeError('Sayı girmelisiniz').required('Fiyat beklentisi zorunludur'),
  targetSubscriberCount: yup.string().typeError('Sayı girmelisiniz').required('Hedef abone sayısı zorunludur'),
  dailyPostCount: yup.string().typeError('Sayı girmelisiniz').required('Günlük paylaşım sayısı zorunludur'),
  /*previousExperience: yup.string().when('hasVipExperience', {
    is: 'true',
    then: (schema) => schema.required('Deneyim detayları zorunludur'),
    otherwise: (schema) => schema.nullable(),
  }),*/
  termsAccepted: yup.boolean().oneOf([true], 'Şartları kabul etmelisiniz'),
});

const AddVipApplication = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      termsAccepted: false,
    }
  });

  //const hasExperienceValue = watch('hasVipExperience');

  const {mutateAsync: deleteVipApplication, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteVipApplication(id),
  });

  const mutation = useMutation({
    mutationFn: (values) =>
      isNew
        ? api.createVipApplication(values)
        : api.updateVipApplication(id, values),
    onSuccess: () => {
      toast({
        title: 'Başvuru Alındı',
        description: 'VIP başvuru formu başarıyla oluşturuldu.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate(routes.vipApplications.path); // Listeleme sayfasına yönlendir
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error?.response?.data?.message || 'Bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const {data} = useQuery({
    enabled: !isNew,
    queryKey: ['vipapplication', id],
    queryFn: () =>
      api
        .getVipApplication(id)
        .then(res => res.data)
        .then(values => {
          // Fix: Access fields from schema.fields for Yup objects
          // Also handle case where values might be wrapped (e.g. values.data)
          const rawData = values.data || values;

          // Extract keys from Yup schema
          const fieldKeys = Object.keys(schema.fields);

          const formData = pick(rawData, fieldKeys);

          reset(formData);
          return rawData;
        }),
  });

  const onSubmit = (data) => {
    // Veriyi backend formatına uygun hale getirmek için ufak dönüşümler
    const payload = {
      ...data,
    };
    mutation.mutate(payload);
  };

  const onDelete = async () => {
    try {
      await deleteVipApplication(); // 'data' is unused
      toast({
        title: 'Başarıyla silindi.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.vipApplications.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <Layout>
    <Box p={8} bg="white" borderRadius="lg" shadow="sm">
      <Heading size="md" mb={6}>Yeni VIP Başvurusu Oluştur</Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            
            <FormControl isInvalid={!!errors.fullName}>
              <FormLabel>1. Adınız Soyadınız</FormLabel>
              <Input {...register('fullName')} defaultValue={data?.fullName} placeholder="Ad Soyad" />
              <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.phone}>
              <FormLabel>2. Telefon Numaranız</FormLabel>
              <Input {...register('phone')} defaultValue={data?.phone} placeholder="+90 555 ..." />
              <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>3. E-posta Adresiniz</FormLabel>
              <Input {...register('email')} defaultValue={data?.email} type="email" placeholder="ornek@mail.com" />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.followerCount}>
              <FormLabel>8. Toplam Takipçi Sayınız</FormLabel>
              <Input {...register('followerCount')} defaultValue={data?.followerCount} type="number" />
              <FormErrorMessage>{errors.followerCount?.message}</FormErrorMessage>
            </FormControl>

          </SimpleGrid>

          <FormControl isInvalid={!!errors.socialMediaLinks}>
            <FormLabel>4. Sosyal Medya Hesapları (Genel)</FormLabel>
            <Textarea {...register('socialMediaLinks')} defaultValue={data?.socialMediaLinks} placeholder="Hesaplarınız ve linkleri..." />
            <FormErrorMessage>{errors.socialMediaLinks?.message}</FormErrorMessage>
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
             <FormControl isInvalid={!!errors.telegramLink}>
              <FormLabel>5. Telegram Kanal/Grup Linki</FormLabel>
              <Input {...register('telegramLink')} defaultValue={data?.telegramLink} placeholder="https://t.me/..." />
            </FormControl>

            <FormControl isInvalid={!!errors.instagramLink}>
              <FormLabel>6. Instagram Profil Linki</FormLabel>
              <Input {...register('instagramLink')} defaultValue={data?.instagramLink} placeholder="https://instagram.com/..." />
            </FormControl>

             <FormControl isInvalid={!!errors.otherLinks}>
              <FormLabel>7. Diğer Linkler</FormLabel>
              <Input {...register('otherLinks')} defaultValue={data?.otherLinks}/>
            </FormControl>
          </SimpleGrid>

          <FormControl isInvalid={!!errors.contentType}>
            <FormLabel>9. İçerik Türü (Analiz vb.)</FormLabel>
            <Input {...register('contentType')} defaultValue={data?.contentType}/>
            <FormErrorMessage>{errors.contentType?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.vipContentPlan}>
            <FormLabel>10. VIP Kanalında Ne Paylaşacaksınız?</FormLabel>
            <Textarea {...register('vipContentPlan')} defaultValue={data?.vipContentPlan}/>
            <FormErrorMessage>{errors.vipContentPlan?.message}</FormErrorMessage>
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl isInvalid={!!errors.priceExpectation}>
              <FormLabel>11. Aylık Fiyat Beklentisi (TL)</FormLabel>
              <Input {...register('priceExpectation')} defaultValue={data?.priceExpectation} type="number" />
              <FormErrorMessage>{errors.priceExpectation?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.targetSubscriberCount}>
              <FormLabel>12. İlk 3 Ay Hedef Abone</FormLabel>
              <Input {...register('targetSubscriberCount')} defaultValue={data?.targetSubscriberCount} type="number" />
              <FormErrorMessage>{errors.targetSubscriberCount?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.dailyPostCount}>
              <FormLabel>13. Günlük Ort. Paylaşım</FormLabel>
              <Input {...register('dailyPostCount')} defaultValue={data?.dailyPostCount} type="number" />
              <FormErrorMessage>{errors.dailyPostCount?.message}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.previousExperience}>
              <FormLabel>Varsa link veya detay</FormLabel>
              <Input {...register('previousExperience')} defaultValue={data?.previousExperience} placeholder="Önceki grup linki vb." />
              <FormErrorMessage>{errors.previousExperience?.message}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>

          <FormControl isInvalid={!!errors.termsAccepted}>
            <Checkbox {...register('termsAccepted')} defaultValue={data?.termsAccepted}>
              15. HisseChat kullanım şartlarını kabul ediyorum.
            </Checkbox>
            <FormErrorMessage>{errors.termsAccepted?.message}</FormErrorMessage>
          </FormControl>
          <Condition condition={!isNew}>
            <ReadOnlyInfo
              label={'Kayıt Tarihi'}
              value={formatDate(data?.createdAt)}
            />
            <ReadOnlyInfo
              label={'Son Güncellenme Tarihi'}
              value={formatDate(data?.updatedAt)}
            />
          </Condition>
          <Button 
            type="submit" 
            colorScheme="primary"
            size="lg" 
            isLoading={isSubmitting}
            loadingText="Gönderiliyor"
          >
            Başvuruyu Gönder
          </Button>
        </VStack>
      </form>
    </Box>
    <Box display={'flex'} justifyContent={'end'}>
      <Condition condition={!isNew}>
        <Button
          isLoading={isDeleting}
          colorScheme={'red'}
          isDisabled={isDeleting}
          type="button"
          my={'4'}
          onClick={deleteModal.open}
          fontSize={'sm'}>
          Sil
        </Button>
      </Condition>
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
const Page = () => {
  const {id} = useParams();
  return <AddVipApplication key={id} id={id} />;
};
//export default AddVipApplication;
export default Page;
