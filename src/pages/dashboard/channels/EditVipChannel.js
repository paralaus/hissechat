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
  Avatar,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  Textarea,
  FormHelperText,
  Switch,
} from '@chakra-ui/react';
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

const object = {
  name: yup.string().required('Bu alan zorunludur.'),
  thumbnail: yup.string(),
  about: yup.string().required('Bu alan zorunludur.'),
  admins: yup.array().required('Bu alan zorunludur.'),
  marketCode: yup.string().notRequired(),
  isActive: yup.boolean().notRequired(),
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

  const {data, isLoading} = useQuery({
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
      const {data} = await deleteItem();
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
            <Box display={'flex'} flexDirection="column">
              <Avatar
                name={data?.name}
                src={objectUrl || getCombinedLogoUrl(getValues('thumbnail'))}
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
                  setValue('thumbnail', '');
                  trigger('thumbnail');
                  resetFile();
                }}>
                Kaldır
              </Button>
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
