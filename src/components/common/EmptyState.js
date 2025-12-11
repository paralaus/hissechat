import { Box, Flex, Text, Icon, Button } from '@chakra-ui/react';
import { FiInbox, FiSearch, FiAlertCircle, FiPlus } from 'react-icons/fi';

/**
 * Boş durum bileşeni
 * @param {Object} props
 * @param {React.ElementType} props.icon - İkon bileşeni
 * @param {string} props.title - Başlık
 * @param {string} props.description - Açıklama
 * @param {string} props.actionLabel - Buton metni
 * @param {Function} props.onAction - Buton tıklama işlevi
 * @param {string} props.variant - 'default' | 'search' | 'error'
 */
const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  variant = 'default',
  ...props
}) => {
  // Varyanta göre varsayılan değerler
  const variants = {
    default: {
      icon: FiInbox,
      iconBg: 'gray.100',
      iconColor: 'gray.400',
      title: 'Kayıt Bulunamadı',
      description: 'Henüz bu alanda kayıt bulunmuyor.',
    },
    search: {
      icon: FiSearch,
      iconBg: 'blue.50',
      iconColor: 'blue.400',
      title: 'Sonuç Bulunamadı',
      description: 'Arama kriterlerinize uygun sonuç bulunamadı. Farklı anahtar kelimeler deneyin.',
    },
    error: {
      icon: FiAlertCircle,
      iconBg: 'red.50',
      iconColor: 'red.400',
      title: 'Bir Hata Oluştu',
      description: 'Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
    },
  };

  const currentVariant = variants[variant] || variants.default;
  const IconComponent = icon || currentVariant.icon;
  const displayTitle = title || currentVariant.title;
  const displayDescription = description || currentVariant.description;

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py="16"
      px="8"
      {...props}
    >
      <Box
        p="4"
        bg={currentVariant.iconBg}
        borderRadius="full"
        mb="4"
      >
        <Icon 
          as={IconComponent} 
          boxSize="8" 
          color={currentVariant.iconColor} 
        />
      </Box>
      
      <Text 
        fontSize="lg" 
        fontWeight="semibold" 
        color="gray.700" 
        mb="1"
        textAlign="center"
      >
        {displayTitle}
      </Text>
      
      <Text 
        fontSize="sm" 
        color="gray.500" 
        textAlign="center" 
        maxW="sm" 
        mb={actionLabel ? '4' : '0'}
      >
        {displayDescription}
      </Text>
      
      {actionLabel && onAction && (
        <Button
          colorScheme="brand"
          size="sm"
          onClick={onAction}
          leftIcon={actionIcon ? <Icon as={actionIcon} /> : <Icon as={FiPlus} />}
        >
          {actionLabel}
        </Button>
      )}
    </Flex>
  );
};

/**
 * Tablo için boş durum
 */
export const TableEmptyState = ({ 
  title = 'Kayıt bulunamadı',
  description = 'Bu tabloda henüz kayıt bulunmuyor.',
  actionLabel,
  onAction,
}) => {
  return (
    <EmptyState
      icon={FiInbox}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      py="12"
    />
  );
};

/**
 * Arama sonucu boş durumu
 */
export const SearchEmptyState = ({ 
  query,
  onClear,
}) => {
  return (
    <EmptyState
      variant="search"
      title="Sonuç bulunamadı"
      description={query ? `"${query}" için sonuç bulunamadı.` : 'Arama sonucu bulunamadı.'}
      actionLabel={onClear ? "Aramayı Temizle" : undefined}
      onAction={onClear}
      actionIcon={FiSearch}
    />
  );
};

/**
 * Hata durumu
 */
export const ErrorState = ({ 
  title = 'Bir hata oluştu',
  description = 'Veriler yüklenirken bir hata oluştu.',
  onRetry,
}) => {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      actionLabel={onRetry ? "Tekrar Dene" : undefined}
      onAction={onRetry}
    />
  );
};

export default EmptyState;

