import {Outlet} from 'react-router-dom';
import {Box} from '@chakra-ui/react';

const RootLayout = () => {
  return (
    <Box
      display="flex"
      flexDirection={'column'}
      w={'100vw'}
      minH={'100vh'}
      backgroundColor={'gray.100'}>
      <Outlet />
    </Box>
  );
};

export default RootLayout;
