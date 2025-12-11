import { mode } from '@chakra-ui/theme-tools';

export const inputStyles = {
  components: {
    Input: {
      baseStyle: {
        field: {
          fontWeight: 400,
          borderRadius: 'lg',
        },
      },
      sizes: {
        sm: {
          field: {
            fontSize: 'sm',
            px: 3,
            height: '36px',
          },
        },
        md: {
          field: {
            fontSize: 'sm',
            px: 4,
            height: '42px',
          },
        },
        lg: {
          field: {
            fontSize: 'md',
            px: 4,
            height: '48px',
          },
        },
      },
      variants: {
        outline: props => ({
          field: {
            bg: mode('white', 'gray.800')(props),
            border: '1.5px solid',
            borderColor: mode('gray.200', 'gray.600')(props),
            color: mode('gray.800', 'white')(props),
            borderRadius: 'lg',
            _placeholder: { 
              color: mode('gray.400', 'gray.500')(props),
            },
            _hover: {
              borderColor: mode('gray.300', 'gray.500')(props),
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
            _invalid: {
              borderColor: 'error.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-error-500)',
            },
          },
        }),
        filled: props => ({
          field: {
            bg: mode('gray.100', 'gray.700')(props),
            border: '1.5px solid',
            borderColor: 'transparent',
            color: mode('gray.800', 'white')(props),
            borderRadius: 'lg',
            _placeholder: { 
              color: mode('gray.500', 'gray.400')(props),
            },
            _hover: {
              bg: mode('gray.200', 'gray.600')(props),
            },
            _focus: {
              bg: mode('white', 'gray.800')(props),
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        }),
        auth: props => ({
          field: {
            fontWeight: '400',
            color: mode('gray.800', 'white')(props),
            bg: mode('white', 'gray.800')(props),
            border: '1.5px solid',
            borderColor: mode('gray.200', 'gray.600')(props),
            borderRadius: 'lg',
            _placeholder: { 
              color: mode('gray.400', 'gray.500')(props),
            },
            _hover: {
              borderColor: mode('gray.300', 'gray.500')(props),
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        }),
      },
      defaultProps: {
        size: 'md',
        variant: 'outline',
      },
    },
    Textarea: {
      baseStyle: {
        fontWeight: 400,
        borderRadius: 'lg',
      },
      variants: {
        outline: props => ({
          bg: mode('white', 'gray.800')(props),
          border: '1.5px solid',
          borderColor: mode('gray.200', 'gray.600')(props),
          color: mode('gray.800', 'white')(props),
          borderRadius: 'lg',
          _placeholder: { 
            color: mode('gray.400', 'gray.500')(props),
          },
          _hover: {
            borderColor: mode('gray.300', 'gray.500')(props),
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        }),
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Select: {
      baseStyle: {
        field: {
          fontWeight: 400,
          borderRadius: 'lg',
        },
      },
      variants: {
        outline: props => ({
          field: {
            bg: mode('white', 'gray.800')(props),
            border: '1.5px solid',
            borderColor: mode('gray.200', 'gray.600')(props),
            color: mode('gray.800', 'white')(props),
            borderRadius: 'lg',
            _hover: {
              borderColor: mode('gray.300', 'gray.500')(props),
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: 'sm',
        fontWeight: 'medium',
        color: 'gray.700',
        mb: 1.5,
      },
    },
  },
};
