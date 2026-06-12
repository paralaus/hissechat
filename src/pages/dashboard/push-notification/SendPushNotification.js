import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  Select,
  FormHelperText,
  Switch,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  VStack,
  HStack,
  Text,
  Spinner,
  Progress,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';
import useDisclosure from '../../../hooks/useDisclosure';
import {Condition, Page} from '../../../components';
import {
  NotificationReceiverType,
  NotificationReceiverTypeLabel,
  notificationReceiverTypes,
} from '../../../config';

const schema = yup
  .object({
    title: yup.string().required('Bu alan zorunludur.'),
    body: yup.string(),
    subject: yup.string(),
    subjectType: yup.string().required('Bu alan zorunludur.'),
    shouldCreateNotification: yup.boolean(),
    isImportant: yup.boolean(),
    receiverType: yup.string().required('Bu alan zorunludur.'),
    channel: yup.string(),
    category: yup.string(),
    imageUrl: yup
      .string()
      .url('Geçerli bir URL girin (https://...)')
      .nullable()
      .transform(v => (v === '' ? undefined : v)),
    groupKey: yup.string(),
    approveUrl: yup.string(),
    rejectUrl: yup.string(),
  })
  .required();

const pushStageLabels = {
  queued: 'Kuyrukta',
  waiting: 'Bekliyor',
  preparing: 'Hazırlanıyor',
  sending: 'Gönderiliyor',
  sent: 'Push Gönderildi',
  persisting: 'Kaydediliyor',
  cancel_requested: 'Iptal Istendi',
  cancelled: 'Iptal Edildi',
  completed: 'Tamamlandı',
  failed: 'Başarısız',
  active: 'İşleniyor',
};

const pushStateColors = {
  completed: 'green',
  failed: 'red',
  active: 'blue',
  waiting: 'yellow',
  delayed: 'orange',
  cancel_requested: 'orange',
  cancelled: 'gray',
};

const formatPushStage = stage =>
  pushStageLabels[stage] || (stage ? stage : 'Hazırlanıyor');

const formatPushState = state =>
  pushStageLabels[state] || (state ? state : 'Bekliyor');

const pushJobFilters = [
  {value: 'all', label: 'Tumu'},
  {value: 'active', label: 'Aktif'},
  {value: 'waiting', label: 'Bekleyen'},
  {value: 'failed', label: 'Basarisiz'},
  {value: 'cancelled', label: 'Iptal'},
  {value: 'completed', label: 'Tamamlanan'},
];

const pushJobFilterColors = {
  all: 'purple',
  active: 'blue',
  waiting: 'orange',
  failed: 'red',
  cancelled: 'gray',
  completed: 'green',
};

const matchesPushJobFilter = (job, filter) => {
  if (filter === 'all') return true;
  if (filter === 'active') return job.state === 'active';
  if (filter === 'waiting') {
    return ['queued', 'waiting', 'delayed', 'cancel_requested'].includes(
      job.state,
    );
  }
  return job.state === filter;
};

const SendPushNotification = () => {
  useNavigate();
  const toast = useToast();
  useDisclosure();
  const [sendResult, setSendResult] = React.useState(null);
  const [sendProgress, setSendProgress] = React.useState({
    current: 0,
    total: 0,
    deliveredCount: 0,
    notificationCreated: false,
    stage: 'idle',
  });
  const pollTimeoutRef = React.useRef(null);
  const activeJobIdRef = React.useRef(null);
  const [activeJobId, setActiveJobId] = React.useState(null);
  const [pushJobFilter, setPushJobFilter] = React.useState('all');

  const {
    register,
    handleSubmit,
    formState: {errors},
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  React.useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const {
    data: pushJobs = [],
    isLoading: isLoadingPushJobs,
    refetch: refetchPushJobs,
  } = useQuery({
    queryKey: ['push-notification-jobs'],
    queryFn: async () => {
      const {data} = await api.listPushNotificationJobs({limit: 12});
      return data?.results || [];
    },
    refetchInterval: activeJobId ? 3000 : 15000,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.sendPushNotification(values),
  });

  const retryJobMutation = useMutation({
    mutationFn: jobId => api.retryPushNotificationJob(jobId),
    onSuccess: ({data}) => {
      const total =
        data?.progress?.total || data?.result?.estimatedRecipients || 0;
      activeJobIdRef.current = data?.jobId || null;
      setActiveJobId(data?.jobId || null);
      setSendResult(null);
      setSendProgress({
        current: data?.progress?.current || 0,
        total,
        deliveredCount: data?.progress?.deliveredCount || 0,
        notificationCreated: Boolean(data?.progress?.notificationCreated),
        stage: data?.progress?.stage || data?.state || 'queued',
      });
      toast({
        title: 'Bildirim işi yeniden kuyruğa alındı',
        description: 'Arka planda tekrar işleniyor.',
        status: 'info',
        position: 'top',
        duration: 4000,
      });
      refetchPushJobs();
      if (data?.jobId) {
        pollPushNotificationJob(data.jobId, total);
      }
    },
    onError: error => {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: jobId => api.cancelPushNotificationJob(jobId),
    onSuccess: ({data}) => {
      const total =
        data?.progress?.total || data?.result?.estimatedRecipients || 0;
      if (activeJobIdRef.current === data?.jobId) {
        setSendProgress({
          current: data?.progress?.current || 0,
          total,
          deliveredCount: data?.progress?.deliveredCount || 0,
          notificationCreated: Boolean(data?.progress?.notificationCreated),
          stage: data?.progress?.stage || data?.state || 'cancel_requested',
        });
      }
      toast({
        title:
          data?.state === 'cancelled'
            ? 'Bildirim isi iptal edildi'
            : 'Bildirim isi icin iptal istendi',
        description:
          data?.state === 'cancelled'
            ? 'Islem tamamlanmadan sonlandirildi.'
            : 'Worker isi aldiginda iptal edilmis olarak sonlandiracak.',
        status: 'warning',
        position: 'top',
        duration: 4000,
      });
      refetchPushJobs();
    },
    onError: error => {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    },
  });

  const pruneOptionalFields = payload => {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      }),
    );
  };

  const clearPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const pollPushNotificationJob = async (jobId, fallbackTotal) => {
    try {
      const {data: status} = await api.getPushNotificationJobStatus(jobId);
      const progress = status?.progress || {};
      const total =
        progress.total ||
        status?.result?.estimatedRecipients ||
        fallbackTotal ||
        0;

      setSendProgress({
        current: progress.current || 0,
        total,
        deliveredCount:
          progress.deliveredCount || status?.result?.delivery?.totalTokens || 0,
        notificationCreated:
          Boolean(progress.notificationCreated) ||
          Boolean(status?.result?.notificationCreated),
        stage: progress.stage || status?.state || 'queued',
      });

      if (status?.state === 'completed' && status.result) {
        clearPolling();
        activeJobIdRef.current = null;
        setActiveJobId(null);
        setSendResult({
          ...status.result,
          queued: false,
          state: 'completed',
        });
        toast({
          title: 'Bildirim gönderildi',
          description: 'Bildirim işi arka planda tamamlandı.',
          status: 'success',
          position: 'top',
          duration: 5000,
        });
        refetchPushJobs();
        return;
      }

      if (status?.state === 'cancelled' || status?.result?.cancelled) {
        clearPolling();
        activeJobIdRef.current = null;
        setActiveJobId(null);
        setSendResult({
          ...(status.result || {}),
          cancelled: true,
          state: 'cancelled',
        });
        toast({
          title: 'Bildirim isi iptal edildi',
          description: 'Bekleyen bildirim gonderimi sonlandirildi.',
          status: 'warning',
          position: 'top',
          duration: 5000,
        });
        refetchPushJobs();
        return;
      }

      if (status?.state === 'failed') {
        clearPolling();
        activeJobIdRef.current = null;
        setActiveJobId(null);
        toast({
          title: 'Bildirim gönderimi başarısız oldu',
          description: status.failedReason || 'Kuyruktaki iş tamamlanamadı.',
          status: 'error',
          position: 'top',
          duration: 5000,
        });
        refetchPushJobs();
        return;
      }

      pollTimeoutRef.current = setTimeout(
        () => pollPushNotificationJob(jobId, total),
        2000,
      );
    } catch (error) {
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const onSubmit = async values => {
    try {
      setSendResult(null);
      const payload = pruneOptionalFields(values);
      payload.imageUrl =
        typeof values.imageUrl === 'string' && values.imageUrl.trim()
          ? values.imageUrl.trim()
          : '';
      const {data} = await mutateAsync(payload);
      if (data) {
        if (data.queued && data.jobId) {
          activeJobIdRef.current = data.jobId;
          setActiveJobId(data.jobId);
          setSendProgress({
            current: 0,
            total: data.estimatedRecipients || 0,
            deliveredCount: 0,
            notificationCreated: false,
            stage: data.state || 'queued',
          });
          toast({
            title: 'Bildirim kuyruğa alındı',
            description: 'Arka planda gönderim başlatıldı.',
            status: 'info',
            position: 'top',
            duration: 4000,
          });
          pollPushNotificationJob(data.jobId, data.estimatedRecipients || 0);
          return;
        }

        activeJobIdRef.current = null;
        setActiveJobId(null);
        setSendProgress({
          current: data.estimatedRecipients || 0,
          total: data.estimatedRecipients || 0,
          deliveredCount: data.delivery?.totalTokens || 0,
          notificationCreated: Boolean(data.notificationCreated),
          stage: 'completed',
        });
        setSendResult(data);
        toast({
          title: 'Bildirim gönderildi.',
          status: 'success',
          position: 'top',
        });
        refetchPushJobs();
      }
    } catch (error) {
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const filteredPushJobs = React.useMemo(
    () => pushJobs.filter(job => matchesPushJobFilter(job, pushJobFilter)),
    [pushJobs, pushJobFilter],
  );

  const pushJobFilterCounts = React.useMemo(
    () =>
      Object.fromEntries(
        pushJobFilters.map(filter => [
          filter.value,
          pushJobs.filter(job => matchesPushJobFilter(job, filter.value))
            .length,
        ]),
      ),
    [pushJobs],
  );

  return (
    <Page>
      {activeJobId && (
        <Alert
          status={
            sendProgress.stage === 'cancel_requested' ? 'warning' : 'info'
          }
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="lg"
          mb="6"
          p="4">
          <HStack width="100%" mb="3" justify="space-between">
            <HStack>
              <Spinner size="sm" color="blue.500" />
              <AlertTitle>Bildirim arka planda isleniyor</AlertTitle>
            </HStack>
            <HStack>
              <Badge colorScheme="purple" fontSize="sm">
                {formatPushStage(sendProgress.stage)}
              </Badge>
              {['queued', 'waiting'].includes(sendProgress.stage) && (
                <Button
                  size="xs"
                  colorScheme="orange"
                  variant="outline"
                  onClick={() => cancelJobMutation.mutate(activeJobId)}
                  isLoading={cancelJobMutation.isPending}>
                  Iptal Et
                </Button>
              )}
            </HStack>
          </HStack>
          <Box width="100%">
            <HStack justify="space-between" mb="2">
              <Text fontSize="sm" color="gray.600">
                Tahmini hedef: {sendProgress.total || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Gonderilen: {sendProgress.deliveredCount || 0}
              </Text>
            </HStack>
            <Progress
              value={
                sendProgress.current > 0 && sendProgress.total > 0
                  ? (sendProgress.current / sendProgress.total) * 100
                  : 100
              }
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              isIndeterminate={sendProgress.current === 0}
            />
            <Text mt="3" color="gray.500" fontSize="sm">
              Job ID: {activeJobId}
            </Text>
          </Box>
        </Alert>
      )}

      {sendResult && !activeJobId && (
        <Alert
          status={sendResult.cancelled ? 'warning' : 'success'}
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="lg"
          mb="6"
          p="4">
          <AlertIcon />
          <AlertTitle>
            {sendResult.cancelled
              ? 'Bildirim isi iptal edildi'
              : 'Bildirim gonderimi tamamlandi'}
          </AlertTitle>
          <AlertDescription mt="2" width="100%">
            <VStack align="start" spacing="2" width="100%">
              <HStack spacing="3" flexWrap="wrap">
                <Badge colorScheme={sendResult.cancelled ? 'gray' : 'green'}>
                  Hedef: {sendResult.estimatedRecipients || 0}
                </Badge>
                <Badge colorScheme="blue">
                  Push: {sendResult.delivery?.totalTokens || 0}
                </Badge>
                <Badge
                  colorScheme={
                    sendResult.notificationCreated ? 'purple' : 'gray'
                  }>
                  {sendResult.notificationCreated
                    ? 'Kalici bildirim kaydedildi'
                    : 'Kalici kayit yok'}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Sure: {((sendResult.duration || 0) / 1000).toFixed(1)}s
              </Text>
              {sendResult.cancelled && (
                <Text fontSize="sm" color="orange.600">
                  Is worker tarafindan alinmadan once sonlandirildi.
                </Text>
              )}
            </VStack>
          </AlertDescription>
        </Alert>
      )}

      <Box bg="white" borderRadius="md" boxShadow="md" p="4" mb="6">
        <HStack justify="space-between" mb="4" align="center">
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              Son Bildirim Isleri
            </Text>
            <Text fontSize="sm" color="gray.500">
              Son 12 bildirim gonderim isi, durum ve yeniden deneme islemleri.
            </Text>
          </Box>
          <Button size="sm" variant="outline" onClick={() => refetchPushJobs()}>
            Yenile
          </Button>
        </HStack>

        <Box
          mb="4"
          overflowX="auto"
          overflowY="hidden"
          whiteSpace="nowrap"
          sx={{
            '&::-webkit-scrollbar': {
              height: '6px',
            },
          }}>
          <HStack spacing="2" align="stretch" minW="max-content" pb="1">
            {pushJobFilters.map(filter => (
              <Button
                key={filter.value}
                size="sm"
                borderRadius="full"
                flexShrink={0}
                variant={pushJobFilter === filter.value ? 'solid' : 'outline'}
                colorScheme={pushJobFilter === filter.value ? 'blue' : 'gray'}
                onClick={() => setPushJobFilter(filter.value)}>
                <HStack spacing="2">
                  <Text>{filter.label}</Text>
                  <Badge
                    borderRadius="full"
                    px="2"
                    colorScheme={
                      pushJobFilter === filter.value
                        ? pushJobFilterColors[filter.value] || 'blue'
                        : pushJobFilterColors[filter.value] || 'gray'
                    }>
                    {pushJobFilterCounts[filter.value] || 0}
                  </Badge>
                </HStack>
              </Button>
            ))}
          </HStack>
        </Box>

        {isLoadingPushJobs ? (
          <Flex justify="center" py="6">
            <Spinner size="md" />
          </Flex>
        ) : pushJobs.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Henuz bildirim job kaydi yok.</Text>
          </Alert>
        ) : filteredPushJobs.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Secilen filtreye uygun bildirim isi bulunamadi.</Text>
          </Alert>
        ) : (
          <VStack align="stretch" spacing="3">
            {filteredPushJobs.map(job => {
              const total =
                job.progress?.total || job.result?.estimatedRecipients || 0;
              const current = job.progress?.current || 0;
              const stage = job.progress?.stage || job.state;
              const deliveredCount =
                job.progress?.deliveredCount ||
                job.result?.delivery?.totalTokens ||
                0;
              const notificationCreated =
                Boolean(job.progress?.notificationCreated) ||
                Boolean(job.result?.notificationCreated);
              const isFailed = job.state === 'failed';
              const isCancelled = job.state === 'cancelled';

              return (
                <Box
                  key={job.jobId}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  p="4">
                  <HStack justify="space-between" align="start" mb="2">
                    <VStack align="start" spacing="1">
                      <HStack flexWrap="wrap">
                        <Badge
                          colorScheme={pushStateColors[job.state] || 'gray'}>
                          {formatPushState(job.state)}
                        </Badge>
                        <Badge colorScheme="purple">
                          {formatPushStage(stage)}
                        </Badge>
                        <Badge colorScheme="blue">
                          {NotificationReceiverTypeLabel[job.receiverType] ||
                            job.receiverType ||
                            'Hedef'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.700">
                        {job.title || 'Basliksiz bildirim'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Job ID: {job.jobId}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Kuyruga alindi:{' '}
                        {job.queuedAt
                          ? new Date(job.queuedAt).toLocaleString('tr-TR')
                          : '-'}
                      </Text>
                    </VStack>
                    <HStack>
                      {job.canCancel && (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          onClick={() => cancelJobMutation.mutate(job.jobId)}
                          isLoading={cancelJobMutation.isPending}>
                          Iptal Et
                        </Button>
                      )}
                      {isFailed && (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          onClick={() => retryJobMutation.mutate(job.jobId)}
                          isLoading={retryJobMutation.isPending}>
                          Yeniden Dene
                        </Button>
                      )}
                    </HStack>
                  </HStack>

                  <Progress
                    value={
                      current > 0 && total > 0
                        ? (current / total) * 100
                        : job.state === 'completed'
                        ? 100
                        : 10
                    }
                    size="sm"
                    colorScheme={
                      isFailed
                        ? 'red'
                        : isCancelled
                        ? 'gray'
                        : job.state === 'completed'
                        ? 'green'
                        : 'blue'
                    }
                    borderRadius="full"
                    isIndeterminate={job.state === 'active' && current === 0}
                    mb="3"
                  />

                  <HStack
                    spacing="4"
                    flexWrap="wrap"
                    fontSize="sm"
                    color="gray.600">
                    <Text>Hedef: {total}</Text>
                    <Text>Push: {deliveredCount}</Text>
                    <Text>
                      Kalici kayit:{' '}
                      {notificationCreated ? 'Olusturuldu' : 'Yok'}
                    </Text>
                    {job.state === 'cancel_requested' && (
                      <Text color="orange.500">Iptal istegi bekliyor</Text>
                    )}
                    {isCancelled && (
                      <Text color="gray.500">Islem iptal edildi</Text>
                    )}
                    {job.channel && <Text>Kanal: {job.channel}</Text>}
                    {job.failedReason && (
                      <Text color="red.500">Hata: {job.failedReason}</Text>
                    )}
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      <Box
        bg={'white'}
        overflow={'scroll'}
        borderRadius={'md'}
        display={'flex'}
        flexDirection={'column'}
        boxShadow={'md'}
        p={'4'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex
            zIndex="2"
            direction="column"
            maxW="100%"
            background="transparent"
            borderRadius="md"
            me="auto">
            <FormControl isInvalid={!!errors.receiverType} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hedef Kitle
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Seçim yapın"
                fontWeight="500"
                size="md"
                {...register('receiverType')}>
                {notificationReceiverTypes.map(item => {
                  return (
                    <option value={item}>
                      {NotificationReceiverTypeLabel[item]}
                    </option>
                  );
                })}
              </Select>
              <FormErrorMessage>
                {errors.receiverType?.message}
              </FormErrorMessage>
            </FormControl>
            <Condition
              condition={
                watch().receiverType === NotificationReceiverType.Channel
              }>
              <FormControl isInvalid={!!errors.channel} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Kanal ID
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  fontWeight="500"
                  size="md"
                  {...register('channel')}
                />
                <FormErrorMessage>{errors.channel?.message}</FormErrorMessage>
              </FormControl>
            </Condition>
            <FormControl isInvalid={!!errors.title} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Başlık
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('title')}
              />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.body} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Mesaj
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('body')}
              />
              <FormErrorMessage>{errors.body?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.subjectType} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Şuna Yönlendir
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Seçim yapın"
                fontWeight="500"
                size="md"
                {...register('subjectType')}>
                {[
                  {value: 'none', label: 'Yok'},
                  {value: 'channel', label: 'Kanala Yönlendir'},
                  {
                    value: 'user',
                    label: 'Kullanıcıya Yönlendir',
                  },
                ].map(item => {
                  return <option value={item.value}>{item.label}</option>;
                })}
              </Select>
              <FormErrorMessage>{errors.subjectType?.message}</FormErrorMessage>
              <FormHelperText>
                Bildirime tıklanıldığında özel bir sayfaya gitmesini
                istiyorsanız buradan seçin.
              </FormHelperText>
            </FormControl>
            <FormControl isInvalid={!!errors.subject} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Yönlendirilecek ID (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('subject')}
              />
              <FormErrorMessage>{errors.subject?.message}</FormErrorMessage>
              <FormHelperText>
                Yönlendirme tipi seçtiyseniz buradan hangi ID'ye sahip kaynağa
                yönlendirileceğini seçin.
              </FormHelperText>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.shouldCreateNotification}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="shouldCreateNotification" mb={0}>
                  Kalıcı Bildirim Oluşturulsun
                </FormLabel>
                <Switch
                  id="shouldCreateNotification"
                  {...register('shouldCreateNotification')}
                />
              </Box>
              <FormHelperText>
                Aktifleştirirseniz gönderilen bildirim Bildirimler sayfasında da
                görünür.
              </FormHelperText>
              <FormErrorMessage>
                {errors.shouldCreateNotification?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isImportant}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isImportant" mb={0}>
                  Önemli
                </FormLabel>
                <Switch id="isImportant" {...register('isImportant')} />
              </Box>
              <FormHelperText>
                Aktifleştirildiğinde eğer kalıcı bildirim oluşturulmuşsa
                bildirim vurgulanır.
              </FormHelperText>
              <FormErrorMessage>{errors.isImportant?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.category} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Bildirim Tipi
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Standart"
                fontWeight="500"
                size="md"
                {...register('category')}>
                <option value="important">Önemli (yüksek öncelik)</option>
                <option value="approval">
                  Onay İste (Onayla / Reddet butonları)
                </option>
              </Select>
              <FormHelperText>
                Onay İste seçilirse mobilde Onayla / Reddet butonları
                gösterilir.
              </FormHelperText>
              <FormErrorMessage>{errors.category?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.imageUrl} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Görsel URL (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="url"
                placeholder="https://..."
                fontWeight="500"
                size="md"
                {...register('imageUrl')}
              />
              <FormHelperText>
                Bildirim üzerinde büyük görsel olarak gösterilir (Android
                BigPicture, iOS attachment).
              </FormHelperText>
              <FormErrorMessage>{errors.imageUrl?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.groupKey} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Grup Anahtarı (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                {...register('groupKey')}
              />
              <FormHelperText>
                Aynı grup anahtarı ile gönderilen bildirimler tek başlık altında
                gruplanır.
              </FormHelperText>
              <FormErrorMessage>{errors.groupKey?.message}</FormErrorMessage>
            </FormControl>
            <Condition condition={watch().category === 'approval'}>
              <FormControl isInvalid={!!errors.approveUrl} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Onayla URL'si
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  placeholder="/api/..."
                  fontWeight="500"
                  size="md"
                  {...register('approveUrl')}
                />
                <FormHelperText>
                  Onayla butonuna basıldığında POST atılacak endpoint.
                </FormHelperText>
                <FormErrorMessage>
                  {errors.approveUrl?.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.rejectUrl} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Reddet URL'si
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  placeholder="/api/..."
                  fontWeight="500"
                  size="md"
                  {...register('rejectUrl')}
                />
                <FormHelperText>
                  Reddet butonuna basıldığında POST atılacak endpoint.
                </FormHelperText>
                <FormErrorMessage>{errors.rejectUrl?.message}</FormErrorMessage>
              </FormControl>
            </Condition>
            <Button
              isLoading={isPending}
              colorScheme={'primary'}
              isDisabled={isPending}
              type="submit"
              fontSize={'sm'}>
              Gönder
            </Button>
          </Flex>
        </form>
      </Box>
    </Page>
  );
};

export default SendPushNotification;
