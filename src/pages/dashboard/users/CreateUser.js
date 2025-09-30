import React, {useState} from 'react';
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
  Text,
  InputGroup,
  InputRightElement,
  Icon,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';
import useDisclosure from '../../../hooks/useDisclosure';
import {roles} from '../../../config';
import {RiEyeCloseLine} from 'react-icons/ri';
import {MdOutlineRemoveRedEye} from 'react-icons/md';
import {routes} from '../../../config/routes';
import {Page} from '../../../components';

const schema = yup
  .object({
    fullname: yup.string().required('Bu alan zorunludur.'),
    role: yup.string().oneOf(roles).required('Bu alan zorunludur.'),
    email: yup
      .string()
      .email('Geçersiz e-posta adresi.')
      .required('Bu alan zorunludur.'),
    password: yup
      .string()
      .min(6, 'Minimum 6 karakter.')
      .required('Bu alan zorunludur.'),
  })
  .required();

const CreateUser = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const show = useDisclosure();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.createUser(values),
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(values);
      if (data) {
        toast({
          title: 'Kullanıcı oluşturuldu.',
          status: 'success',
          position: 'top',
        });
        navigate(routes.users.path);
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
                type="text"
                fontWeight="500"
                type={'email'}
                size="md"
                {...register('email')}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
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
                size="md"
                {...register('role')}>
                {roles.map(role => {
                  return <option value={role}>{role}</option>;
                })}
              </Select>
              <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.password} mb="4">
              <FormLabel ms="4px" fontSize="sm" fontWeight="500" display="flex">
                Şifre
              </FormLabel>
              <InputGroup size="md">
                <Input
                  fontSize="sm"
                  placeholder="Şifre giriniz"
                  size="md"
                  type={show.isOpen ? 'text' : 'password'}
                  {...register('password')}
                />
                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    _hover={{cursor: 'pointer'}}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={show.toggle}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            <Button
              isLoading={isPending}
              colorScheme={'primary'}
              isDisabled={isPending}
              type="submit"
              fontSize={'sm'}>
              Oluştur
            </Button>
          </Flex>
        </form>
      </Box>
    </Page>
  );
};

export default CreateUser;
