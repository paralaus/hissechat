import React, {useRef} from 'react';
import {Image as ChakraImage} from '@chakra-ui/react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  Textarea,
  Icon,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiImage, FiUpload } from 'react-icons/fi';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../../utils/string';
import {formatDate} from '../../../utils/date';
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {ReadOnlyInfo, Page as Layout, Condition} from '../../../components';
import {api} from '../../../api';
import {getAdImageUrl} from '../../../utils/image';
import {pick} from '../../../utils/object';
import useFileInput from '../../../hooks/useFileInput';

const object = {
  title: yup.string().required(),
  description: yup.string().required(),
  link: yup.string().required(),
  adImage: yup.string(),
};

const schema = yup.object().shape(object);

const EditAds = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
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
    defaultValues: {
      title: '',
      description: '',
      link: '',
      adImage: '',
    },
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew
        ? api.createAdDetail(values)
        : api.updateAdDetail(id, values),
  });

  const {mutateAsync: deleteAdDetail, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteAdDetail(id),
  });

  const {data} = useQuery({
    enabled: !isNew,
    queryKey: ['ads-details', id],
    queryFn: () =>
      api
        .getAdDetail(id)
        .then(res => res.data)
        .then(values => {
          console.log('Fetched values:', values);
          const data = pick(values, Object.keys(object));
          console.log('Fetched data:', data);
          reset(data);
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
        const submissionData = { ...values };
        
        if (objectUrl) {
          const url = await upload();
          if (!url) {
              toast({
              title: 'Görsel yüklenemedi.',
              status: 'error',
              position: 'top',
              });
              return;
          }
          submissionData.adImage = url;
        }
        
        await mutateAsync(submissionData);
        
        toast({
        title: 'Bilgiler kaydedildi.',
        status: 'success',
        position: 'top',
        });
        navigate(routes.ads.path);
    } catch (error) {
        console.error('Submission error:', error);
        toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        });
    }
  };

  const onDelete = async () => {
  try {
    await deleteAdDetail(); // 'data' is unused
    toast({
      title: 'Başarıyla silindi.',
      status: 'success',
      position: 'top',
      });
      navigate(routes.ads.path);
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
              {/* Image Upload Area */}
              <Box
                onClick={() => open()}
                cursor="pointer"
                borderRadius="xl"
                border="2px dashed"
                borderColor={objectUrl || getValues('adImage')?.length > 0 ? 'transparent' : 'gray.300'}
                bg={objectUrl || getValues('adImage')?.length > 0 ? 'transparent' : 'gray.50'}
                p={objectUrl || getValues('adImage')?.length > 0 ? '0' : '8'}
                minH="200px"
                minW="300px"
                maxW="500px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'brand.400',
                  bg: objectUrl || getValues('adImage')?.length > 0 ? 'transparent' : 'brand.50',
                }}
                position="relative"
                overflow="hidden"
              >
                {objectUrl || getValues('adImage')?.length > 0 ? (
                  <ChakraImage
                    src={objectUrl || getAdImageUrl(getValues('adImage'))}
                    alt="Ad Image"
                    maxH="300px"
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
                        Görsel Yükle
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
              <Input type={'hidden'} {...register('adImage')} />
              {(objectUrl || getValues('adImage')?.length > 0) && (
                <Button
                  mt="3"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset({
                      ...getValues(),
                      adImage: '',
                    });
                    resetFile();
                  }}
                >
                  Görseli Kaldır
                </Button>
              )}
            </Box>
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
            <ReadOnlyInfo label={'ID'} value={data?.id} />
            <FormControl isInvalid={!!errors.description} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Açıklama
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                {...register('description')}
              />
              <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.link} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Bağlantı
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('link')}
              />
              <FormErrorMessage>{errors.link?.message}</FormErrorMessage>
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
  return <EditAds key={id} id={id} />;
};

export default Page;
