import {defineStyleConfig} from '@chakra-ui/react';

const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'lg',
    transition: 'all 0.2s ease',
  },
  sizes: {
    sm: {
      fontSize: 'sm',
      px: 4,
      py: 2,
      height: '36px',
    },
    md: {
      fontSize: 'sm',
      px: 5,
      py: 2.5,
      height: '42px',
    },
    lg: {
      fontSize: 'md',
      px: 6,
      py: 3,
      height: '48px',
    },
  },
  variants: {
    solid: {
      bg: 'brand.500',
      color: 'white',
      _hover: {
        bg: 'brand.600',
        transform: 'translateY(-1px)',
        boxShadow: 'md',
        _disabled: {
          bg: 'brand.500',
          transform: 'none',
        },
      },
      _active: {
        bg: 'brand.700',
        transform: 'translateY(0)',
      },
    },
    outline: {
      border: '1.5px solid',
      borderColor: 'gray.200',
      color: 'gray.700',
      bg: 'white',
      _hover: {
        bg: 'gray.50',
        borderColor: 'gray.300',
      },
      _active: {
        bg: 'gray.100',
      },
    },
    ghost: {
      color: 'gray.600',
      _hover: {
        bg: 'gray.100',
        color: 'gray.800',
      },
      _active: {
        bg: 'gray.200',
      },
    },
    danger: {
      bg: 'error.500',
      color: 'white',
      _hover: {
        bg: 'error.600',
        transform: 'translateY(-1px)',
        boxShadow: 'md',
      },
      _active: {
        bg: 'error.600',
        transform: 'translateY(0)',
      },
    },
    success: {
      bg: 'success.500',
      color: 'white',
      _hover: {
        bg: 'success.600',
        transform: 'translateY(-1px)',
        boxShadow: 'md',
      },
      _active: {
        bg: 'success.600',
        transform: 'translateY(0)',
      },
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
});

export const buttonStyles = {
  components: {
    Button,
  },
};

// Backward compatibility
export {Button};
