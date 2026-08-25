import React, {useRef} from 'react';
import {Avatar, Box} from '@chakra-ui/react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import {
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
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
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

const AccessManagement = ({channelId}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {data: pendingUsers} = useQuery({
    queryKey: ['pendingUsers', channelId],
    queryFn: () => api.getPendingUsers(channelId).then(res => res.data),
  });

  const {data: allowedUsers} = useQuery({
    queryKey: ['allowedUsers', channelId],
    queryFn: () => api.getAllowedUsers(channelId).then(res => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: userId => api.approveUser(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingUsers', channelId]);
      queryClient.invalidateQueries(['allowedUsers', channelId]);
      toast({title: 'Kullanıcı onaylandı', status: 'success'});
    },
  });

  const revokeMutation = useMutation({
    mutationFn: userId => api.revokeUser(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingUsers', channelId]);
      queryClient.invalidateQueries(['allowedUsers', channelId]);
      toast({title: 'İzin kaldırıldı', status: 'success'});
    },
  });

  return (
    <Box mt={8} bg="gray.50" p={4} borderRadius="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Erişim Yönetimi
      </Text>
      <Flex gap={8} direction={{base: 'column', md: 'row'}}>
        <Box flex={1} bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontWeight="bold" mb={4} color="orange.500">
            Bekleyen İstekler ({pendingUsers?.length || 0})
          </Text>
          <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
            {pendingUsers?.length === 0 && (
              <Text fontSize="sm" color="gray.500">
                Bekleyen istek yok.
              </Text>
            )}
            {pendingUsers?.map(user => (
              <Flex
                key={user.id}
                align="center"
                justify="space-between"
                p={2}
                borderBottom="1px solid #eee">
                <Flex align="center">
                  <Avatar
                    src={getCombinedLogoUrl(user.thumbnail)}
                    name={user.fullname}
                    size="sm"
                    mr={2}
                  />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">
                      {user.fullname}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user.email}
                    </Text>
                  </Box>
                </Flex>
                <Button
                  size="xs"
                  colorScheme="green"
                  onClick={() => approveMutation.mutate(user.id)}
                  isLoading={approveMutation.isPending}>
                  İzin Ver
                </Button>
              </Flex>
            ))}
          </VStack>
        </Box>
        <Box flex={1} bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontWeight="bold" mb={4} color="green.500">
            İzinli Kullanıcılar ({allowedUsers?.length || 0})
          </Text>
          <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto">
            {allowedUsers?.length === 0 && (
              <Text fontSize="sm" color="gray.500">
                İzinli kullanıcı yok.
              </Text>
            )}
            {allowedUsers?.map(user => (
              <Flex
                key={user.id}
                align="center"
                justify="space-between"
                p={2}
                borderBottom="1px solid #eee">
                <Flex align="center">
                  <Avatar
                    src={getCombinedLogoUrl(user.thumbnail)}
                    name={user.fullname}
                    size="sm"
                    mr={2}
                  />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">
                      {user.fullname}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user.email}
                    </Text>
                  </Box>
                </Flex>
                <Button
                  size="xs"
                  colorScheme="red"
                  onClick={() => revokeMutation.mutate(user.id)}
                  isLoading={revokeMutation.isPending}>
                  Kaldır
                </Button>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
};

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
  type: yup.string().default('normal'),
  category: yup.string().notRequired(),
  about: yup.string().required('Bu alan zorunludur.'),
  admins: yup.array().required('Bu alan zorunludur.'),
  marketCode: yup.string().notRequired(),
  hashtagAliases: yup.string().notRequired(),
  isActive: yup.boolean().notRequired(),
  isFixed: yup.boolean().notRequired(),
  rank: yup.number('Bu alana bir sayı girin.').notRequired(),
  onlyAdminCanPost: yup.boolean().notRequired(),
  subscribeText: yup.string().notRequired(),
  isRestricted: yup.boolean().notRequired(),
};

const schema = yup.object().shape(object);

const parseHashtagAliases = value =>
  Array.from(
    new Set(
      String(value || '')
        .split(/\r?\n|,/)
        .map(item => item.trim().replace(/^#/, ''))
        .filter(Boolean),
    ),
  );

const EditChannel = ({id}) => {
  const isNew = !id || id === 'new';
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isRestrictedParam = searchParams.get('restricted') === 'true';

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
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'normal',
      isRestricted: isRestrictedParam,
      // Yeni kanal varsayılan olarak AKTİF oluşturulur.
      // Önceden bu alan boş kaldığı için form isActive:false gönderiyordu;
      // kanal pasif oluşuyor ve liste pasifleri filtrelediği için panelde bir
      // daha hiç görünmüyordu (yeniden aktifleştirmek de mümkün olmuyordu).
      isActive: true,
    },
  });

  // Watch for changes in isRestricted if needed, but also sync with URL param on mount
  React.useEffect(() => {
    if (isNew && isRestrictedParam) {
      setValue('isRestricted', true);
    }
  }, [isNew, isRestrictedParam, setValue]);

  const isRestricted = watch('isRestricted');

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew ? api.createChannel(values) : api.updateChannel(id, values),
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
          data.hashtagAliases = Array.isArray(values?.hashtagAliases)
            ? values.hashtagAliases.join('\n')
            : '';
          reset(data);
          return values;
        }),
  });

  // Bir kanalın hangi liste sayfasına ait olduğunu belirler.
  // 'normal' olmayan tipler (piyasa/fon) Tüm Kanallar listesinde görünür.
  const getListPathFor = channel => {
    if (channel?.type && channel.type !== 'normal') {
      return routes.allChannels.path;
    }
    return channel?.isRestricted
      ? routes.restrictedChannels.path
      : routes.normalChannels.path;
  };

  const onSubmit = async values => {
    try {
      const payload = {
        ...values,
        hashtagAliases: parseHashtagAliases(values?.hashtagAliases),
      };

      if (objectUrl) {
        const url = await upload();
        if (url) payload.thumbnail = url;
      }

      const {data} = await mutateAsync(payload);
      if (data) {
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
      }
      // Kanalın ait olduğu listeye dön. Önceden her durumda allChannels'a
      // (Tüm Piyasa/Fon Kanalları) gidiliyordu; manuel bir kanal eklendiğinde
      // kullanıcı yeni kanalı o listede göremiyordu.
      navigate(getListPathFor(payload));
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
      navigate(getListPathFor(data));
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
                key={(data?.admins || []).map(item => item?.id).join(',')}
                onChange={val =>
                  setValue(
                    'admins',
                    val?.map(item => item?.value),
                    {shouldDirty: true},
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
                defaultValue={data?.admins?.map(item => ({
                  label: item?.fullname,
                  value: item?.id,
                }))}
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
            <FormControl isInvalid={!!errors.hashtagAliases} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hashtag Aliaslari
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                rows={4}
                placeholder={'odas\nhissechat\n#gokhanbilik1'}
                defaultValue={Array.isArray(data?.hashtagAliases) ? data.hashtagAliases.join('\n') : ''}
                {...register('hashtagAliases')}
              />
              <FormHelperText>
                Her satira bir alias yazin. `#` ile ya da `#` olmadan girebilirsiniz.
              </FormHelperText>
              <FormErrorMessage>{errors.hashtagAliases?.message}</FormErrorMessage>
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
                  // Yeni kanalda kayıt henüz yok; anahtar açık başlamalı ki
                  // form isActive:false göndermesin (bkz. defaultValues).
                  key={isNew ? 'new' : String(data?.isActive)}
                  id="isActive"
                  defaultChecked={isNew ? true : data?.isActive}
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
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isRestricted}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isRestricted" mb={0}>
                  Kısıtlı Erişim (Onaylı Üyeler)
                </FormLabel>
                <Switch
                  key={data?.isRestricted}
                  id="isRestricted"
                  defaultChecked={data?.isRestricted || isRestrictedParam}
                  {...register('isRestricted')}
                />
              </Box>
              <FormHelperText>
                Bu özellik açıldığında sadece izin verilen üyeler kanala
                girebilir.
              </FormHelperText>
              <FormErrorMessage>{errors.isRestricted?.message}</FormErrorMessage>
            </FormControl>

            <Condition condition={isRestricted}>
              <FormControl isInvalid={!!errors.accessCode} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Erişim Kodu (Opsiyonel)
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  fontWeight="500"
                  size="md"
                  defaultValue={data?.accessCode}
                  placeholder="Örn: 7476"
                  {...register('accessCode')}
                />
                <FormHelperText>
                  Kullanıcılar bu kodu girerek kanala otomatik katılabilir.
                </FormHelperText>
                <FormErrorMessage>{errors.accessCode?.message}</FormErrorMessage>
              </FormControl>
            </Condition>

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

      {/* Access Management Section */}
      {!isNew && isRestricted && <AccessManagement channelId={id} />}

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
  return <EditChannel key={id} id={id} />;
};

export default Page;
