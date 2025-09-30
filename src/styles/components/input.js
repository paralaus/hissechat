import {mode} from '@chakra-ui/theme-tools';

export const inputStyles = {
  components: {
    Input: {
      baseStyle: {
        field: {
          fontWeight: 500,
          borderRadius: '8px',
          height: '42px',
        },
      },
      variants: {
        main: props => ({
          field: {
            bg: mode('transparent', 'navy.800')(props),
            border: '1px solid',
            color: mode('secondaryGray.900', 'white')(props),
            borderColor: mode('secondaryGray.100', 'whiteAlpha.100')(props),
            borderRadius: '16px',
            fontSize: 'sm',
            p: '20px',
            _placeholder: {color: 'secondaryGray.600'},
          },
        }),
        auth: props => ({
          field: {
            fontWeight: '500',
            color: mode('black', 'white')(props),
            bg: mode('transparent', 'transparent')(props),
            border: '1px solid',
            borderColor: mode('gray.300', 'rgba(135, 140, 189, 0.3)')(props),
            borderRadius: '8px',
            _placeholder: {color: 'gray.600', fontWeight: '400'},
            backgroundColor: mode('white', 'primary.800')(props),
          },
        }),
      },
    },
  },
};
