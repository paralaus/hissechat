import {defineStyleConfig} from '@chakra-ui/react';

export const Button = defineStyleConfig({
  // The styles all button have in common
  baseStyle: {
    fontWeight: 'bold',
    height: '42px',
  },
  // Two sizes: sm and md
  defaultProps: {},
});
