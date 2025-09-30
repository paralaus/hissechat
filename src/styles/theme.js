import {extendTheme} from '@chakra-ui/react';
import {inputStyles} from './components/input';
import {Button} from './components/button';

const colors = {
  main: '#4644a4',
  primary: {
    50: '#bcbbf4',
    100: '#a3a2ec',
    200: '#8b8ae3',
    300: '#7574d8',
    400: '#615fcb',
    500: '#4e4cbd',
    600: '#4644a4',
    700: '#3d3b8e',
    800: '#3a397a',
    900: '#383769',
  },
};

export const theme = extendTheme(
  {
    colors,
    sizes: {
      height: '42px',
    },
    components: {
      Button,
    },
  },
  inputStyles,
);
