import { 
  Box, 
  Skeleton, 
  SkeletonText, 
  SkeletonCircle,
  SimpleGrid,
  HStack,
  VStack,
  Flex,
} from '@chakra-ui/react';

/**
 * Tablo için skeleton loading
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      border="1px"
      borderColor="gray.100"
      overflow="hidden"
    >
      {/* Header */}
      <Box p="4" borderBottom="1px" borderColor="gray.100" bg="gray.50">
        <HStack spacing="4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="16px" width="100px" borderRadius="md" />
          ))}
        </HStack>
      </Box>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box 
          key={rowIndex} 
          p="4" 
          borderBottom="1px" 
          borderColor="gray.100"
        >
          <HStack spacing="4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                height="20px" 
                width={colIndex === 0 ? '150px' : '100px'} 
                borderRadius="md" 
              />
            ))}
          </HStack>
        </Box>
      ))}

      {/* Pagination */}
      <Flex p="4" justify="space-between" align="center">
        <Skeleton height="20px" width="120px" borderRadius="md" />
        <HStack spacing="2">
          <Skeleton height="32px" width="32px" borderRadius="md" />
          <Skeleton height="32px" width="32px" borderRadius="md" />
          <Skeleton height="32px" width="60px" borderRadius="md" />
          <Skeleton height="32px" width="32px" borderRadius="md" />
          <Skeleton height="32px" width="32px" borderRadius="md" />
        </HStack>
      </Flex>
    </Box>
  );
};

/**
 * İstatistik kartları için skeleton
 */
export const StatisticsSkeleton = ({ count = 4 }) => {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing="6">
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          bg="white"
          borderRadius="xl"
          p="5"
          border="1px"
          borderColor="gray.100"
        >
          <Flex justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing="2" flex="1">
              <Skeleton height="14px" width="80px" borderRadius="md" />
              <Skeleton height="28px" width="100px" borderRadius="md" />
              <HStack spacing="2">
                <Skeleton height="16px" width="50px" borderRadius="full" />
                <Skeleton height="12px" width="60px" borderRadius="md" />
              </HStack>
            </VStack>
            <Skeleton height="48px" width="48px" borderRadius="xl" />
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
};

/**
 * Kart için skeleton
 */
export const CardSkeleton = ({ hasImage = false, lines = 3 }) => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      border="1px"
      borderColor="gray.100"
      overflow="hidden"
    >
      {hasImage && (
        <Skeleton height="160px" width="100%" />
      )}
      <Box p="5">
        <Skeleton height="20px" width="60%" mb="3" borderRadius="md" />
        <SkeletonText noOfLines={lines} spacing="2" skeletonHeight="14px" />
      </Box>
    </Box>
  );
};

/**
 * Liste için skeleton
 */
export const ListSkeleton = ({ rows = 5, hasAvatar = false }) => {
  return (
    <VStack spacing="3" align="stretch">
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          bg="white"
          borderRadius="lg"
          p="4"
          border="1px"
          borderColor="gray.100"
        >
          <HStack spacing="4">
            {hasAvatar && <SkeletonCircle size="10" />}
            <VStack align="flex-start" spacing="2" flex="1">
              <Skeleton height="16px" width="40%" borderRadius="md" />
              <Skeleton height="12px" width="60%" borderRadius="md" />
            </VStack>
            <Skeleton height="24px" width="60px" borderRadius="md" />
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};

/**
 * Form için skeleton
 */
export const FormSkeleton = ({ fields = 4 }) => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      p="6"
      border="1px"
      borderColor="gray.100"
    >
      <VStack spacing="5" align="stretch">
        {Array.from({ length: fields }).map((_, i) => (
          <Box key={i}>
            <Skeleton height="14px" width="100px" mb="2" borderRadius="md" />
            <Skeleton height="42px" width="100%" borderRadius="lg" />
          </Box>
        ))}
        <Box pt="4">
          <Skeleton height="42px" width="120px" borderRadius="lg" />
        </Box>
      </VStack>
    </Box>
  );
};

/**
 * Profil kartı için skeleton
 */
export const ProfileSkeleton = () => {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      p="6"
      border="1px"
      borderColor="gray.100"
      textAlign="center"
    >
      <SkeletonCircle size="20" mx="auto" mb="4" />
      <Skeleton height="24px" width="60%" mx="auto" mb="2" borderRadius="md" />
      <Skeleton height="16px" width="40%" mx="auto" mb="4" borderRadius="md" />
      <HStack justify="center" spacing="4">
        <Skeleton height="32px" width="80px" borderRadius="lg" />
        <Skeleton height="32px" width="80px" borderRadius="lg" />
      </HStack>
    </Box>
  );
};

/**
 * Detay sayfası için skeleton
 */
export const DetailPageSkeleton = () => {
  return (
    <VStack spacing="6" align="stretch">
      {/* Başlık */}
      <HStack justify="space-between">
        <VStack align="flex-start" spacing="2">
          <Skeleton height="32px" width="200px" borderRadius="md" />
          <Skeleton height="16px" width="300px" borderRadius="md" />
        </VStack>
        <HStack spacing="2">
          <Skeleton height="40px" width="100px" borderRadius="lg" />
          <Skeleton height="40px" width="100px" borderRadius="lg" />
        </HStack>
      </HStack>

      {/* İçerik */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing="6">
        <Box gridColumn={{ lg: 'span 2' }}>
          <FormSkeleton fields={6} />
        </Box>
        <Box>
          <ProfileSkeleton />
        </Box>
      </SimpleGrid>
    </VStack>
  );
};






