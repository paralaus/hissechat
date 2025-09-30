import React from 'react';
import {NavLink, useNavigate} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
} from '@chakra-ui/react';
import {MdOutlineRemoveRedEye} from 'react-icons/md';
import {RiEyeCloseLine} from 'react-icons/ri';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation} from '@tanstack/react-query';
import * as yup from 'yup';

import {api, setAuthToken} from '../../api';
import {getErrorMessage} from '../../utils/string';
import {useUserStore} from '../../store';
import Cookies from 'js-cookie';
import useDisclosure from '../../hooks/useDisclosure';
import {routes} from '../../config/routes';

const schema = yup
  .object({
    email: yup
      .string()
      .email('Geçersiz e-posta adresi.')
      .required('Bu alan zorunludur.'),
    password: yup.string().required('Bu alan zorunludur.'),
  })
  .required();

const textColor = 'main';
const textColorSecondary = 'gray.600';
const textColorBrand = 'primary.700';
const brandStars = 'primary.700';

const Login = () => {
  const navigate = useNavigate();
  const show = useDisclosure();
  const toast = useToast();
  const setUser = useUserStore(state => state.setUser);

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: api.login,
  });

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(values);
      if (data) {
        toast({
          title: 'Giriş başarılı.',
          status: 'success',
          position: 'top',
        });
        setUser(data.user);
        Cookies.set('token', data.tokens.access.token, {
          expires: new Date(data.tokens.access.expires),
        });
        setAuthToken(data.tokens.access.token);
        navigate(routes.dashboard.path);
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
    <Box
      display={'flex'}
      flex="1"
      justifyContent={'center'}
      alignItems={'center'}>
      <Flex
        maxW={{base: '100%', md: 'max-content'}}
        flex={1}
        display={'flex'}
        mx={{base: '4', md: 'auto'}}
        justifyContent="center"
        mb={{base: '30px', md: '60px'}}
        mt={{base: '40px', md: '14vh'}}
        flexDirection="column"
        p={{base: '6', md: '10'}}
        borderRadius={'md'}>
        <Box textAlign={'start'}>
          <Heading color={textColor} fontSize="3xl" mb="10px">
            Giriş Yap
          </Heading>
          <Text
            mb="36px"
            color={textColorSecondary}
            fontWeight="500"
            fontSize="md">
            E-posta ve şifrenizle giriş yapın.
          </Text>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex
            zIndex="2"
            direction="column"
            w={{base: '100%', md: '420px'}}
            maxW="100%"
            background="transparent"
            borderRadius="md"
            mx={{base: 'auto', lg: 'unset'}}
            me="auto"
            mb={{base: '20px', md: 'auto'}}>
            <FormControl isInvalid={!!errors.email} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px">
                E-Posta<Text color={brandStars}>*</Text>
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
            <FormControl isInvalid={!!errors.password} mb="4">
              <FormLabel
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                display="flex">
                Şifre<Text color={brandStars}>*</Text>
              </FormLabel>
              <InputGroup size="md">
                <Input
                  fontSize="sm"
                  placeholder="Şifreniz"
                  size="md"
                  type={show.isOpen ? 'text' : 'password'}
                  variant="auth"
                  {...register('password')}
                />
                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    color={textColorSecondary}
                    _hover={{cursor: 'pointer'}}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={show.toggle}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            <Flex justifyContent="space-between" align="center" mb="24px">
              <NavLink to="/auth/forgot-password">
                <Text
                  color={textColorBrand}
                  fontSize="sm"
                  w="124px"
                  fontWeight="600">
                  Şifremi Unuttum?
                </Text>
              </NavLink>
            </Flex>
            <Button
              isLoading={isPending}
              colorScheme={'primary'}
              isDisabled={isPending}
              type="submit"
              fontSize={'sm'}>
              Giriş Yap
            </Button>
          </Flex>
        </form>
      </Flex>
    </Box>
  );
};

export default Login;
