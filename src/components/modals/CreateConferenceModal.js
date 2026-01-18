import React, {useState} from 'react';
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
  Select,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {FiVideo, FiCalendar, FiClock, FiUsers} from 'react-icons/fi';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../api';

const DURATION_OPTIONS = [
  {value: 30, label: '30 dk'},
  {value: 60, label: '1 saat'},
  {value: 90, label: '1.5 saat'},
  {value: 120, label: '2 saat'},
];

const CreateConferenceModal = ({isOpen, onClose, onCreate, isLoading}) => {
  const [mode, setMode] = useState('select'); // 'select', 'schedule'
  const [title, setTitle] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [waitingRoom, setWaitingRoom] = useState(false);

  // Fetch channels for selection
  const {data: channelsData} = useQuery({
    queryKey: ['channels', 'all'],
    queryFn: () => api.getAllChannels({limit: 100}).then(res => res.data),
    enabled: isOpen,
  });

  const channels = channelsData?.results || [];

  const handleInstantStart = () => {
    if (!selectedChannel) return;

    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60000);

    onCreate({
      type: 'instant',
      title: title || 'Video Konferans',
      channelId: selectedChannel,
      startTime: now.toISOString(),
      scheduledEndTime: endTime.toISOString(),
      maxParticipants,
      settings: {waitingRoom},
    });
    handleClose();
  };

  const handleScheduleStart = () => {
    if (!date || !time || !selectedChannel) return;

    const scheduledDateTime = new Date(`${date}T${time}`);
    const endTime = new Date(scheduledDateTime.getTime() + duration * 60000);

    onCreate({
      type: 'scheduled',
      title: title || 'Video Konferans',
      channelId: selectedChannel,
      startTime: scheduledDateTime.toISOString(),
      scheduledEndTime: endTime.toISOString(),
      maxParticipants,
      settings: {waitingRoom},
    });
    handleClose();
  };

  const handleClose = () => {
    setMode('select');
    setTitle('');
    setSelectedChannel('');
    setDate('');
    setTime('');
    setDuration(60);
    setMaxParticipants(50);
    setWaitingRoom(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="xl"
      closeOnOverlayClick={true}
      closeOnEsc={true}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Video Görüşme Başlat</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Common Fields */}
            <FormControl isRequired>
              <FormLabel>Kanal Seçin</FormLabel>
              <Select
                placeholder="Kanal seçin..."
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value)}>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Konferans Başlığı</FormLabel>
              <Input
                placeholder="Örn: Haftalık Toplantı"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </FormControl>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Maksimum Katılımcı</FormLabel>
                <NumberInput
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(_, val) => setMaxParticipants(val)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Bekleme Odası</FormLabel>
                <Switch
                  isChecked={waitingRoom}
                  onChange={e => setWaitingRoom(e.target.checked)}
                />
              </FormControl>
            </HStack>

            {mode === 'select' ? (
              <VStack spacing={4} align="stretch" mt={4}>
                {/* Duration Selection */}
                <FormControl>
                  <FormLabel>
                    <HStack spacing={2}>
                      <Icon as={FiClock} />
                      <Text>Tahmini Süre</Text>
                    </HStack>
                  </FormLabel>
                  <SimpleGrid columns={4} spacing={2}>
                    {DURATION_OPTIONS.map(opt => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={duration === opt.value ? 'solid' : 'outline'}
                        colorScheme={duration === opt.value ? 'blue' : 'gray'}
                        onClick={() => setDuration(opt.value)}>
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
                  isDisabled={!selectedChannel}
                  justifyContent="flex-start"
                  px={6}>
                  <HStack spacing={4}>
                    <Box p={3} bg="green.100" borderRadius="full">
                      <Icon as={FiVideo} boxSize={6} color="green.600" />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        Anında Başlat
                      </Text>
                      <Text fontSize="sm" fontWeight="normal">
                        Hemen bir görüşme başlatın ({duration} dk)
                      </Text>
                    </VStack>
                  </HStack>
                </Button>

                <Button
                  height="80px"
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => setMode('schedule')}
                  isDisabled={!selectedChannel}
                  justifyContent="flex-start"
                  px={6}>
                  <HStack spacing={4}>
                    <Box p={3} bg="blue.100" borderRadius="full">
                      <Icon as={FiCalendar} boxSize={6} color="blue.600" />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        İleri Tarihli Planla
                      </Text>
                      <Text fontSize="sm" fontWeight="normal">
                        Gelecek bir zaman için görüşme planlayın
                      </Text>
                    </VStack>
                  </HStack>
                </Button>

                {/* Cancel Button */}
                <Button
                  variant="ghost"
                  colorScheme="gray"
                  onClick={handleClose}
                  mt={2}>
                  İptal
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch" mt={4}>
                <Text fontSize="md" color="gray.600" mb={2}>
                  Görüşme için tarih ve saat seçin:
                </Text>

                <FormControl isRequired>
                  <FormLabel>Tarih</FormLabel>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Saat</FormLabel>
                  <Input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </FormControl>

                {/* Duration Selection for Scheduled */}
                <FormControl>
                  <FormLabel>Tahmini Süre</FormLabel>
                  <SimpleGrid columns={4} spacing={2}>
                    {DURATION_OPTIONS.map(opt => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={duration === opt.value ? 'solid' : 'outline'}
                        colorScheme={duration === opt.value ? 'blue' : 'gray'}
                        onClick={() => setDuration(opt.value)}>
                        {opt.label}
                      </Button>
                    ))}
                  </SimpleGrid>
                </FormControl>

                <HStack justify="space-between" pt={4}>
                  <Button
                    variant="ghost"
                    colorScheme="gray"
                    onClick={() => setMode('select')}>
                    Geri
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handleScheduleStart}
                    isDisabled={!date || !time || !selectedChannel}
                    isLoading={isLoading}
                    leftIcon={<Icon as={FiCalendar} />}>
                    Planla ve Gönder
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CreateConferenceModal;
