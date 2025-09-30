import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  Select,
  FormHelperText,
  Switch,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation} from '@tanstack/react-query';
import * as yup from 'yup';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';
import useDisclosure from '../../../hooks/useDisclosure';
import {Condition, Page} from '../../../components';
import {
  NotificationReceiverType,
  NotificationReceiverTypeLabel,
  notificationReceiverTypes,
} from '../../../config';

const schema = yup
  .object({
    title: yup.string().required('Bu alan zorunludur.'),
    body: yup.string(),
    subject: yup.string(),
    subjectType: yup.string().required('Bu alan zorunludur.'),
    shouldCreateNotification: yup.boolean(),
    isImportant: yup.boolean(),
    receiverType: yup.string().required('Bu alan zorunludur.'),
    channel: yup.string(),
  })
  .required();

const SendPushNotification = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const show = useDisclosure();

  const {
    register,
    handleSubmit,
    formState: {errors},
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.sendPushNotification(values),
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(values);
      if (data) {
        toast({
          title: 'Bildirim gönderildi.',
          status: 'success',
          position: 'top',
        });
      }
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <Page>
      <Box
        bg={'white'}
        overflow={'scroll'}
        borderRadius={'md'}
        display={'flex'}
        flexDirection={'column'}
        boxShadow={'md'}
        p={'4'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex
            zIndex="2"
            direction="column"
            maxW="100%"
            background="transparent"
            borderRadius="md"
            me="auto">
            <FormControl isInvalid={!!errors.receiverType} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hedef Kitle
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Seçim yapın"
                fontWeight="500"
                size="md"
                {...register('receiverType')}>
                {notificationReceiverTypes.map(item => {
                  return (
                    <option value={item}>
                      {NotificationReceiverTypeLabel[item]}
                    </option>
                  );
                })}
              </Select>
              <FormErrorMessage>
                {errors.receiverType?.message}
              </FormErrorMessage>
            </FormControl>
            <Condition
              condition={
                watch().receiverType === NotificationReceiverType.Channel
              }>
              <FormControl isInvalid={!!errors.channel} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Kanal ID
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  fontWeight="500"
                  size="md"
                  {...register('channel')}
                />
                <FormErrorMessage>{errors.channel?.message}</FormErrorMessage>
              </FormControl>
            </Condition>
            <FormControl isInvalid={!!errors.title} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Başlık
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('title')}
              />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.body} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Mesaj
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('body')}
              />
              <FormErrorMessage>{errors.body?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.subjectType} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Şuna Yönlendir
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Seçim yapın"
                fontWeight="500"
                size="md"
                {...register('subjectType')}>
                {[
                  {value: 'none', label: 'Yok'},
                  {value: 'channel', label: 'Kanala Yönlendir'},
                  {
                    value: 'user',
                    label: 'Kullanıcıya Yönlendir',
                  },
                ].map(item => {
                  return <option value={item.value}>{item.label}</option>;
                })}
              </Select>
              <FormErrorMessage>{errors.subjectType?.message}</FormErrorMessage>
              <FormHelperText>
                Bildirime tıklanıldığında özel bir sayfaya gitmesini
                istiyorsanız buradan seçin.
              </FormHelperText>
            </FormControl>
            <FormControl isInvalid={!!errors.subject} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Yönlendirilecek ID (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('subject')}
              />
              <FormErrorMessage>{errors.subject?.message}</FormErrorMessage>
              <FormHelperText>
                Yönlendirme tipi seçtiyseniz buradan hangi ID'ye sahip kaynağa
                yönlendirileceğini seçin.
              </FormHelperText>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.shouldCreateNotification}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="shouldCreateNotification" mb={0}>
                  Kalıcı Bildirim Oluşturulsun
                </FormLabel>
                <Switch
                  id="shouldCreateNotification"
                  {...register('shouldCreateNotification')}
                />
              </Box>
              <FormHelperText>
                Aktifleştirirseniz gönderilen bildirim Bildirimler sayfasında da
                görünür.
              </FormHelperText>
              <FormErrorMessage>
                {errors.shouldCreateNotification?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isImportant}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isImportant" mb={0}>
                  Önemli
                </FormLabel>
                <Switch id="isImportant" {...register('isImportant')} />
              </Box>
              <FormHelperText>
                Aktifleştirildiğinde eğer kalıcı bildirim oluşturulmuşsa
                bildirim vurgulanır.
              </FormHelperText>
              <FormErrorMessage>{errors.isImportant?.message}</FormErrorMessage>
            </FormControl>
            <Button
              isLoading={isPending}
              colorScheme={'primary'}
              isDisabled={isPending}
              type="submit"
              fontSize={'sm'}>
              Gönder
            </Button>
          </Flex>
        </form>
      </Box>
    </Page>
  );
};

export default SendPushNotification;
