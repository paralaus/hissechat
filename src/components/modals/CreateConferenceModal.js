import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Input,
  FormControl,
  FormLabel,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiVideo, FiCalendar, FiClock } from 'react-icons/fi';

const DURATION_OPTIONS = [
  { value: 30, label: '30 dk' },
  { value: 60, label: '1 saat' },
  { value: 90, label: '1.5 saat' },
  { value: 120, label: '2 saat' },
];

const CreateConferenceModal = ({ isOpen, onClose, onCreate, isLoading }) => {
  const [mode, setMode] = useState('select'); // 'select', 'schedule'
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60); // Default 60 minutes

  const handleInstantStart = () => {
    onCreate({ type: 'instant', duration });
    onClose();
  };

  const handleScheduleStart = () => {
    if (!date || !time) return;
    
    const scheduledDateTime = new Date(`${date}T${time}`);
    onCreate({ 
      type: 'scheduled', 
      startTime: scheduledDateTime.toISOString(),
      duration,
    });
    onClose();
    // Reset state
    setMode('select');
    setDate('');
    setTime('');
    setDuration(60);
  };

  const handleClose = () => {
    setMode('select');
    setDate('');
    setTime('');
    setDuration(60);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      isCentered 
      size="md"
      closeOnOverlayClick={true}
      closeOnEsc={true}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Video Görüşme Başlat</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {mode === 'select' ? (
            <VStack spacing={4} align="stretch">
              {/* Duration Selection */}
              <FormControl>
                <FormLabel>
                  <HStack spacing={2}>
                    <Icon as={FiClock} />
                    <Text>Tahmini Süre</Text>
                  </HStack>
                </FormLabel>
                <SimpleGrid columns={4} spacing={2}>
                  {DURATION_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant={duration === opt.value ? 'solid' : 'outline'}
                      colorScheme={duration === opt.value ? 'blue' : 'gray'}
                      onClick={() => setDuration(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </SimpleGrid>
              </FormControl>

              <Button
                height="80px"
                colorScheme="green"
                variant="outline"
                onClick={handleInstantStart}
                isLoading={isLoading}
                justifyContent="flex-start"
                px={6}
              >
                <HStack spacing={4}>
                  <Box p={3} bg="green.100" borderRadius="full">
                    <Icon as={FiVideo} boxSize={6} color="green.600" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg">Anında Başlat</Text>
                    <Text fontSize="sm" fontWeight="normal">Hemen bir görüşme başlatın ({duration} dk)</Text>
                  </VStack>
                </HStack>
              </Button>

              <Button
                height="80px"
                colorScheme="blue"
                variant="outline"
                onClick={() => setMode('schedule')}
                justifyContent="flex-start"
                px={6}
              >
                <HStack spacing={4}>
                  <Box p={3} bg="blue.100" borderRadius="full">
                    <Icon as={FiCalendar} boxSize={6} color="blue.600" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg">İleri Tarihli Planla</Text>
                    <Text fontSize="sm" fontWeight="normal">Gelecek bir zaman için görüşme planlayın</Text>
                  </VStack>
                </HStack>
              </Button>

              {/* Cancel Button */}
              <Button
                variant="ghost"
                colorScheme="gray"
                onClick={handleClose}
                mt={2}
              >
                İptal
              </Button>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              <Text fontSize="md" color="gray.600" mb={2}>
                Görüşme için tarih ve saat seçin:
              </Text>
              
              <FormControl isRequired>
                <FormLabel>Tarih</FormLabel>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Saat</FormLabel>
                <Input 
                  type="time" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                />
              </FormControl>

              {/* Duration Selection for Scheduled */}
              <FormControl>
                <FormLabel>Tahmini Süre</FormLabel>
                <SimpleGrid columns={4} spacing={2}>
                  {DURATION_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant={duration === opt.value ? 'solid' : 'outline'}
                      colorScheme={duration === opt.value ? 'blue' : 'gray'}
                      onClick={() => setDuration(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </SimpleGrid>
              </FormControl>

              <HStack justify="space-between" pt={4}>
                <Button variant="ghost" colorScheme="gray" onClick={handleClose}>
                  İptal
                </Button>
                <HStack spacing={3}>
                  <Button variant="outline" onClick={() => setMode('select')}>
                    Geri
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleScheduleStart}
                    isDisabled={!date || !time}
                    isLoading={isLoading}
                    leftIcon={<Icon as={FiCalendar} />}
                  >
                    Planla ve Gönder
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CreateConferenceModal;
