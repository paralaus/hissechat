import React from 'react';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  HStack,
  Icon,
} from '@chakra-ui/react';
import {FiTrendingUp, FiTrendingDown} from 'react-icons/fi';
import {isValue} from '../../utils/string';

const MiniStatistics = ({
  title,
  amount,
  percentage,
  icon,
  trend, // 'up' | 'down'
  trendLabel = 'geçen aya göre',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');

  // percentage'dan trend hesapla
  const calculatedTrend =
    trend || (percentage > 0 ? 'up' : percentage < 0 ? 'down' : null);
  const trendColor = calculatedTrend === 'up' ? 'green.500' : 'red.500';
  const trendBgColor = calculatedTrend === 'up' ? 'green.50' : 'red.50';

  // Sayıyı formatla
  const formatNumber = num => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString('tr-TR');
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      p="5"
      boxShadow="card"
      border="1px"
      borderColor="gray.100"
      transition="all 0.2s ease"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-2px)',
      }}>
      <Flex justify="space-between" align="flex-start">
        <Box flex="1">
          {title && (
            <Text
              fontSize="sm"
              color={subtleTextColor}
              fontWeight="medium"
              mb="1">
              {title}
            </Text>
          )}

          {isValue(amount) && (
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="1.2">
              {formatNumber(amount)}
            </Text>
          )}

          {isValue(percentage) && (
            <HStack mt="2" spacing="1.5">
              <HStack
                spacing="1"
                bg={trendBgColor}
                px="2"
                py="0.5"
                borderRadius="full">
                <Icon
                  as={calculatedTrend === 'up' ? FiTrendingUp : FiTrendingDown}
                  color={trendColor}
                  fontSize="xs"
                />
                <Text fontSize="xs" fontWeight="semibold" color={trendColor}>
                  {percentage > 0 ? '+' : ''}
                  {percentage}%
                </Text>
              </HStack>
              <Text fontSize="xs" color={subtleTextColor}>
                {trendLabel}
              </Text>
            </HStack>
          )}
        </Box>

        {icon && (
          <Box
            p="3"
            borderRadius="xl"
            bgGradient="linear(to-br, brand.400, brand.600)"
            boxShadow="md">
            {icon}
          </Box>
        )}
      </Flex>
    </Box>
  );
};

// Basit istatistik kartı (sadece sayı ve başlık)
export const SimpleStatCard = ({title, value, icon, color = 'brand'}) => {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      p="5"
      boxShadow="card"
      border="1px"
      borderColor="gray.100"
      transition="all 0.2s ease"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-2px)',
      }}>
      <HStack spacing="4">
        {icon && (
          <Box p="3" borderRadius="lg" bg={`${color}.50`}>
            <Icon as={icon} color={`${color}.500`} boxSize="5" />
          </Box>
        )}
        <Box>
          <Text fontSize="sm" color="gray.500" fontWeight="medium">
            {title}
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
};

// Renkli istatistik kartı
export const ColoredStatCard = ({
  title,
  value,
  icon,
  colorScheme = 'brand',
  subtitle,
}) => {
  return (
    <Box
      bgGradient={`linear(to-br, ${colorScheme}.500, ${colorScheme}.600)`}
      borderRadius="xl"
      p="5"
      boxShadow="lg"
      color="white"
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'xl',
      }}>
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="sm" opacity="0.9" fontWeight="medium" mb="1">
            {title}
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
          </Text>
          {subtitle && (
            <Text fontSize="xs" opacity="0.8" mt="1">
              {subtitle}
            </Text>
          )}
        </Box>
        {icon && (
          <Box p="3" borderRadius="xl" bg="whiteAlpha.200">
            {icon}
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default MiniStatistics;
