import React from 'react';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../utils/string';
import {api} from '../../api';

const schema = yup
  .object({
    email: yup
      .string()
      .email('Geçersiz e-posta adresi.')
      .required('Bu alan zorunludur.'),
  })
  .required();

const StartStep = ({onComplete, isActive}) => {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: api.forgotPassword,
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(values);
      toast({
        title: 'E-posta adresinizi kontrol ediniz.',
        status: 'success',
        position: 'top',
      });
      onComplete({email: values.email});
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
      <FormControl isInvalid={!!errors.email} mb="4">
        <FormLabel
          display="flex"
          ms="4px"
          fontSize="sm"
          fontWeight="500"
          color={'main'}
          mb="8px">
          E-Posta<Text color={'primary.700'}>*</Text>
        </FormLabel>
        <Input
          variant="auth"
          fontSize="sm"
          type="email"
          placeholder="example@email.com"
          fontWeight="500"
          size="md"
          {...register('email')}
        />
        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
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
        Kod Gönder
      </Button>
    </form>
  );
};

export default StartStep;
