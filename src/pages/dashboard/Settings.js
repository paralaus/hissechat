import React from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  Avatar,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../utils/string';
import {formatDate} from '../../utils/date';
import {Page as Layout} from '../../components';
import {api} from '../../api';
import {pick} from '../../utils/object';
import useFileInput from '../../hooks/useFileInput';
import {ReadOnlyInfo} from '../../components';
import {useUserStore} from '../../store';

const object = {
  thumbnail: yup.string(),
  fullname: yup.string().required('Bu alan zorunludur.'),
  email: yup
    .string()
    .email('Geçersiz email adresi')
    .required('Bu alan zorunludur.'),
};

const schema = yup.object(object).required();

const Settings = () => {
  const toast = useToast();
  const {user, updateUser} = useUserStore();
  const id = user?.id;
  const {
    input,
    open,
    objectUrl,
    reset: resetFile,
    upload,
    isUploading,
  } = useFileInput();
  const {
    register,
    handleSubmit,
    getValues,
    formState: {errors},
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.updateUser(id, values),
  });

  const {data, isLoading} = useQuery({
    queryKey: ['users', id],
    queryFn: () =>
      api
        .getUser(id)
        .then(res => res.data)
        .then(values => {
          reset(pick(values, Object.keys(object)));
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      if (objectUrl) {
        const url = await upload();
        if (url) values.thumbnail = url;
      }

      const {data} = await mutateAsync(values);
      if (data) {
        updateUser(data);
        toast({
          title: 'Bilgiler kaydedildi.',
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
    <Layout>
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
            <Box display={'flex'} flexDirection="column">
              <Avatar
                name={data?.name}
                src={objectUrl || getValues('thumbnail')}
                size={'xl'}
                m={'4'}
                alignSelf={'center'}
                cursor={'pointer'}
                onClick={() => {
                  open();
                }}
              />
              {input}
              <Input
                type={'hidden'}
                defaultValue={getValues('thumbnail')}
                {...register('thumbnail')}
              />
              <Button
                alignSelf={'center'}
                variant={'ghost'}
                onClick={() => {
                  reset({
                    thumbnail: '',
                  });
                  resetFile();
                }}>
                Kaldır
              </Button>
            </Box>
            <FormControl isInvalid={!!errors.fullname} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Ad Soyad
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.fullname}
                {...register('fullname')}
              />
              <FormErrorMessage>{errors.fullname?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.email} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                E-Posta
              </FormLabel>
              <Input
                fontSize="sm"
                fontWeight="500"
                size="md"
                type={'email'}
                defaultValue={data?.email}
                {...register('email')}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            <ReadOnlyInfo
              label={'Kayıt Tarihi'}
              value={formatDate(data?.createdAt)}
            />
            <ReadOnlyInfo
              label={'Son Güncellenme Tarihi'}
              value={formatDate(data?.updatedAt)}
            />
            <Button
              isLoading={isPending || isUploading}
              colorScheme={'primary'}
              isDisabled={isPending || isUploading}
              type="submit"
              fontSize={'sm'}>
              Kaydet
            </Button>
          </Flex>
        </form>
      </Box>
    </Layout>
  );
};

export default Settings;
