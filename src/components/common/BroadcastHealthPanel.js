import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  HStack,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from '@chakra-ui/react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../api';

const STATUS_BADGE = {
  ok: {colorScheme: 'green', label: 'Sağlıklı'},
  warning: {colorScheme: 'orange', label: 'Uyarı'},
  critical: {colorScheme: 'red', label: 'Kritik'},
};

const formatNumber = value => Number(value || 0).toLocaleString('tr-TR');

const waitingOf = counts => (counts ? (counts.waiting || 0) + (counts.delayed || 0) : null);

/**
 * Broadcast pipeline health: last-24h outcomes, FCM success rate, queue
 * backlogs and active alerts (same thresholds as the backend alarm job).
 */
const BroadcastHealthPanel = () => {
  const {data, isError} = useQuery({
    queryKey: ['broadcast-health'],
    queryFn: async () => {
      const {data: health} = await api.getBroadcastHealth();
      return health;
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  if (isError) {
    return (
      <Alert status="info" borderRadius="md" mb={4}>
        <AlertIcon />
        Gönderim sağlık bilgisi alınamadı.
      </Alert>
    );
  }
  if (!data) return null;

  const badge = STATUS_BADGE[data.status] || STATUS_BADGE.ok;
  const {broadcasts = {}, queues = {}} = data;
  const fcm = broadcasts.fcm || {};
  const failed = broadcasts.byStatus?.failed || 0;
  const backlog = [queues.bulkMessages, queues.adminPush].reduce(
    (sum, counts) => sum + (waitingOf(counts) || 0),
    0,
  );

  return (
    <Box borderWidth="1px" borderRadius="md" p={4} mb={4}>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold">Gönderim sağlığı (son 24 saat)</Text>
        <Badge colorScheme={badge.colorScheme}>{badge.label}</Badge>
      </HStack>
      <SimpleGrid columns={{base: 2, md: 4}} spacing={4}>
        <Stat>
          <StatLabel>Toplu gönderim</StatLabel>
          <StatNumber>{formatNumber(broadcasts.total)}</StatNumber>
          <StatHelpText>{formatNumber(failed)} başarısız</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>FCM başarı oranı</StatLabel>
          <StatNumber>
            {fcm.successRate === null || fcm.successRate === undefined
              ? '—'
              : `%${(fcm.successRate * 100).toFixed(1)}`}
          </StatNumber>
          <StatHelpText>{formatNumber(fcm.attempted)} token</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Geçersiz / vazgeçilen</StatLabel>
          <StatNumber>
            {formatNumber(fcm.invalidToken)} / {formatNumber(fcm.gaveUp)}
          </StatNumber>
          <StatHelpText>{formatNumber(fcm.retried)} token yeniden denendi</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Bekleyen iş</StatLabel>
          <StatNumber>{formatNumber(backlog)}</StatNumber>
          <StatHelpText>{formatNumber(waitingOf(queues.pushBatches))} FCM partisi</StatHelpText>
        </Stat>
      </SimpleGrid>
      {data.alerts?.length > 0 && (
        <VStack align="stretch" spacing={2} mt={4}>
          {data.alerts.map(alert => (
            <Alert
              key={alert.code}
              status={alert.level === 'critical' ? 'error' : 'warning'}
              borderRadius="md">
              <AlertIcon />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default BroadcastHealthPanel;
