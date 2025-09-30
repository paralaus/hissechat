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
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {Condition, Page as Layout} from '../../../components';
import {api} from '../../../api';
import {
  BlacklistScopeLabel,
  blacklistScopes,
  BlacklistValueConfig,
  BlacklistValueLabel,
} from '../../../config';
import {pick} from '../../../utils/object';

const object = {
  scope: yup.string().required('Bu alan zorunludur.'),
  type: yup.string().required('Bu alan zorunludur.'),
  value: yup.string().required('Bu alan zorunludur.'),
  resource: yup.string(),
  isActive: yup.boolean().notRequired(),
};

const schema = yup.object().shape(object);

const EditBlacklist = ({id}) => {
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
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew ? api.createBlacklist(values) : api.updateBlacklist(id, values),
  });

  const {mutateAsync: deleteItem, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteBlacklist(id),
  });

  const {data, isLoading} = useQuery({
    enabled: !isNew,
    queryKey: ['blacklist', id],
    queryFn: () =>
      api
        .getBlacklist(id)
        .then(res => res.data)
        .then(values => {
          reset(values);
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(pick(values, Object.keys(object)));
      if (data) {
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
      }
      navigate(routes.blacklist.path);
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
      navigate(routes.blacklist.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const selectedConfig = BlacklistValueConfig?.[watch().scope];

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
            <FormControl isInvalid={!!errors.scope} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kapsam
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Kapsam seçin"
                fontWeight="500"
                defaultValue={data?.scope}
                size="md"
                {...register('scope')}>
                {blacklistScopes.map(scope => {
                  return (
                    <option value={scope}>{BlacklistScopeLabel[scope]}</option>
                  );
                })}
              </Select>
              <FormErrorMessage>{errors.scope?.message}</FormErrorMessage>
              <FormHelperText>
                Seçtiğiniz kapsam işleminin gerçekleşmesi engellenecektir.
              </FormHelperText>
            </FormControl>
            <FormControl isInvalid={!!errors.type} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Değer Tipi
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Değer tipi seçin"
                fontWeight="500"
                defaultValue={data?.type}
                size="md"
                {...register('type')}>
                {selectedConfig?.values?.map(type => {
                  return (
                    <option value={type}>{BlacklistValueLabel[type]}</option>
                  );
                })}
              </Select>
              <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.value} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Değer
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                placeholder={
                  'Örnek değerler: E-posta için example@mail.com, IP için  255.255.255.255, Kullanıcı ID için 6624740b8b77581ab2835684'
                }
                size="md"
                defaultValue={data?.value}
                {...register('value')}
              />
              <FormErrorMessage>{errors.value?.message}</FormErrorMessage>
              <FormHelperText>
                Seçtiğiniz değer tipine göre değeri girin.
              </FormHelperText>
            </FormControl>
            <Condition condition={selectedConfig?.resource?.enabled}>
              <FormControl isInvalid={!!errors.resource} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  {selectedConfig?.resource?.label} (Opsiyonel)
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  fontWeight="500"
                  size="md"
                  defaultValue={data?.resource}
                  {...register('resource')}
                />
                <FormErrorMessage>{errors.resource?.message}</FormErrorMessage>
                <FormHelperText>
                  Burayı doldurursanız, yalnızca girdiğiniz değere sahip
                  kaynakta işlem yapılırsa engellenir. Örneğin, Kanala Mesaj Gönderme
                  kapsamı seçip buraya bir Kanal ID'si girerseniz kullanıcının
                  yalnızca o kanala mesaj göndermesi engellenir. Boş bırakırsanız
                  hiçbir kanala mesaj gönderemez.
                </FormHelperText>
              </FormControl>
            </Condition>
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
              <FormErrorMessage>{errors.isActive?.message}</FormErrorMessage>
            </FormControl>
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
  return <EditBlacklist key={id} id={id} />;
};

export default Page;
