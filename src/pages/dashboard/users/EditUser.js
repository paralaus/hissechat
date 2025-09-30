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
  Select,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';
import {roles} from '../../../config';
import {formatDate} from '../../../utils/date';
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {ReadOnlyInfo, Page} from '../../../components';
import {pick} from '../../../utils/object';
import UserChannels from '../../../components/channels/UserChannels';

const schema = yup
  .object({
    thumbnail: yup.string(),
    fullname: yup.string().required('Bu alan zorunludur.'),
    role: yup.string().oneOf(roles).required('Bu alan zorunludur.'),
    email: yup
      .string()
      .email('Geçersiz e-posta adresi')
      .required('Bu alan zorunludur'),
  })
  .required();

const formKeys = ['thumbnail', 'fullname', 'role', 'email'];

const EditUser = () => {
  const {id} = useParams();
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: {errors},
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.manageUser(id, values),
  });

  const {mutateAsync: deleteUser, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteUser(id),
  });

  const {data, isLoading} = useQuery({
    queryKey: ['user', id],
    queryFn: () =>
      api
        .getUser(id)
        .then(res => res.data)
        .then(values => {
          reset({...values, thumbnail: values.thumbnail || ''});
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(pick(values, formKeys));
      if (data) {
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

  const onDelete = async () => {
    try {
      const {data} = await deleteUser();
      toast({
        title: 'Kullanıcı silindi.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.users.path);
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
            <Box display={'flex'} flexDirection="column">
              <Avatar
                name={data?.fullname}
                src={getValues('thumbnail')}
                size={'xl'}
                m={'4'}
                alignSelf={'center'}
              />
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
                }}>
                Kaldır
              </Button>
            </Box>
            <ReadOnlyInfo label={'ID'} value={data?.id} />
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
            <FormControl isInvalid={!!errors.role} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Rol
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Rol seçin"
                fontWeight="500"
                defaultValue={data?.role}
                size="md"
                {...register('role')}>
                {roles.map(role => {
                  return (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  );
                })}
              </Select>
              <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
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
                type="email"
                fontWeight="500"
                size="md"
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
              label={'Son Aktivite Tarihi'}
              value={formatDate(data?.lastActivityAt)}
            />
            <ReadOnlyInfo label={'Bildirim Tokenı'} value={data?.deviceToken} />
            <ReadOnlyInfo label={'Cihaz'} value={data?.platform} />
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
          Kullanıcıyı Sil
        </Button>
      </Box>
      <Box
        bg={'white'}
        overflow={'scroll'}
        borderRadius={'md'}
        display={'flex'}
        flexDirection={'column'}
        boxShadow={'md'}
        p={'4'}>
        <UserChannels userId={id} />
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
              Kullanıcyı Sil
            </AlertDialogHeader>
            <AlertDialogBody>
              Kullanıcıyı silmek istediğinize emin misiniz?
            </AlertDialogBody>
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
    </Page>
  );
};

export default EditUser;
