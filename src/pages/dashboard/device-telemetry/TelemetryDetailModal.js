import React from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';

const formatValue = value => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const renderJson = value => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
};

const TelemetryDetailModal = ({isOpen, onClose, event}) => {
  if (!event) {
    return null;
  }

  const user = event.user && typeof event.user === 'object' ? event.user : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cihaz Telemetri Detayı</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <HStack spacing={4} p={4} bg="gray.50" borderRadius="md" align="center">
              <Avatar
                size="md"
                name={user?.fullname || user?.email || 'Kullanıcı'}
                src={user?.thumbnail}
              />
              <Box flex="1">
                <Text fontWeight="bold">{user?.fullname || 'Bilinmeyen kullanıcı'}</Text>
                <Text fontSize="sm" color="gray.500">
                  {user?.email || 'E-posta yok'}
                </Text>
              </Box>
              <Badge colorScheme="purple">{formatValue(event.eventType)}</Badge>
            </HStack>

            <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Tarih
                </Text>
                <Text fontWeight="medium">
                  {event.createdAt
                    ? format(new Date(event.createdAt), 'dd MMM yyyy HH:mm:ss', {
                        locale: tr,
                      })
                    : '-'}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Session ID
                </Text>
                <Text fontWeight="medium" wordBreak="break-all">
                  {formatValue(event.sessionId)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Route
                </Text>
                <Text fontWeight="medium">{formatValue(event.routeName)}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Önceki Route
                </Text>
                <Text fontWeight="medium">{formatValue(event.previousRouteName)}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Platform
                </Text>
                <Text fontWeight="medium">
                  {formatValue(event.platform)} / {formatValue(event.appMode)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  App State
                </Text>
                <Text fontWeight="medium">{formatValue(event.appState)}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Marka / Model
                </Text>
                <Text fontWeight="medium">
                  {formatValue(event.brand)} / {formatValue(event.model)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Sistem
                </Text>
                <Text fontWeight="medium">
                  Android {formatValue(event.systemVersion)} / API {formatValue(event.apiLevel)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Uygulama
                </Text>
                <Text fontWeight="medium">
                  v{formatValue(event.appVersion)} ({formatValue(event.buildNumber)})
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Donanım Sınıfı
                </Text>
                <Text fontWeight="medium">
                  {formatValue(event.performanceTier)} / {formatValue(event.totalMemoryGb)} GB
                </Text>
              </Box>
            </SimpleGrid>

            <Divider />

            <Box>
              <Text fontWeight="semibold" mb={2}>
                Payload
              </Text>
              <Box
                as="pre"
                p={4}
                borderRadius="md"
                bg="gray.900"
                color="gray.100"
                overflowX="auto"
                whiteSpace="pre-wrap"
                fontSize="xs">
                {renderJson(event.payload)}
              </Box>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={2}>
                Ham Kayıt
              </Text>
              <Box
                as="pre"
                p={4}
                borderRadius="md"
                bg="gray.50"
                overflowX="auto"
                whiteSpace="pre-wrap"
                fontSize="xs">
                {renderJson(event)}
              </Box>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Kapat
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TelemetryDetailModal;
