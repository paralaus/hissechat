import React, {useState} from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Textarea,
  useToast,
  Select,
  FormHelperText,
  Checkbox,
  CheckboxGroup,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Icon,
  Image as ChakraImage,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Spinner,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';
import {Page} from '../../../components';
import {FiSend, FiMessageCircle, FiUsers, FiTrendingUp, FiImage, FiVideo, FiMusic, FiUpload, FiX, FiFile, FiSmile, FiActivity, FiCpu, FiPieChart, FiStar} from 'react-icons/fi';
import useFileInput from '../../../hooks/useFileInput';
import EmojiPicker from 'emoji-picker-react';

const schema = yup
  .object({
    message: yup.string().when(['image', 'video', 'audio', 'file'], {
      is: (image, video, audio, file) => !image && !video && !audio && !file,
      then: (schema) => schema.required('Mesaj veya medya eklemelisiniz.').min(1),
      otherwise: (schema) => schema.notRequired(),
    }),
    targetType: yup.string().required('Hedef kitle seçimi zorunludur.'),
    selectedChannels: yup.array().when('targetType', {
      is: 'selected',
      then: (schema) => schema.min(1, 'En az bir kanal seçmelisiniz.'),
      otherwise: (schema) => schema.notRequired(),
    }),
    image: yup.string().notRequired(),
    video: yup.string().notRequired(),
    audio: yup.string().notRequired(),
    file: yup.string().notRequired(),
  })
  .required();

const targetTypes = [
  {value: 'all_channels', label: 'Tüm Kanallara'},
  {value: 'all_markets', label: 'Tüm Piyasa Kanallarına'},
  {value: 'all_vip', label: 'Tüm VIP Kanallara'},
  {value: 'all_funds', label: 'Tüm Fon Kanallarına'},
  {value: 'all_viop', label: 'Tüm VİOP Kanallarına'},
  {value: 'selected', label: 'Seçili Kanallara'},
];

// Helper to identify VIOP channels
const isViopChannel = (c) => 
  c.type === 'market' && 
  (c.marketCode?.startsWith('F_') || 
   c.name?.toUpperCase().includes('VİOP') || 
   c.marketCode?.includes('VIOP'));

// Helper to fetch all items with pagination
const fetchAll = async (apiFunc, params = {}) => {
  const limit = 100; // Max limit allowed by API
  const firstRes = await apiFunc({ ...params, limit, page: 1 });
  
  if (!firstRes.data) return [];
  
  let allResults = firstRes.data.results || [];
  const totalPages = firstRes.data.totalPages || 1;
  
  if (totalPages > 1) {
    const promises = [];
    for (let i = 2; i <= totalPages; i++) {
      promises.push(apiFunc({ ...params, limit, page: i }));
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.data?.results) {
        allResults = [...allResults, ...res.data.results];
      }
    });
  }
  
  return allResults;
};

const BulkMessage = () => {
  const toast = useToast();
  const [sendResult, setSendResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, successCount: 0, failCount: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);

  // File inputs for different media types
  const imageInput = useFileInput({accept: 'image/*'});
  const videoInput = useFileInput({accept: 'video/*'});
  const audioInput = useFileInput({accept: 'audio/*'});
  const fileInput = useFileInput({accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'});

  const {
    register,
    handleSubmit,
    formState: {errors},
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      selectedChannels: [],
      message: '',
      image: '',
      video: '',
      audio: '',
      file: '',
    },
  });

  // Fetch all channels for selection
  const {data: channelsData, isLoading: isLoadingChannels} = useQuery({
    queryKey: ['all-channels-for-bulk'],
    queryFn: () => fetchAll(api.getAllChannels),
  });

  // Fetch VIP channels
  const {data: vipChannelsData} = useQuery({
    queryKey: ['vip-channels-for-bulk'],
    queryFn: () => fetchAll(api.getVipChannels),
  });

  // Fetch VIOP Markets
  const {data: viopMarketsData} = useQuery({
    queryKey: ['viop-markets-bulk'],
    queryFn: () => fetchAll(api.getMarkets, { type: 'viop' }),
  });

  // Fetch Crypto Markets
  const {data: cryptoMarketsData} = useQuery({
    queryKey: ['crypto-markets-bulk'],
    queryFn: () => fetchAll(api.getMarkets, { type: 'crypto' }),
  });

  // Fetch Stock Markets
  const {data: stockMarketsData} = useQuery({
    queryKey: ['stock-markets-bulk'],
    queryFn: () => fetchAll(api.getMarkets, { type: 'stock' }),
  });

  // Fetch Funds
  const {data: fundsData} = useQuery({
    queryKey: ['funds-list-bulk'],
    queryFn: () => fetchAll(api.getFunds),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: (values) => {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      return api.sendBulkMessage(values, { signal: abortControllerRef.current.signal });
    },
  });

  // Merge VİOP markets with existing channels
  const mergedViopChannels = React.useMemo(() => {
    if (!viopMarketsData) return [];
    return viopMarketsData.map(market => {
      const existingChannel = channelsData?.find(c => c.marketCode === market.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [viopMarketsData, channelsData]);

  const mergedCryptoChannels = React.useMemo(() => {
    if (!cryptoMarketsData) return [];
    return cryptoMarketsData.map(market => {
      const existingChannel = channelsData?.find(c => c.marketCode === market.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        category: 'kripto',
        isVirtual: true,
      };
    });
  }, [cryptoMarketsData, channelsData]);

  const mergedStockChannels = React.useMemo(() => {
    if (!stockMarketsData) return [];
    return stockMarketsData.map(market => {
      const existingChannel = channelsData?.find(c => c.marketCode === market.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: market.name,
        marketCode: market.code,
        type: 'market',
        isVirtual: true,
      };
    });
  }, [stockMarketsData, channelsData]);

  const mergedFundChannels = React.useMemo(() => {
    if (!fundsData) return [];
    return fundsData.map(fund => {
      const existingChannel = channelsData?.find(c => c.fundCode === fund.code);
      if (existingChannel) return existingChannel;
      return {
        id: null,
        name: fund.name,
        fundCode: fund.code,
        type: 'fund',
        isVirtual: true,
      };
    });
  }, [fundsData, channelsData]);

  // Cancel handler
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCancelled(true);
      setIsSending(false);
      setIsUploading(false);
      toast({
        title: 'Gönderim iptal edildi',
        description: 'Bazı mesajlar gönderilmiş olabilir.',
        status: 'warning',
        position: 'top',
        duration: 5000,
      });
    }
  };

  // Calculate target channel count based on selection
  const getTargetChannelCount = () => {
    const targetType = watch('targetType');
    const selectedChannels = watch('selectedChannels') || [];
    
    switch (targetType) {
      case 'all_channels':
        const othersCount = channelsData?.filter(c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund').length || 0;
        return (mergedStockChannels.length) + 
               (mergedCryptoChannels.length) + 
               (mergedViopChannels.length) + 
               (mergedFundChannels.length) + 
               (vipChannelsData?.length || 0) + 
               othersCount;
      case 'all_markets':
        return mergedStockChannels.length + mergedCryptoChannels.length + mergedViopChannels.length;
      case 'all_vip':
        return vipChannelsData?.length || 0;
      case 'all_funds':
        return mergedFundChannels.length;
      case 'all_viop':
        return mergedViopChannels.length;
      case 'selected':
        return selectedChannels.length;
      default:
        return 0;
    }
  };

  const onSubmit = async (values) => {
    try {
      setSendResult(null);
      setIsCancelled(false);
      setIsUploading(true);
      
      const totalChannels = getTargetChannelCount();
      setSendProgress({ current: 0, total: totalChannels, successCount: 0, failCount: 0 });

      // Upload media files if present
      if (imageInput.objectUrl) {
        const url = await imageInput.upload();
        if (url) values.image = url;
      }
      if (videoInput.objectUrl) {
        const url = await videoInput.upload();
        if (url) values.video = url;
      }
      if (audioInput.objectUrl) {
        const url = await audioInput.upload();
        if (url) values.audio = url;
      }
      if (fileInput.objectUrl) {
        const url = await fileInput.upload();
        if (url) values.file = url;
      }

      setIsUploading(false);
      setIsSending(true);

      // Transform all_funds and all_viop to selected list if backend doesn't support them natively
      // We assume backend might only know about market/vip/all.
      let submissionValues = { ...values };
      
      if (values.targetType === 'all_funds') {
        submissionValues.targetType = 'selected';
        submissionValues.selectedChannels = channelsData
          .filter(c => c.type === 'fund')
          .map(c => c.id);
      } else if (values.targetType === 'all_viop') {
        submissionValues.targetType = 'selected';
        submissionValues.selectedChannels = channelsData
          .filter(isViopChannel)
          .map(c => c.id);
      }

      const {data} = await mutateAsync(submissionValues);
      
      setIsSending(false);
      
      if (data) {
        setSendProgress({ 
          current: totalChannels, 
          total: totalChannels, 
          successCount: data.successCount || 0, 
          failCount: data.failCount || 0 
        });
        setSendResult(data);
        toast({
          title: 'Toplu mesaj gönderildi!',
          description: `${data.successCount || 0} kanala başarıyla gönderildi.`,
          status: 'success',
          position: 'top',
          duration: 5000,
        });
        reset();
        imageInput.reset();
        videoInput.reset();
        audioInput.reset();
        fileInput.reset();
      }
    } catch (error) {
      setIsUploading(false);
      setIsSending(false);
      
      // Don't show error toast if cancelled
      if (error.name === 'AbortError' || error.message === 'canceled') {
        // Already handled in handleCancel
        return;
      }
      
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const targetType = watch('targetType');
  const selectedChannels = watch('selectedChannels') || [];

  // Calculate target channel count
  const getTargetCount = getTargetChannelCount;

  // Check if any media is selected
  const hasMedia = imageInput.objectUrl || videoInput.objectUrl || audioInput.objectUrl || fileInput.objectUrl;

  // Group channels by type for display
  const stockChannels = mergedStockChannels;
  const cryptoChannels = mergedCryptoChannels;
  const vipChannels = vipChannelsData || [];
  const fundChannels = mergedFundChannels;
  const viopChannels = mergedViopChannels;
  
  // Combine for selection list
  // Note: We might want to separate them in the UI later, but for now we group them as "Market" excluding VIOP if that was the pattern,
  // or just put Stock and Crypto in Market.
  const marketChannels = [...mergedStockChannels, ...mergedCryptoChannels];
  const otherChannels = channelsData?.filter(c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund') || [];

  return (
    <Page>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Toplu Mesaj Gönder
        </Text>
        <Text color="gray.500" mt="1">
          Tüm kanallara veya seçili kanallara toplu mesaj ve medya gönderin.
        </Text>
      </Box>

      {/* Statistics */}
      <StatGroup mb="6" display="flex" flexWrap="wrap" gap="4">
        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1"
        >
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiMessageCircle} />
              <Text>Tümü</Text>
            </HStack>
          </StatLabel>
          <StatNumber>
            {marketChannels.length + viopChannels.length + fundChannels.length + vipChannels.length + otherChannels.length}
          </StatNumber>
        </Stat>

        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1"
        >
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiStar} />
              <Text>VIP</Text>
            </HStack>
          </StatLabel>
          <StatNumber>{vipChannels.length}</StatNumber>
        </Stat>

        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1"
        >
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiActivity} />
              <Text>VİOP</Text>
            </HStack>
          </StatLabel>
          <StatNumber>{viopChannels.length}</StatNumber>
        </Stat>

        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1"
        >
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiCpu} />
              <Text>Kripto</Text>
            </HStack>
          </StatLabel>
          <StatNumber>{cryptoChannels.length}</StatNumber>
        </Stat>

        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1"
        >
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiTrendingUp} />
              <Text>Borsa</Text>
            </HStack>
          </StatLabel>
          <StatNumber>{stockChannels.length}</StatNumber>
        </Stat>

        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1"
        >
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiPieChart} />
              <Text>Fonlar</Text>
            </HStack>
          </StatLabel>
          <StatNumber>{fundChannels.length}</StatNumber>
        </Stat>
      </StatGroup>

      {/* Sending Progress */}
      {(isUploading || isSending) && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="lg"
          mb="6"
          p="4"
        >
          <HStack width="100%" mb="3" justify="space-between">
            <HStack>
              <Spinner size="sm" color="blue.500" />
              <AlertTitle>
                {isUploading ? '📤 Medya yükleniyor...' : '📨 Mesajlar gönderiliyor...'}
              </AlertTitle>
            </HStack>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={handleCancel}
              leftIcon={<Icon as={FiX} />}
            >
              İptal Et
            </Button>
          </HStack>
          
          {isSending && sendProgress.total > 0 && (
            <Box width="100%">
              <HStack justify="space-between" mb="2">
                <Text fontSize="sm" color="gray.600">
                  Hedef: {sendProgress.total} kanal
                </Text>
                <Badge colorScheme="blue" fontSize="sm">
                  Gönderiliyor...
                </Badge>
              </HStack>
              <Progress 
                value={100} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full"
                isIndeterminate
              />
              <HStack mt="3" spacing="4" fontSize="sm" justify="space-between">
                <Text color="gray.500">
                  ⏳ Lütfen bekleyin, mesajlar gönderiliyor...
                </Text>
                <Text color="orange.500" fontSize="xs">
                  💡 İptal ederseniz, gönderilmiş mesajlar kalacaktır.
                </Text>
              </HStack>
            </Box>
          )}
        </Alert>
      )}

      {/* Cancelled Result */}
      {isCancelled && !isSending && !isUploading && !sendResult && (
        <Alert
          status="warning"
          variant="subtle"
          borderRadius="lg"
          mb="6"
        >
          <AlertIcon />
          <Box>
            <AlertTitle>⚠️ Gönderim İptal Edildi</AlertTitle>
            <AlertDescription>
              İşlem iptal edildi. Bazı mesajlar gönderilmiş olabilir.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Send Result */}
      {sendResult && !isSending && (
        <Alert
          status={sendResult.failCount > 0 ? 'warning' : 'success'}
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="lg"
          mb="6"
          p="4"
        >
          <AlertIcon />
          <AlertTitle mt={2}>🎉 Gönderim Tamamlandı</AlertTitle>
          <AlertDescription mt={2} width="100%">
            <VStack align="start" spacing="2" width="100%">
              <HStack spacing="6">
                <HStack>
                  <Badge colorScheme="green" fontSize="md" px="3" py="1">
                    ✅ {sendResult.successCount}
                  </Badge>
                  <Text>Başarılı</Text>
                </HStack>
                {sendResult.failCount > 0 && (
                  <HStack>
                    <Badge colorScheme="red" fontSize="md" px="3" py="1">
                      ❌ {sendResult.failCount}
                    </Badge>
                    <Text>Başarısız</Text>
                  </HStack>
                )}
              </HStack>
              
              <Progress 
                value={(sendResult.successCount / (sendResult.successCount + sendResult.failCount)) * 100} 
                size="sm" 
                colorScheme={sendResult.failCount > 0 ? 'yellow' : 'green'}
                borderRadius="full"
                width="100%"
              />
              
              <HStack spacing="4" fontSize="sm" color="gray.500">
                <Text>📊 Toplam: {sendResult.successCount + sendResult.failCount} kanal</Text>
                <Text>⏱️ Süre: {(sendResult.duration / 1000).toFixed(1)}s</Text>
                <Text>
                  📈 Başarı: {Math.round((sendResult.successCount / (sendResult.successCount + sendResult.failCount)) * 100)}%
                </Text>
              </HStack>
            </VStack>
          </AlertDescription>
        </Alert>
      )}

      <Box
        bg="white"
        overflow="visible"
        borderRadius="xl"
        display="flex"
        flexDirection="column"
        boxShadow="md"
        p="6"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" maxW="100%">
            {/* Target Type */}
            <FormControl isInvalid={!!errors.targetType} mb="6">
              <FormLabel fontWeight="600" fontSize="sm">
                Hedef Kitle
              </FormLabel>
              <Select
                placeholder="Hedef kitle seçin"
                size="lg"
                {...register('targetType')}
              >
                {targetTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Mesajın gönderileceği kanalları seçin.
              </FormHelperText>
              <FormErrorMessage>{errors.targetType?.message}</FormErrorMessage>
            </FormControl>

            {/* Target Count Badge */}
            {targetType && (
              <Box mb="6">
                <Badge colorScheme="blue" fontSize="md" px="3" py="1" borderRadius="full">
                  {getTargetCount()} kanala gönderilecek
                </Badge>
              </Box>
            )}

            {/* Channel Selection for 'selected' type */}
            {targetType === 'selected' && (
              <FormControl isInvalid={!!errors.selectedChannels} mb="6">
                <FormLabel fontWeight="600" fontSize="sm">
                  Kanalları Seçin
                </FormLabel>
                <Box
                  maxH="300px"
                  overflowY="auto"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  p="4"
                >
                  {isLoadingChannels ? (
                    <Text>Kanallar yükleniyor...</Text>
                  ) : (
                    <CheckboxGroup
                      value={selectedChannels}
                      onChange={(values) => setValue('selectedChannels', values)}
                    >
                      <VStack align="start" spacing="4">
                        {/* Market Channels */}
                        {marketChannels.length > 0 && (
                          <Box w="100%">
                            <Text fontWeight="bold" mb="2" color="gray.600">
                              📈 Piyasa Kanalları ({marketChannels.length})
                            </Text>
                            <VStack align="start" pl="4" spacing="2">
                              {marketChannels.map((channel) => (
                                <Checkbox 
                                  key={channel.id || channel.marketCode || channel.name} 
                                  value={channel.id}
                                  isDisabled={!channel.id}
                                >
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="green">Market</Badge>
                                    {!channel.id && <Badge size="sm" colorScheme="gray">Başlatılmadı</Badge>}
                                  </HStack>
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        <Divider />

                        {/* VIP Channels */}
                        {vipChannels.length > 0 && (
                          <Box w="100%">
                            <Text fontWeight="bold" mb="2" color="gray.600">
                              ⭐ VIP Kanallar ({vipChannels.length})
                            </Text>
                            <VStack align="start" pl="4" spacing="2">
                              {vipChannels.map((channel) => (
                                <Checkbox key={channel.id} value={channel.id}>
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="purple">VIP</Badge>
                                  </HStack>
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        <Divider />

                        {/* VIOP Channels */}
                        {viopChannels.length > 0 && (
                          <Box w="100%">
                            <Text fontWeight="bold" mb="2" color="gray.600">
                              📉 VİOP Kanalları ({viopChannels.length})
                            </Text>
                            <VStack align="start" pl="4" spacing="2">
                              {viopChannels.map((channel) => (
                                <Checkbox 
                                  key={channel.id || channel.marketCode || channel.name} 
                                  value={channel.id}
                                  isDisabled={!channel.id}
                                >
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="orange">VİOP</Badge>
                                    {!channel.id && <Badge size="sm" colorScheme="gray">Başlatılmadı</Badge>}
                                  </HStack>
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        <Divider />

                        {fundChannels.length > 0 && (
                          <Box w="100%">
                            <Text fontWeight="bold" mb="2" color="gray.600">
                              🪙 Fon Kanalları ({fundChannels.length})
                            </Text>
                            <VStack align="start" pl="4" spacing="2">
                              {fundChannels.map((channel) => (
                                <Checkbox 
                                  key={channel.id || channel.fundCode || channel.name} 
                                  value={channel.id}
                                  isDisabled={!channel.id}
                                >
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="blue">Fon</Badge>
                                    {!channel.id && <Badge size="sm" colorScheme="gray">Başlatılmadı</Badge>}
                                  </HStack>
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        <Divider />

                        {/* Other Channels */}
                        {otherChannels.length > 0 && (
                          <Box w="100%">
                            <Text fontWeight="bold" mb="2" color="gray.600">
                              💬 Diğer Kanallar ({otherChannels.length})
                            </Text>
                            <VStack align="start" pl="4" spacing="2">
                              {otherChannels.map((channel) => (
                                <Checkbox key={channel.id} value={channel.id}>
                                  <Text>{channel.name}</Text>
                                </Checkbox>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </CheckboxGroup>
                  )}
                </Box>
                <FormErrorMessage>{errors.selectedChannels?.message}</FormErrorMessage>
              </FormControl>
            )}

            {/* Message Content */}
            <FormControl isInvalid={!!errors.message} mb="6">
              <FormLabel fontWeight="600" fontSize="sm">
                Mesaj İçeriği {hasMedia && '(Opsiyonel)'}
              </FormLabel>
              <Box position="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Tüm kanallara gönderilecek mesajı yazın..."
                  size="lg"
                  rows={4}
                  pr="12"
                  {...register('message')}
                />
                {/* Emoji Button */}
                <Popover
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  placement="top-end"
                >
                  <PopoverTrigger>
                    <IconButton
                      icon={<FiSmile />}
                      size="sm"
                      variant="ghost"
                      position="absolute"
                      top="2"
                      right="2"
                      zIndex="1"
                      aria-label="Emoji ekle"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      color={showEmojiPicker ? 'blue.500' : 'gray.400'}
                      _hover={{ color: 'blue.500' }}
                    />
                  </PopoverTrigger>
                  <PopoverContent width="350px" border="none" boxShadow="xl">
                    <PopoverBody p="0">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          const currentValue = watch('message') || '';
                          setValue('message', currentValue + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        width="100%"
                        height="350px"
                        searchPlaceholder="Emoji ara..."
                        previewConfig={{ showPreview: false }}
                      />
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </Box>
              <FormHelperText>
                Bu mesaj seçilen tüm kanallara admin olarak gönderilecektir.
              </FormHelperText>
              <FormErrorMessage>{errors.message?.message}</FormErrorMessage>
            </FormControl>

            {/* Media Upload Section */}
            <FormControl mb="6">
              <FormLabel fontWeight="600" fontSize="sm">
                Medya Ekle (Opsiyonel)
              </FormLabel>
              
              <Tabs variant="soft-rounded" colorScheme="blue">
                <TabList mb="4" flexWrap="wrap">
                  <Tab>
                    <HStack spacing="2">
                      <Icon as={FiImage} />
                      <Text>Görsel</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing="2">
                      <Icon as={FiVideo} />
                      <Text>Video</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing="2">
                      <Icon as={FiMusic} />
                      <Text>Ses</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing="2">
                      <Icon as={FiFile} />
                      <Text>Dosya</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Image Upload */}
                  <TabPanel p="0">
                    <Box
                      onClick={() => imageInput.open()}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={imageInput.objectUrl ? 'green.300' : 'gray.300'}
                      bg={imageInput.objectUrl ? 'green.50' : 'gray.50'}
                      p={imageInput.objectUrl ? '0' : '8'}
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: imageInput.objectUrl ? 'green.50' : 'blue.50',
                      }}
                      position="relative"
                      overflow="hidden"
                    >
                      {imageInput.objectUrl ? (
                        <Box position="relative" w="100%">
                          <ChakraImage
                            src={imageInput.objectUrl}
                            alt="Yüklenecek görsel"
                            maxH="300px"
                            objectFit="contain"
                            borderRadius="lg"
                            mx="auto"
                            display="block"
                          />
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            position="absolute"
                            top="2"
                            right="2"
                            onClick={(e) => {
                              e.stopPropagation();
                              imageInput.reset();
                            }}
                            aria-label="Görseli kaldır"
                          />
                        </Box>
                      ) : (
                        <VStack spacing="3">
                          <Box p="4" bg="gray.100" borderRadius="full">
                            <Icon as={FiImage} boxSize="8" color="gray.400" />
                          </Box>
                          <VStack spacing="1">
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                              Görsel Yükle
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              PNG, JPG, GIF - Max 10MB
                            </Text>
                          </VStack>
                          <Icon as={FiUpload} boxSize="4" color="gray.400" />
                        </VStack>
                      )}
                    </Box>
                    {imageInput.input}
                  </TabPanel>

                  {/* Video Upload */}
                  <TabPanel p="0">
                    <Box
                      onClick={() => !videoInput.isProcessing && videoInput.open()}
                      cursor={videoInput.isProcessing ? 'wait' : 'pointer'}
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={videoInput.validationError ? 'red.300' : videoInput.objectUrl ? 'green.300' : 'gray.300'}
                      bg={videoInput.validationError ? 'red.50' : videoInput.objectUrl ? 'green.50' : 'gray.50'}
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: videoInput.validationError ? 'red.400' : 'blue.400',
                        bg: videoInput.validationError ? 'red.50' : videoInput.objectUrl ? 'green.50' : 'blue.50',
                      }}
                      position="relative"
                    >
                      {videoInput.isProcessing ? (
                        <VStack spacing="3">
                          <Spinner size="lg" color="blue.500" />
                          <Text fontSize="sm" color="gray.600">Video işleniyor...</Text>
                        </VStack>
                      ) : videoInput.objectUrl ? (
                        <Box position="relative" w="100%">
                          <video
                            src={videoInput.objectUrl}
                            controls
                            preload="metadata"
                            playsInline
                            style={{maxHeight: '300px', width: '100%', borderRadius: '8px'}}
                          />
                          {videoInput.videoMetadata && (
                            <HStack
                              position="absolute"
                              bottom="2"
                              left="2"
                              bg="blackAlpha.700"
                              px="2"
                              py="1"
                              borderRadius="md"
                              spacing="2"
                            >
                              <Text fontSize="xs" color="white">
                                {videoInput.formatSize(videoInput.file?.size || 0)}
                              </Text>
                              {videoInput.videoMetadata.duration && (
                                <Text fontSize="xs" color="white">
                                  {Math.floor(videoInput.videoMetadata.duration / 60)}:{String(Math.floor(videoInput.videoMetadata.duration % 60)).padStart(2, '0')}
                                </Text>
                              )}
                            </HStack>
                          )}
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            position="absolute"
                            top="2"
                            right="2"
                            onClick={(e) => {
                              e.stopPropagation();
                              videoInput.reset();
                            }}
                            aria-label="Videoyu kaldır"
                          />
                        </Box>
                      ) : (
                        <VStack spacing="3">
                          <Box p="4" bg="gray.100" borderRadius="full">
                            <Icon as={FiVideo} boxSize="8" color="gray.400" />
                          </Box>
                          <VStack spacing="1">
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                              Video Yükle
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              MP4, MOV, AVI - Max 100MB, Max 5 dakika
                            </Text>
                          </VStack>
                          <Icon as={FiUpload} boxSize="4" color="gray.400" />
                        </VStack>
                      )}
                    </Box>
                    {videoInput.validationError && (
                      <Alert status="error" mt="2" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">{videoInput.validationError}</Text>
                      </Alert>
                    )}
                    {videoInput.input}
                  </TabPanel>

                  {/* Audio Upload */}
                  <TabPanel p="0">
                    <Box
                      onClick={() => audioInput.open()}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={audioInput.objectUrl ? 'green.300' : 'gray.300'}
                      bg={audioInput.objectUrl ? 'green.50' : 'gray.50'}
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: audioInput.objectUrl ? 'green.50' : 'blue.50',
                      }}
                      position="relative"
                    >
                      {audioInput.objectUrl ? (
                        <Box position="relative" w="100%">
                          <audio
                            src={audioInput.objectUrl}
                            controls
                            style={{width: '100%'}}
                          />
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            position="absolute"
                            top="-10"
                            right="0"
                            onClick={(e) => {
                              e.stopPropagation();
                              audioInput.reset();
                            }}
                            aria-label="Sesi kaldır"
                          />
                        </Box>
                      ) : (
                        <VStack spacing="3">
                          <Box p="4" bg="gray.100" borderRadius="full">
                            <Icon as={FiMusic} boxSize="8" color="gray.400" />
                          </Box>
                          <VStack spacing="1">
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                              Ses Dosyası Yükle
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              MP3, WAV, OGG - Max 20MB
                            </Text>
                          </VStack>
                          <Icon as={FiUpload} boxSize="4" color="gray.400" />
                        </VStack>
                      )}
                    </Box>
                    {audioInput.input}
                  </TabPanel>

                  {/* File Upload */}
                  <TabPanel p="0">
                    <Box
                      onClick={() => fileInput.open()}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={fileInput.objectUrl ? 'green.300' : 'gray.300'}
                      bg={fileInput.objectUrl ? 'green.50' : 'gray.50'}
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: fileInput.objectUrl ? 'green.50' : 'blue.50',
                      }}
                      position="relative"
                    >
                      {fileInput.objectUrl ? (
                        <Box position="relative" w="100%" textAlign="center">
                          <VStack spacing="3">
                            <Box p="4" bg="green.100" borderRadius="full">
                              <Icon as={FiFile} boxSize="8" color="green.500" />
                            </Box>
                            <VStack spacing="1">
                              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                                {fileInput.file?.name || 'Dosya seçildi'}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {fileInput.file?.size ? `${(fileInput.file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                              </Text>
                            </VStack>
                          </VStack>
                          <IconButton
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            position="absolute"
                            top="0"
                            right="0"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInput.reset();
                            }}
                            aria-label="Dosyayı kaldır"
                          />
                        </Box>
                      ) : (
                        <VStack spacing="3">
                          <Box p="4" bg="gray.100" borderRadius="full">
                            <Icon as={FiFile} boxSize="8" color="gray.400" />
                          </Box>
                          <VStack spacing="1">
                            <Text fontSize="sm" fontWeight="medium" color="gray.600">
                              Dosya Yükle
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              PDF, DOC, XLS, PPT, TXT, ZIP - Max 50MB
                            </Text>
                          </VStack>
                          <Icon as={FiUpload} boxSize="4" color="gray.400" />
                        </VStack>
                      )}
                    </Box>
                    {fileInput.input}
                  </TabPanel>
                </TabPanels>
              </Tabs>

              {/* Selected Media Summary */}
              {hasMedia && (
                <Box mt="4" p="3" bg="blue.50" borderRadius="lg">
                  <Text fontSize="sm" fontWeight="medium" color="blue.700">
                    📎 Ekli Medya:
                    {imageInput.objectUrl && ' 🖼️ Görsel'}
                    {videoInput.objectUrl && ' 🎬 Video'}
                    {audioInput.objectUrl && ' 🎵 Ses'}
                    {fileInput.objectUrl && ' 📄 Dosya'}
                  </Text>
                </Box>
              )}
            </FormControl>

            {/* Warning */}
            <Alert status="warning" borderRadius="lg" mb="6">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Dikkat!</AlertTitle>
                <AlertDescription fontSize="sm">
                  Bu işlem geri alınamaz. Mesaj ve medya seçilen tüm kanallara anında gönderilecektir.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Progress during sending */}
            {(isPending || isUploading) && (
              <Box mb="4">
                <Text mb="2" fontSize="sm" color="gray.500">
                  {isUploading ? 'Medya yükleniyor...' : 'Mesajlar gönderiliyor...'}
                </Text>
                <Progress size="sm" isIndeterminate colorScheme="blue" borderRadius="full" />
              </Box>
            )}

            {/* Submit Button */}
            <Button
              isLoading={isPending || isUploading}
              loadingText={isUploading ? 'Yükleniyor...' : 'Gönderiliyor...'}
              colorScheme="blue"
              size="lg"
              type="submit"
              leftIcon={<FiSend />}
              isDisabled={isPending || isUploading || !targetType}
            >
              {getTargetCount()} Kanala Mesaj Gönder
            </Button>
          </Flex>
        </form>
      </Box>
    </Page>
  );
};

export default BulkMessage;
