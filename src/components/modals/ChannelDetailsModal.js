import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  Divider,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { getCombinedLogoUrl } from '../../utils/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ChannelDetailsModal = ({ isOpen, onClose, channel }) => {
  const isMarket = channel?.type === 'market';
  const marketCode = channel?.marketCode;

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['market-details', marketCode],
    queryFn: () => api.getMarketDetail(marketCode).then(res => res.data),
    enabled: !!marketCode && isOpen && isMarket,
  });

  const market = marketData;

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" py={10}>
          <Spinner size="xl" />
        </Box>
      );
    }

    if (isMarket && market) {
      const isUp = (market.rate || 0) >= 0;
      
      return (
        <VStack spacing={6} align="stretch">
          {/* Header Section */}
          <VStack align="center" spacing={4}>
            <Avatar 
              size="2xl" 
              src={getCombinedLogoUrl(market.logo)} 
              name={market.name} 
              borderWidth={2}
              borderColor="gray.200"
            />
            <VStack align="center" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                {market.name}
              </Text>
              <Badge colorScheme="blue" fontSize="md" px={2} py={0.5} borderRadius="md">
                {market.code}
              </Badge>
            </VStack>
          </VStack>

          <Divider />

          {/* Price Section */}
          <HStack justify="space-around" spacing={8} bg="gray.50" p={4} borderRadius="lg">
            <Stat textAlign="center">
              <StatLabel color="gray.500">Fiyat</StatLabel>
              <StatNumber fontSize="3xl">
                {market.price?.toFixed(2)} ₺
              </StatNumber>
              <StatHelpText>
                {format(new Date(), 'dd MMMM HH:mm', { locale: tr })}
              </StatHelpText>
            </Stat>
            
            <Stat textAlign="center">
              <StatLabel color="gray.500">Değişim</StatLabel>
              <StatNumber fontSize="3xl" color={isUp ? 'green.500' : 'red.500'}>
                <StatArrow type={isUp ? 'increase' : 'decrease'} />
                {Math.abs(market.rate || 0).toFixed(2)}%
              </StatNumber>
              <StatHelpText>
                Günlük
              </StatHelpText>
            </Stat>
          </HStack>

          {/* Info Section */}
          {market.about && (
            <Box>
              <Text fontWeight="bold" mb={2} fontSize="lg">Hakkında</Text>
              <Text color="gray.600" noOfLines={isOpen ? undefined : 3}>
                {market.about}
              </Text>
            </Box>
          )}

          {/* Additional Details */}
          <VStack spacing={3} bg="gray.50" p={4} borderRadius="lg">
            {market.sector && (
              <HStack justify="space-between">
                <Text color="gray.500">Sektör</Text>
                <Text fontWeight="medium">{market.sector}</Text>
              </HStack>
            )}
            {market.type && (
              <HStack justify="space-between">
                <Text color="gray.500">Piyasa Tipi</Text>
                <Text fontWeight="medium">{market.type}</Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      );
    }

    return (
      <Box py={10} textAlign="center">
        <Text color="gray.500">Detay bilgisi bulunamadı.</Text>
      </Box>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent borderRadius="xl">
        <ModalHeader borderBottomWidth="1px" borderColor="gray.100">
          Detaylar
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          {renderContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ChannelDetailsModal;
