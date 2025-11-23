import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api'; // Yolu kontrol edin

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
  hasVipExperience: yup.string().required('Deneyim seçimi zorunludur'), // Select için string tutuyoruz
  previousExperience: yup.string().when('hasVipExperience', {
    is: 'true',
    then: (schema) => schema.required('Deneyim detayları zorunludur'),
    otherwise: (schema) => schema.nullable(),
  }),
  termsAccepted: yup.boolean().oneOf([true], 'Şartları kabul etmelisiniz'),
});

const AddVipApplication = () => {
  const toast = useToast();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      hasVipExperience: 'false',
      termsAccepted: false,
    }
  });

  const hasExperienceValue = watch('hasVipExperience');

  const mutation = useMutation({
    mutationFn: api.createVipApplication,
    onSuccess: () => {
      toast({
        title: 'Başvuru Alındı',
        description: 'VIP başvuru formu başarıyla oluşturuldu.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/dashboard/vip-applications'); // Listeleme sayfasına yönlendir
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

  const onSubmit = (data) => {
    // Veriyi backend formatına uygun hale getirmek için ufak dönüşümler
    const payload = {
      ...data,
      hasVipExperience: data.hasVipExperience === 'true',
    };
    mutation.mutate(payload);
  };

  return (
    <Box p={8} bg="white" borderRadius="lg" shadow="sm">
      <Heading size="md" mb={6}>Yeni VIP Başvurusu Oluştur</Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            
            <FormControl isInvalid={!!errors.fullName}>
              <FormLabel>1. Adınız Soyadınız</FormLabel>
              <Input {...register('fullName')} placeholder="Ad Soyad" />
              <FormErrorMessage>{errors.fullName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.phone}>
              <FormLabel>2. Telefon Numaranız</FormLabel>
              <Input {...register('phone')} placeholder="+90 555 ..." />
              <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>3. E-posta Adresiniz</FormLabel>
              <Input {...register('email')} type="email" placeholder="ornek@mail.com" />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.followerCount}>
              <FormLabel>8. Toplam Takipçi Sayınız</FormLabel>
              <Input {...register('followerCount')} type="number" />
              <FormErrorMessage>{errors.followerCount?.message}</FormErrorMessage>
            </FormControl>

          </SimpleGrid>

          <FormControl isInvalid={!!errors.socialMediaLinks}>
            <FormLabel>4. Sosyal Medya Hesapları (Genel)</FormLabel>
            <Textarea {...register('socialMediaLinks')} placeholder="Hesaplarınız ve linkleri..." />
            <FormErrorMessage>{errors.socialMediaLinks?.message}</FormErrorMessage>
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
             <FormControl isInvalid={!!errors.telegramLink}>
              <FormLabel>5. Telegram Kanal/Grup Linki</FormLabel>
              <Input {...register('telegramLink')} placeholder="https://t.me/..." />
            </FormControl>

            <FormControl isInvalid={!!errors.instagramLink}>
              <FormLabel>6. Instagram Profil Linki</FormLabel>
              <Input {...register('instagramLink')} placeholder="https://instagram.com/..." />
            </FormControl>

             <FormControl isInvalid={!!errors.otherLinks}>
              <FormLabel>7. Diğer Linkler</FormLabel>
              <Input {...register('otherLinks')} />
            </FormControl>
          </SimpleGrid>

          <FormControl isInvalid={!!errors.contentType}>
            <FormLabel>9. İçerik Türü (Analiz, Sinyal vb.)</FormLabel>
            <Input {...register('contentType')} />
            <FormErrorMessage>{errors.contentType?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.vipContentPlan}>
            <FormLabel>10. VIP Kanalında Ne Paylaşacaksınız?</FormLabel>
            <Textarea {...register('vipContentPlan')} />
            <FormErrorMessage>{errors.vipContentPlan?.message}</FormErrorMessage>
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl isInvalid={!!errors.priceExpectation}>
              <FormLabel>11. Aylık Fiyat Beklentisi (TL)</FormLabel>
              <Input {...register('priceExpectation')} type="number" />
              <FormErrorMessage>{errors.priceExpectation?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.targetSubscriberCount}>
              <FormLabel>12. İlk 3 Ay Hedef Abone</FormLabel>
              <Input {...register('targetSubscriberCount')} type="number" />
              <FormErrorMessage>{errors.targetSubscriberCount?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.dailyPostCount}>
              <FormLabel>13. Günlük Ort. Paylaşım</FormLabel>
              <Input {...register('dailyPostCount')} type="number" />
              <FormErrorMessage>{errors.dailyPostCount?.message}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.hasVipExperience}>
              <FormLabel>14. Daha önce VIP deneyiminiz oldu mu?</FormLabel>
              <Select {...register('hasVipExperience')}>
                <option value="false">Hayır</option>
                <option value="true">Evet</option>
              </Select>
              <FormErrorMessage>{errors.hasVipExperience?.message}</FormErrorMessage>
            </FormControl>

            {hasExperienceValue === 'true' && (
              <FormControl isInvalid={!!errors.previousExperience}>
                <FormLabel>Varsa link veya detay</FormLabel>
                <Input {...register('previousExperience')} placeholder="Önceki grup linki vb." />
                <FormErrorMessage>{errors.previousExperience?.message}</FormErrorMessage>
              </FormControl>
            )}
          </SimpleGrid>

          <FormControl isInvalid={!!errors.termsAccepted}>
            <Checkbox {...register('termsAccepted')}>
              15. HisseChat kullanım şartlarını kabul ediyorum.
            </Checkbox>
            <FormErrorMessage>{errors.termsAccepted?.message}</FormErrorMessage>
          </FormControl>

          <Button 
            type="submit" 
            colorScheme="blue" 
            size="lg" 
            isLoading={isSubmitting}
            loadingText="Gönderiliyor"
          >
            Başvuruyu Gönder
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default AddVipApplication;
