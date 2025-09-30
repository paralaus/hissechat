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
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  FormHelperText,
  Switch,
  Select,
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
import {pick} from '../../../utils/object';
import {AsyncSelect} from 'chakra-react-select';

const object = {
  name: yup.string().required('Bu alan zorunludur.'),
  iosId: yup.string().required('Bu alan zorunludur.'),
  androidId: yup.string().required('Bu alan zorunludur.'),
  channel: yup.string().required('Bu alan zorunludur.'),
  isActive: yup.boolean().notRequired(),
  timeDays: yup.number().required('Bu alan zorunludur.'),
};

const schema = yup.object().shape(object);

const EditProduct = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew ? api.createProduct(values) : api.updateProduct(id, values),
  });

  const {mutateAsync: deleteItem, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteProduct(id),
  });

  const {data, isLoading} = useQuery({
    enabled: !isNew,
    queryKey: ['product', id],
    queryFn: () =>
      api
        .getProduct(id)
        .then(res => res.data)
        .then(values => {
          const data = pick(values, Object.keys(object));
          data.channel = values?.channel?.id;
          reset(data);
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync({...values, type: 'subscription'});
      if (data) {
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
        navigate(routes.products.path);
      }
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
      navigate(routes.products.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const loadItems = async query => {
    const {data} = await api.getVipChannels({query});
    return data?.results?.map(item => ({
      label: item?.name,
      value: item?.id,
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
            <FormControl isInvalid={!!errors.iosId} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                iOS Abonelik ID
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.iosId}
                {...register('iosId')}
              />
              <FormHelperText>
                App Store Connect panelinde oluşturulan Subscription ID.
              </FormHelperText>
              <FormErrorMessage>{errors.iosId?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.androidId} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Android Abonelik ID
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.androidId}
                {...register('androidId')}
              />
              <FormHelperText>
                Google Play Store panelinde oluşturulmuş Abonelik ID.
              </FormHelperText>
              <FormErrorMessage>{errors.androidId?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.channel} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kanal
              </FormLabel>
              <AsyncSelect
                {...register('channel')}
                key={data?.channel?.name}
                onChange={val => reset({channel: val.value})}
                placeholder="Kanal seçin (Filtrelemek için ismini yazın)"
                loadOptions={loadItems}
                fontSize="sm"
                fontWeight="500"
                size="md"
                bg={'red'}
                colorScheme={'white'}
                defaultInputValue={data?.channel?.name}
              />
              <FormErrorMessage>{errors.channel?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.timeDays} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Abonelik Süresi
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Süre seçin"
                fontWeight="500"
                defaultValue={data?.timeDays}
                size="md"
                {...register('timeDays')}>
                {[
                  {
                    label: 'Aylık',
                    value: 30,
                  },
                  {
                    label: 'Yıllık',
                    value: 365,
                  },
                ].map(item => {
                  return <option value={item.value}>{item.label}</option>;
                })}
              </Select>
              <FormErrorMessage>{errors.timeDays?.message}</FormErrorMessage>
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
                Aktif olmayan abonelikler satın alınamaz.
              </FormHelperText>
              <FormErrorMessage>{errors.isActive?.message}</FormErrorMessage>
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
              isLoading={isPending}
              colorScheme={'primary'}
              isDisabled={isPending}
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
  return <EditProduct key={id} id={id} />;
};

export default Page;
