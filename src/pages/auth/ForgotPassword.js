import React, {useState} from 'react';
import {NavLink, useNavigate} from 'react-router-dom';
import {Box, Flex, Heading, Text} from '@chakra-ui/react';
import {CodeStep, ResetStep, StartStep} from '../../components';
import {routes} from '../../config/routes';

const textColor = 'main';
const textColorSecondary = 'gray.600';
const textColorBrand = 'primary.700';

const steps = {
  start: 'start',
  code: 'code',
  reset: 'reset',
};

const ForgotPassword = () => {
  const [step, setStep] = useState(steps.start);
  const [data, setData] = useState({});
  const navigate = useNavigate();

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
        // bg="white"
        // boxShadow={'md'}
        borderRadius={'md'}>
        <Box me="auto">
          <Heading color={textColor} fontSize="36px" mb="10px">
            Şifre Sıfırlama
          </Heading>
          <Text
            mb="36px"
            ms="4px"
            color={textColorSecondary}
            fontWeight="400"
            fontSize="md">
            Kayıtlı e-posta adresinizi girerek şifrenizi sıfırlayabilirsiniz.
          </Text>
        </Box>
        <Flex
          zIndex="2"
          direction="column"
          w={{base: '100%', md: '420px'}}
          maxW="100%"
          background="transparent"
          borderRadius="15px"
          mx={{base: 'auto', lg: 'unset'}}
          me="auto"
          mb={{base: '20px', md: 'auto'}}>
          <StartStep
            isActive={step === steps.start}
            onComplete={values => {
              setStep(steps.code);
              setData(values);
            }}
          />
          <CodeStep
            data={data}
            isActive={step === steps.code}
            onComplete={values => {
              setStep(steps.reset);
              setData(values);
            }}
          />
          <ResetStep
            data={data}
            isActive={step === steps.reset}
            onComplete={values => {
              navigate(routes.login.path);
            }}
          />
          <Flex justifyContent="space-between" align="center">
            <NavLink to="/auth/login">
              <Text
                color={textColorBrand}
                fontSize="sm"
                w="124px"
                fontWeight="500">
                Giriş'e Dön
              </Text>
            </NavLink>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
};

export default ForgotPassword;
