import React, {useRef} from 'react';
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
  Image as ChakraImage,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  Textarea,
  FormHelperText,
  Switch,
  Select,
  VStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import {FiImage, FiUpload} from 'react-icons/fi';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../../utils/string';
import {formatDate} from '../../../utils/date';
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {Condition, ReadOnlyInfo, Page as Layout} from '../../../components';
import {api} from '../../../api';
import {getCombinedLogoUrl} from '../../../utils/image';
import {pick} from '../../../utils/object';
import useFileInput from '../../../hooks/useFileInput';
import {AsyncSelect} from 'chakra-react-select';

const channelCategories = [
  {value: 'borsa', label: 'Borsa'},
  {value: 'kripto', label: 'Kripto'},
  {value: 'forex', label: 'Forex'},
  {value: 'analiz', label: 'Analiz'},
  {value: 'emtia', label: 'Emtia'},
  {value: 'other', label: 'Diğer'},
];

const object = {
  name: yup.string().required('Bu alan zorunludur.'),
  thumbnail: yup.string(),
  category: yup.string().notRequired(),
  about: yup.string().required('Bu alan zorunludur.'),
  admins: yup.array().required('Bu alan zorunludur.'),
  marketCode: yup.string().notRequired(),
  isActive: yup.boolean().notRequired(),
  isFixed: yup.boolean().notRequired(),
  rank: yup.number('Bu alana bir sayı girin.').notRequired(),
  onlyAdminCanPost: yup.boolean().notRequired(),
  subscribeText: yup.string().notRequired(),
};

const schema = yup.object().shape(object);

const EditVipChannel = ({id}) => {
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
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew ? api.createVipChannel(values) : api.updateChannel(id, values),
  });

  const {mutateAsync: deleteItem, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteChannel(id),
  });

  const {data} = useQuery({
    enabled: !isNew,
    queryKey: ['channel', id],
    queryFn: () =>
      api
        .getChannel(id)
        .then(res => res.data)
        .then(values => {
          const data = pick(values, Object.keys(object));
          data.admins = values?.admins?.map(item => item?.id);
          reset(data);
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
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
      }
      navigate(routes.vipChannels.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const onDelete = async () => {
    try {
      await deleteItem();
      toast({
        title: 'Başarıyla silindi.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.vipChannels.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const loadUsers = async query => {
    const {data} = await api.getUsers({query});
    return data?.results?.map(user => ({
      label: user?.fullname,
      value: user?.id,
    }));
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
            <Box
              display={'flex'}
              flexDirection="column"
              alignItems="center"
              mb="6">
              {/* Thumbnail Upload Area */}
              <Box
                onClick={() => open()}
                cursor="pointer"
                borderRadius="xl"
                border="2px dashed"
                borderColor={
                  objectUrl || getValues('thumbnail')?.length > 0
                    ? 'transparent'
                    : 'gray.300'
                }
                bg={
                  objectUrl || getValues('thumbnail')?.length > 0
                    ? 'transparent'
                    : 'gray.50'
                }
                p={objectUrl || getValues('thumbnail')?.length > 0 ? '0' : '8'}
                minH="150px"
                minW="150px"
                maxW="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'brand.400',
                  bg:
                    objectUrl || getValues('thumbnail')?.length > 0
                      ? 'transparent'
                      : 'brand.50',
                }}
                position="relative"
                overflow="hidden">
                {objectUrl || getValues('thumbnail')?.length > 0 ? (
                  <ChakraImage
                    src={
                      objectUrl || getCombinedLogoUrl(getValues('thumbnail'))
                    }
                    alt="Thumbnail"
                    maxH="150px"
                    objectFit="contain"
                    borderRadius="lg"
                  />
                ) : (
                  <VStack spacing="3">
                    <Box p="4" bg="gray.100" borderRadius="full">
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
              <Input type={'hidden'} {...register('thumbnail')} />
              {(objectUrl || getValues('thumbnail')?.length > 0) && (
                <Button
                  mt="3"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={e => {
                    e.stopPropagation();
                    setValue('thumbnail', '');
                    trigger('thumbnail');
                    resetFile();
                  }}>
                  Kaldır
                </Button>
              )}
            </Box>
            <FormControl isInvalid={!!errors.name} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                İsim
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.name}
                {...register('name')}
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.category} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kategori
              </FormLabel>
              <Select
                fontSize="sm"
                fontWeight="500"
                size="md"
                placeholder="Kategori seçin"
                defaultValue={data?.category}
                {...register('category')}>
                {channelCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Kanalın kategorisi - mobil uygulamada filtreleme için
                kullanılır.
              </FormHelperText>
              <FormErrorMessage>{errors.category?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.about} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hakkında
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                defaultValue={data?.about}
                {...register('about')}
              />
              <FormHelperText>Kanal detay sayfasında görünür.</FormHelperText>
              <FormErrorMessage>{errors.about?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.admins} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kanal Adminleri
              </FormLabel>
              <AsyncSelect
                {...register('admins')}
                key={data?.admins}
                onChange={val =>
                  setValue(
                    'admins',
                    val?.map(item => item?.value),
                  )
                }
                placeholder="Kullanıcı seçin (Filtrelemek için ismini yazın)"
                loadOptions={loadUsers}
                fontSize="sm"
                fontWeight="500"
                size="md"
                isMulti
                bg={'red'}
                colorScheme={'white'}
                defaultInputValue={data?.admins.map(item => item?.fullname)}
              />
              <FormErrorMessage>{errors.admins?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.marketCode} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Piyasa Kodu (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.marketCode}
                {...register('marketCode')}
              />
              <FormErrorMessage>{errors.marketCode?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.rank} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Sıra Katsayısı
              </FormLabel>
              <Input
                fontSize="sm"
                type="number"
                fontWeight="500"
                size="md"
                defaultValue={data?.rank || 0}
                {...register('rank')}
              />
              <FormHelperText>
                Sayı ne kadar yüksek olursa kanal listesinde o kadar üstte
                görünür.
              </FormHelperText>
              <FormErrorMessage>{errors.rank?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.subscribeText} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Abone Ol Yazısı
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.subscribeText}
                {...register('subscribeText')}
              />
              <FormHelperText>
                Abonelik satın alma sayfasında görünür.
              </FormHelperText>
              <FormErrorMessage>
                {errors.subscribeText?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isActive}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isActive" mb={0}>
                  Aktiflik
                </FormLabel>
                <Switch
                  key={data?.isActive}
                  id="isActive"
                  defaultChecked={data?.isActive}
                  {...register('isActive')}
                />
              </Box>
              <FormHelperText>
                Aktif olmayan kanallar listelenmez.
              </FormHelperText>
              <FormErrorMessage>{errors.isActive?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isFixed}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isFixed" mb={0}>
                  Sabitlenmiş Kanal
                </FormLabel>
                <Switch
                  key={data?.isFixed}
                  id="isFixed"
                  defaultChecked={data?.isFixed}
                  {...register('isFixed')}
                />
              </Box>
              <FormHelperText>
                Sabitlenmiş kanallar her zaman en üstte görünür.
              </FormHelperText>
              <FormErrorMessage>{errors.isFixed?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.onlyAdminCanPost}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="onlyAdminCanPost" mb={0}>
                  Sadece Admin Mesaj Gönderebilir
                </FormLabel>
                <Switch
                  key={data?.onlyAdminCanPost}
                  id="onlyAdminCanPost"
                  defaultChecked={data?.onlyAdminCanPost}
                  {...register('onlyAdminCanPost')}
                />
              </Box>
              <FormErrorMessage>
                {errors.onlyAdminCanPost?.message}
              </FormErrorMessage>
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
  return <EditVipChannel key={id} id={id} />;
};

export default Page;
