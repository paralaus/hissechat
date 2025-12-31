import React, { useEffect } from 'react';
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
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

  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['market-chart', marketCode],
    queryFn: () => api.getChartData(marketCode, market?.type || 'stock', '1m').then(res => res.data),
    enabled: !!marketCode && isOpen && isMarket && !!market,
  });

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

          {/* Chart Section */}
          <Box h="300px" w="100%" bg="white" borderRadius="lg" p={4} border="1px solid" borderColor="gray.200">
            {isChartLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" h="100%">
                <Spinner size="lg" />
              </Box>
            ) : chartData?.dataPoints ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.dataPoints}
                  margin={{
                    top: 10,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? "#48BB78" : "#F56565"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={isUp ? "#48BB78" : "#F56565"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    hide={true} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right" 
                    tick={{fontSize: 12, fill: '#718096'}} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    labelStyle={{color: '#718096', marginBottom: '4px'}}
                    itemStyle={{color: '#2D3748', fontWeight: 'bold'}}
                    formatter={(value) => [`${value.toFixed(2)} ₺`, 'Fiyat']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isUp ? "#48BB78" : "#F56565"} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" h="100%">
                <Text color="gray.500">Grafik verisi bulunamadı.</Text>
              </Box>
            )}
          </Box>

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
