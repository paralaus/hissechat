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
  Image as ChakraImage,
  VStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import {FiImage, FiUpload} from 'react-icons/fi';
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

  const {data} = useQuery({
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
            <Box display={'flex'} flexDirection="column" alignItems="center" mb="6">
              {/* Profile Image Upload Area */}
              <Box
                onClick={() => open()}
                cursor="pointer"
                borderRadius="xl"
                border="2px dashed"
                borderColor={objectUrl || (getValues('thumbnail')?.length > 0) ? 'transparent' : 'gray.300'}
                bg={objectUrl || (getValues('thumbnail')?.length > 0) ? 'transparent' : 'gray.50'}
                p={objectUrl || (getValues('thumbnail')?.length > 0) ? '0' : '8'}
                minH="150px"
                minW="150px"
                maxW="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'brand.400',
                  bg: objectUrl || (getValues('thumbnail')?.length > 0) ? 'transparent' : 'brand.50',
                }}
                position="relative"
                overflow="hidden"
              >
                {objectUrl || (getValues('thumbnail')?.length > 0) ? (
                  <ChakraImage
                    src={objectUrl || getValues('thumbnail')}
                    alt="Profil Fotoğrafı"
                    maxH="150px"
                    objectFit="contain"
                    borderRadius="lg"
                  />
                ) : (
                  <VStack spacing="3">
                    <Box
                      p="4"
                      bg="gray.100"
                      borderRadius="full"
                    >
                      <Icon as={FiImage} boxSize="8" color="gray.400" />
                    </Box>
                    <VStack spacing="1">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Fotoğraf Yükle
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Tıklayarak görsel seçin
                      </Text>
                    </VStack>
                    <Icon as={FiUpload} boxSize="4" color="gray.400" />
                  </VStack>
                )}
              </Box>
              {input}
              <Input type={'hidden'} {...register('thumbnail')} />
              {(objectUrl || (getValues('thumbnail')?.length > 0)) && (
                <Button
                  mt="3"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset({
                      thumbnail: '',
                    });
                    resetFile();
                  }}>
                  Kaldır
                </Button>
              )}
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
