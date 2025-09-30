import React, {useState} from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  PinInput,
  PinInputField,
  Text,
  useToast,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useMutation} from '@tanstack/react-query';
import {getErrorMessage} from '../../utils/string';
import {api} from '../../api';

const schema = yup
  .object({
    token: yup.string().required('Bu alan zorunludur.'),
  })
  .required();

const CodeStep = ({onComplete, isActive, data = {}}) => {
  const toast = useToast();
  const [lastSent, setLastSent] = useState(Date.now());

  const {
    setValue,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: api.verifyResetPassword,
  });

  const {mutateAsync: resend, isPending: isResending} = useMutation({
    mutationFn: api.forgotPassword,
  });

  const onSubmit = async values => {
    try {
      const body = {
        email: data.email,
        token: values.token,
      };
      await mutateAsync(body);
      toast({
        title: 'Kod onaylandı. Yeni şifrenizi belirleyebilirsiniz.',
        status: 'success',
        position: 'top',
      });
      onComplete(body);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const onResend = async () => {
    try {
      if (Date.now() - lastSent < 30_000) {
        toast({
          title: 'Lütfen biraz bekleyiniz.',
          status: 'error',
          position: 'top',
          isClosable: true,
        });
        return;
      }

      await resend({email: data.email});
      setLastSent(Date.now());
      toast({
        title: 'Yeni kod gönderildi.',
        status: 'success',
        position: 'top',
      });
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
      <FormControl isInvalid={!!errors.token} mb="4">
        <FormLabel
          display="flex"
          ms="4px"
          fontSize="sm"
          fontWeight="500"
          color={'main'}
          mb="8px">
          Kod<Text color={'primary.700'}>*</Text>
        </FormLabel>
        <Flex justifyContent={'center'} my={'6'}>
          <PinInput
            otp
            onComplete={values => {
              setValue('token', values);
              onSubmit({token: values});
            }}>
            <PinInputField bg={'white'} mx={'1'} height={'16'} width={'16'} />
            <PinInputField bg={'white'} mx={'1'} height={'16'} width={'16'} />
            <PinInputField bg={'white'} mx={'1'} height={'16'} width={'16'} />
            <PinInputField bg={'white'} mx={'1'} height={'16'} width={'16'} />
          </PinInput>
        </Flex>
        <FormErrorMessage>{errors.token?.message}</FormErrorMessage>
      </FormControl>
      <Flex justifyContent={'center'}>
        <Button
          colorScheme="primary"
          fontWeight="500"
          isLoading={isResending}
          isDisabled={isResending}
          type={'button'}
          onClick={onResend}
          fontSize="sm"
          variant={'ghost'}>
          Tekrar Gönder
        </Button>
      </Flex>
      <Button
        mt={'4'}
        fontSize="sm"
        colorScheme="primary"
        w={'full'}
        fontWeight="500"
        isLoading={isPending}
        isDisabled={isPending}
        type="submit"
        mb="24px">
        Onayla
      </Button>
    </form>
  );
};

export default CodeStep;
