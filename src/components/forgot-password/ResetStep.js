import React from 'react';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useMutation} from '@tanstack/react-query';
import {getErrorMessage} from '../../utils/string';
import {api} from '../../api';
import {RiEyeCloseLine} from 'react-icons/ri';
import {MdOutlineRemoveRedEye} from 'react-icons/md';
import useDisclosure from '../../hooks/useDisclosure';

const schema = yup.object({
  password: yup
    .string()
    .min(6, 'Minimum 6 karakter olmalıdır.')
    .required('Lütfen doldurun'),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref('password')], 'Şifreler Eşleşmiyor')
    .required(),
});

const ResetStep = ({onComplete, isActive, data}) => {
  const show = useDisclosure();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: api.resetPassword,
  });

  const onSubmit = async values => {
    try {
      const body = {
        email: data.email,
        token: data.token,
        password: values.password,
      };
      await mutateAsync(body);
      toast({
        title:
          'Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.',
        status: 'success',
        position: 'top',
      });
      onComplete();
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  if (!isActive) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!!errors.password} mb="4">
        <FormLabel
          ms="4px"
          fontSize="sm"
          fontWeight="500"
          color={'main'}
          display="flex">
          Yeni Şifre<Text color={'primary.700'}>*</Text>
        </FormLabel>
        <InputGroup size="md">
          <Input
            fontSize="sm"
            placeholder="Yeni Şifre"
            size="md"
            type={show.isOpen ? 'text' : 'password'}
            variant="auth"
            {...register('password')}
          />
          <InputRightElement display="flex" alignItems="center" mt="4px">
            <Icon
              color={'gray.600'}
              _hover={{cursor: 'pointer'}}
              as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
              onClick={show.toggle}
            />
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors.passwordConfirm} mb="4">
        <FormLabel
          ms="4px"
          fontSize="sm"
          fontWeight="500"
          color={'main'}
          display="flex">
          Yeni Şifre Onay<Text color={'primary.700'}>*</Text>
        </FormLabel>
        <InputGroup size="md">
          <Input
            fontSize="sm"
            placeholder="Yeni Şifre Onay"
            size="md"
            type={show.isOpen ? 'text' : 'password'}
            variant="auth"
            {...register('passwordConfirm')}
          />
          <InputRightElement display="flex" alignItems="center" mt="4px">
            <Icon
              color={'gray.600'}
              _hover={{cursor: 'pointer'}}
              as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
              onClick={show.toggle}
            />
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage>{errors.passwordConfirm?.message}</FormErrorMessage>
      </FormControl>
      <Button
        fontSize="sm"
        colorScheme="primary"
        fontWeight="500"
        w={'full'}
        isLoading={isPending}
        isDisabled={isPending}
        type="submit"
        mb="24px">
        Şifreyi Değiştir
      </Button>
    </form>
  );
};

export default ResetStep;
