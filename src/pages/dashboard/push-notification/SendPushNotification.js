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
  Textarea,
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
    skipInactiveUsers: yup.boolean(),
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
    summary: yup.string(),
    summaryFocus: yup.string(),
    deepLink: yup.string(),
    marketCode: yup.string(),
    channelId: yup.string(),
    actionPrimaryId: yup.string(),
    actionPrimaryTitle: yup.string(),
    actionPrimaryValue: yup.string(),
    actionSecondaryId: yup.string(),
    actionSecondaryTitle: yup.string(),
    actionSecondaryValue: yup.string(),
  })
  .required();

const deleteSchema = yup
  .object({
    text: yup.string().required('Silinecek bildirim metni zorunludur.').min(1),
    title: yup.string(),
    since: yup.string(),
    until: yup.string(),
    confirm: yup
      .string()
      .oneOf(['DELETE'], 'Onay için DELETE yazmalısınız.')
      .required('Onay zorunludur.'),
  })
  .required();

const pushStageLabels = {
  queued: 'Kuyrukta',
  waiting: 'Bekliyor',
  preparing: 'Hazırlanıyor',
  sending: 'Gönderiliyor',
  sent: 'Push Gönderildi',
  persisting: 'Kaydediliyor',
  deleting: 'Siliniyor',
  cancel_requested: 'Iptal Istendi',
  cancelled: 'Iptal Edildi',
  completed: 'Tamamlandı',
  completed_with_errors: 'Tamamlandı (Hatalı)',
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

const getPushJobType = jobName => {
  if (jobName === 'delete-notifications-by-text') return 'delete';
  return 'send';
};

const getPushJobTypeLabel = jobName => {
  if (jobName === 'delete-notifications-by-text') return 'Silme';
  return 'Gönderim';
};

const getPushJobTypeColor = jobName => {
  if (jobName === 'delete-notifications-by-text') return 'red';
  return 'blue';
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
  const [activeJobName, setActiveJobName] = React.useState(null);
  const [pushJobFilter, setPushJobFilter] = React.useState('all');

  const {
    register,
    handleSubmit,
    formState: {errors},
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      skipInactiveUsers: true,
    },
  });

  const {
    register: registerDelete,
    handleSubmit: handleSubmitDelete,
    formState: {errors: deleteErrors},
    reset: resetDelete,
  } = useForm({
    resolver: yupResolver(deleteSchema),
    defaultValues: {
      text: '',
      title: '',
      since: '',
      until: '',
      confirm: '',
    },
  });
  const formValues = watch();
  const previewBody =
    formValues.summary || formValues.body || 'Mesaj onizlemesi';
  const previewDeepLink =
    formValues.deepLink || formValues.subject || 'default';
  const previewHasActions = Boolean(
    (formValues.actionPrimaryId && formValues.actionPrimaryTitle) ||
      (formValues.actionSecondaryId && formValues.actionSecondaryTitle) ||
      formValues.category === 'approval',
  );

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

  const {mutateAsync: deleteMutateAsync, isPending: isDeletePending} =
    useMutation({
      mutationFn: values => api.deletePushNotificationsByText(values),
    });

  const retryJobMutation = useMutation({
    mutationFn: jobId => api.retryPushNotificationJob(jobId),
    onSuccess: ({data}) => {
      const jobType = getPushJobType(data?.jobName);
      const total =
        data?.progress?.total || data?.result?.estimatedRecipients || 0;
      activeJobIdRef.current = data?.jobId || null;
      setActiveJobId(data?.jobId || null);
      setActiveJobName(data?.jobName || null);
      setSendResult(null);
      setSendProgress({
        current: data?.progress?.current || 0,
        total,
        deliveredCount: data?.progress?.deliveredCount || 0,
        notificationCreated: Boolean(data?.progress?.notificationCreated),
        stage: data?.progress?.stage || data?.state || 'queued',
      });
      toast({
        title: jobType === 'delete' ? 'Silme işi yeniden kuyruğa alındı' : 'Bildirim işi yeniden kuyruğa alındı',
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
      const jobType = getPushJobType(data?.jobName);
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
        setActiveJobName(data?.jobName || null);
      }
      toast({
        title:
          data?.state === 'cancelled'
            ? jobType === 'delete'
              ? 'Silme isi iptal edildi'
              : 'Bildirim isi iptal edildi'
            : jobType === 'delete'
            ? 'Silme isi icin iptal istendi'
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
      const jobType = getPushJobType(status?.jobName);
      setActiveJobName(status?.jobName || null);
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
        setActiveJobName(null);
        setSendResult({
          ...status.result,
          queued: false,
          state: 'completed',
        });
        toast({
          title: jobType === 'delete' ? 'Bildirim silindi' : 'Bildirim gönderildi',
          description:
            jobType === 'delete'
              ? 'Bildirim silme işi arka planda tamamlandı.'
              : 'Bildirim işi arka planda tamamlandı.',
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
        setActiveJobName(null);
        setSendResult({
          ...(status.result || {}),
          cancelled: true,
          state: 'cancelled',
        });
        toast({
          title: jobType === 'delete' ? 'Silme isi iptal edildi' : 'Bildirim isi iptal edildi',
          description:
            jobType === 'delete'
              ? 'Bekleyen bildirim silme islemi sonlandirildi.'
              : 'Bekleyen bildirim gonderimi sonlandirildi.',
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
        setActiveJobName(null);
        toast({
          title:
            jobType === 'delete'
              ? 'Bildirim silme islemi basarisiz oldu'
              : 'Bildirim gönderimi başarısız oldu',
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
      setActiveJobName(null);
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const onDeleteSubmit = async values => {
    try {
      setSendResult(null);
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);
      setActiveJobName(null);

      const payload = {
        text: values.text,
        ...(values.title ? {title: values.title} : {}),
        ...(values.since ? {since: values.since} : {}),
        ...(values.until ? {until: values.until} : {}),
        confirm: values.confirm,
      };

      const {data} = await deleteMutateAsync(payload);
      if (data) {
        if (data.queued && data.jobId) {
          activeJobIdRef.current = data.jobId;
          setActiveJobId(data.jobId);
          setActiveJobName('delete-notifications-by-text');
          resetDelete();
          setSendProgress({
            current: 0,
            total: data.estimatedRecipients || 0,
            deliveredCount: 0,
            notificationCreated: false,
            stage: data.state || 'queued',
          });
          toast({
            title: 'Silme kuyruğa alındı',
            description: 'Arka planda silme başlatıldı.',
            status: 'info',
            position: 'top',
            duration: 4000,
          });
          pollPushNotificationJob(data.jobId, data.estimatedRecipients || 0);
          return;
        }

        activeJobIdRef.current = null;
        setActiveJobId(null);
        setActiveJobName(null);
        setSendProgress({
          current: data.estimatedRecipients || 0,
          total: data.estimatedRecipients || 0,
          deliveredCount: data.delivery?.totalTokens || 0,
          notificationCreated: false,
          stage: data.state || (data.failCount > 0 ? 'completed_with_errors' : 'completed'),
        });
        setSendResult(data);
        toast({
          title: 'Bildirim silindi.',
          status: data.failCount > 0 ? 'warning' : 'success',
          position: 'top',
        });
        refetchPushJobs();
      }
    } catch (error) {
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);
      setActiveJobName(null);
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
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);
      setActiveJobName(null);
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
          setActiveJobName('send-admin-push-notification');
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
        setActiveJobName(null);
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
      setActiveJobName(null);
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
              <AlertTitle>
                {getPushJobType(activeJobName) === 'delete'
                  ? 'Silme isi arka planda isleniyor'
                  : 'Bildirim arka planda isleniyor'}
              </AlertTitle>
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
                {getPushJobType(activeJobName) === 'delete'
                  ? 'Tahmini eslesme'
                  : 'Tahmini hedef'}
                : {sendProgress.total || 0}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {getPushJobType(activeJobName) === 'delete'
                  ? 'Silinen'
                  : 'Gonderilen'}
                : {sendProgress.deliveredCount || 0}
              </Text>
            </HStack>
            <Progress
              value={
                sendProgress.current > 0 && sendProgress.total > 0
                  ? (sendProgress.current / sendProgress.total) * 100
                  : 100
              }
              size="sm"
              colorScheme={getPushJobType(activeJobName) === 'delete' ? 'red' : 'blue'}
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
              : sendResult.operation === 'delete'
              ? 'Bildirim silme tamamlandi'
              : 'Bildirim gonderimi tamamlandi'}
          </AlertTitle>
          <AlertDescription mt="2" width="100%">
            <VStack align="start" spacing="2" width="100%">
              <HStack spacing="3" flexWrap="wrap">
                <Badge colorScheme={sendResult.cancelled ? 'gray' : 'green'}>
                  Hedef: {sendResult.estimatedRecipients || 0}
                </Badge>
                <Badge colorScheme="blue">
                  {sendResult.operation === 'delete' ? 'Silinen' : 'Push'}:{' '}
                  {sendResult.delivery?.totalTokens || 0}
                </Badge>
                <Badge
                  colorScheme={
                    sendResult.notificationCreated ? 'purple' : 'gray'
                  }>
                  {sendResult.operation === 'delete'
                    ? 'Kalici kayit yok'
                    : sendResult.notificationCreated
                    ? 'Kalici bildirim kaydedildi'
                    : 'Kalici kayit yok'}
                </Badge>
                {sendResult.operation !== 'delete' && (
                  <Badge
                    colorScheme={
                      sendResult.skipInactiveUsers ? 'orange' : 'gray'
                    }>
                    {sendResult.skipInactiveUsers
                      ? 'Son 7 gun aktiflere gitti'
                      : 'Tum kullanicilar'}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Sure: {((sendResult.duration || 0) / 1000).toFixed(1)}s
              </Text>
              {sendResult.operation !== 'delete' && (
                <Text fontSize="sm" color="gray.600">
                  Pasif filtre:{' '}
                  {sendResult.skipInactiveUsers
                    ? 'Son 7 gunde aktif olan kullanicilar hedeflendi.'
                    : 'Kapali, tum uygun kullanicilar hedeflendi.'}
                </Text>
              )}
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
              const jobType = getPushJobType(job.jobName);
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
                        <Badge colorScheme={getPushJobTypeColor(job.jobName)}>
                          {getPushJobTypeLabel(job.jobName)}
                        </Badge>
                        {jobType === 'send' && (
                          <Badge colorScheme="blue">
                            {NotificationReceiverTypeLabel[job.receiverType] ||
                              job.receiverType ||
                              'Hedef'}
                          </Badge>
                        )}
                        {jobType === 'send' && (
                          <Badge
                            colorScheme={
                              job.skipInactiveUsers ? 'orange' : 'gray'
                            }>
                            {job.skipInactiveUsers
                              ? 'Son 7 gun aktiflere gitti'
                              : 'Tum kullanicilar'}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="sm" color="gray.700">
                        {jobType === 'delete'
                          ? job.title || 'Metne gore silme'
                          : job.title || 'Basliksiz bildirim'}
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
                        : jobType === 'delete'
                        ? 'red'
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
                    <Text>
                      {jobType === 'delete' ? 'Silinen' : 'Push'}:{' '}
                      {deliveredCount}
                    </Text>
                    {jobType === 'send' && (
                      <Text>
                        Kalici kayit:{' '}
                        {notificationCreated ? 'Olusturuldu' : 'Yok'}
                      </Text>
                    )}
                    {jobType === 'send' && (
                      <Text>
                        Pasif filtre:{' '}
                        {job.skipInactiveUsers
                          ? 'Son 7 gunde aktif olanlar hedeflendi'
                          : 'Kapali'}
                      </Text>
                    )}
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

      <Box bg="white" borderRadius="md" boxShadow="md" p="4" mb="6">
        <HStack justify="space-between" mb="4" align="center">
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              Bildirim Sil (Metne Gore)
            </Text>
            <Text fontSize="sm" color="gray.500">
              Daha once kaydedilmis (DB) sistem bildirimlerini metne gore topluca siler.
            </Text>
          </Box>
        </HStack>

        <Alert status="warning" borderRadius="lg" mb="4" alignItems="start">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Dikkat!</AlertTitle>
            <AlertDescription fontSize="sm">
              Islem geri alinamaz. Metin birebir ayni olmalidir. Onay icin DELETE yazin.
            </AlertDescription>
          </Box>
        </Alert>

        <form onSubmit={handleSubmitDelete(onDeleteSubmit)}>
          <FormControl isInvalid={!!deleteErrors.text} mb="4">
            <FormLabel fontWeight="600" fontSize="sm">
              Bildirim Metni (Body)
            </FormLabel>
            <Textarea
              placeholder="Silmek istediginiz bildirim metnini birebir yapistirin..."
              rows={4}
              {...registerDelete('text')}
            />
            <FormErrorMessage>{deleteErrors.text?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!deleteErrors.title} mb="4">
            <FormLabel fontWeight="600" fontSize="sm">
              Baslik (Opsiyonel)
            </FormLabel>
            <Input placeholder="Baslik (birebir eslesme)" {...registerDelete('title')} />
            <FormErrorMessage>{deleteErrors.title?.message}</FormErrorMessage>
          </FormControl>

          <HStack spacing="4" flexWrap="wrap" mb="4" align="start">
            <FormControl isInvalid={!!deleteErrors.since} flex="1" minW="240px">
              <FormLabel fontWeight="600" fontSize="sm">
                Baslangic (Opsiyonel)
              </FormLabel>
              <Input type="datetime-local" {...registerDelete('since')} />
              <FormErrorMessage>{deleteErrors.since?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!deleteErrors.until} flex="1" minW="240px">
              <FormLabel fontWeight="600" fontSize="sm">
                Bitis (Opsiyonel)
              </FormLabel>
              <Input type="datetime-local" {...registerDelete('until')} />
              <FormErrorMessage>{deleteErrors.until?.message}</FormErrorMessage>
            </FormControl>
          </HStack>

          <FormControl isInvalid={!!deleteErrors.confirm} mb="4">
            <FormLabel fontWeight="600" fontSize="sm">
              Onay
            </FormLabel>
            <Input placeholder="DELETE" autoComplete="off" {...registerDelete('confirm')} />
            <FormErrorMessage>{deleteErrors.confirm?.message}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            colorScheme="red"
            isLoading={isDeletePending}
            isDisabled={Boolean(activeJobId)}
            loadingText="Siliniyor...">
            Metne Gore Toplu Sil
          </Button>
        </form>
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
            <Alert status="info" borderRadius="lg" mb="4" alignItems="start">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">
                  Rich notification uyumlulugu
                </AlertTitle>
                <AlertDescription fontSize="sm">
                  `C:\mobile2\src` tarafinda tam rich notification icin esik su
                  an `Android {'>='} 2.8.0` ve `iOS {'>='} 2.8.0`. `appVersion`
                  bossa da eski client gibi davranir. Daha eski clientlerde
                  bildirim yine ulasir ama genelde standart push gorunumuyle
                  kalir.
                </AlertDescription>
              </Box>
            </Alert>
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p="4"
              mb="4"
              bg="gray.50">
              <HStack justify="space-between" align="start" mb="3">
                <Box>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">
                    Canli Onizleme
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Yeni clientte yaklasik gorunum
                  </Text>
                </Box>
                <HStack spacing="2" flexWrap="wrap" justify="flex-end">
                  <Badge
                    colorScheme={
                      formValues.category === 'approval'
                        ? 'orange'
                        : formValues.category === 'important'
                        ? 'red'
                        : 'gray'
                    }>
                    {formValues.category || 'default'}
                  </Badge>
                  {formValues.groupKey && (
                    <Badge colorScheme="purple">Group</Badge>
                  )}
                  {previewHasActions && (
                    <Badge colorScheme="blue">Aksiyonlu</Badge>
                  )}
                  {formValues.imageUrl && (
                    <Badge colorScheme="green">Gorselli</Badge>
                  )}
                </HStack>
              </HStack>
              <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                bg="white"
                p="4"
                boxShadow="sm">
                <HStack align="start" spacing="3">
                  <Flex
                    width="10"
                    height="10"
                    borderRadius="full"
                    bg={
                      formValues.category === 'approval'
                        ? 'orange.100'
                        : formValues.category === 'important'
                        ? 'red.100'
                        : 'blue.100'
                    }
                    align="center"
                    justify="center"
                    color={
                      formValues.category === 'approval'
                        ? 'orange.700'
                        : formValues.category === 'important'
                        ? 'red.700'
                        : 'blue.700'
                    }
                    fontSize="xs"
                    fontWeight="700">
                    App
                  </Flex>
                  <Box flex="1">
                    <HStack justify="space-between" align="start" mb="1">
                      <Text fontSize="sm" fontWeight="700" color="gray.800">
                        {formValues.title || 'Bildirim Basligi'}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        simdi
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
                      {previewBody}
                    </Text>
                    {formValues.imageUrl && (
                      <Box
                        mt="3"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                        bg="gray.100"
                        px="3"
                        py="2">
                        <Text fontSize="xs" color="gray.600" isTruncated>
                          Gorsel: {formValues.imageUrl}
                        </Text>
                      </Box>
                    )}
                    <HStack spacing="2" flexWrap="wrap" mt="3">
                      {formValues.category === 'approval' ? (
                        <>
                          <Button
                            size="xs"
                            colorScheme="green"
                            variant="outline">
                            Onayla
                          </Button>
                          <Button size="xs" colorScheme="red" variant="outline">
                            Reddet
                          </Button>
                        </>
                      ) : (
                        <>
                          {formValues.actionPrimaryId &&
                            formValues.actionPrimaryTitle && (
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="outline">
                                {formValues.actionPrimaryTitle}
                              </Button>
                            )}
                          {formValues.actionSecondaryId &&
                            formValues.actionSecondaryTitle && (
                              <Button
                                size="xs"
                                colorScheme="gray"
                                variant="outline">
                                {formValues.actionSecondaryTitle}
                              </Button>
                            )}
                        </>
                      )}
                    </HStack>
                    <HStack spacing="3" flexWrap="wrap" mt="3">
                      <Text fontSize="xs" color="gray.500">
                        Deep link: {previewDeepLink}
                      </Text>
                      {formValues.marketCode && (
                        <Text fontSize="xs" color="gray.500">
                          Market: {formValues.marketCode}
                        </Text>
                      )}
                      {formValues.channelId && (
                        <Text fontSize="xs" color="gray.500">
                          Channel: {formValues.channelId}
                        </Text>
                      )}
                      {formValues.summaryFocus && (
                        <Text fontSize="xs" color="gray.500">
                          Focus: {formValues.summaryFocus}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </HStack>
              </Box>
            </Box>
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
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                rows={3}
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
              isInvalid={!!errors.skipInactiveUsers}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="skipInactiveUsers" mb={0}>
                  7 gun pasif kullanicilara push gonderme
                </FormLabel>
                <Switch
                  id="skipInactiveUsers"
                  {...register('skipInactiveUsers')}
                />
              </Box>
              <FormHelperText>
                Aciksa son 7 gunde aktif olmayan kullanicilar bu admin
                bildirimini almaz. Kalici bildirim olusturulursa onlar icin
                kayit da yazilmaz.
              </FormHelperText>
              <FormErrorMessage>
                {errors.skipInactiveUsers?.message}
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
            <FormControl isInvalid={!!errors.summary} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Ozet Metni (Opsiyonel)
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                rows={2}
                {...register('summary')}
              />
              <FormHelperText>
                Ozellikle grouped ve rich kartlarda govde yerine one cikarilacak
                kisa metin olarak kullanilir.
              </FormHelperText>
              <FormErrorMessage>{errors.summary?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.summaryFocus} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Ozet Odagi (Opsiyonel)
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Otomatik"
                fontWeight="500"
                size="md"
                {...register('summaryFocus')}>
                <option value="hero">hero</option>
                <option value="insights">insights</option>
                <option value="surprise">surprise</option>
                <option value="recommendations">recommendations</option>
              </Select>
              <FormHelperText>
                Market ozet gibi ekranlarda hangi bolume odaklanilacagini
                belirler.
              </FormHelperText>
              <FormErrorMessage>
                {errors.summaryFocus?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.deepLink} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Deep Link (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                placeholder="hissechat://market/BIST100 veya default"
                fontWeight="500"
                size="md"
                {...register('deepLink')}
              />
              <FormHelperText>
                Bildirime basildiginda uygulama ici yonlendirme icin kullanilir.
              </FormHelperText>
              <FormErrorMessage>{errors.deepLink?.message}</FormErrorMessage>
            </FormControl>
            <HStack align="start" spacing="4" flexWrap="wrap">
              <FormControl isInvalid={!!errors.marketCode} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Market Code (Opsiyonel)
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  fontWeight="500"
                  size="md"
                  {...register('marketCode')}
                />
                <FormHelperText>Ornek: BIST100, BTCUSDT</FormHelperText>
                <FormErrorMessage>
                  {errors.marketCode?.message}
                </FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.channelId} mb="4">
                <FormLabel
                  display="flex"
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  mb="8px">
                  Channel ID (Opsiyonel)
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="text"
                  fontWeight="500"
                  size="md"
                  {...register('channelId')}
                />
                <FormHelperText>
                  Sessize al gibi kanal aksiyonlarinda kullanilir.
                </FormHelperText>
                <FormErrorMessage>{errors.channelId?.message}</FormErrorMessage>
              </FormControl>
            </HStack>
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
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p="4"
              mb="4">
              <Text fontSize="sm" fontWeight="600" mb="3">
                Ozel Aksiyon Butonlari
              </Text>
              <HStack align="start" spacing="4" flexWrap="wrap">
                <FormControl isInvalid={!!errors.actionPrimaryId} mb="4">
                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    mb="8px">
                    Birincil Aksiyon ID
                  </FormLabel>
                  <Input
                    fontSize="sm"
                    type="text"
                    fontWeight="500"
                    size="md"
                    {...register('actionPrimaryId')}
                  />
                  <FormErrorMessage>
                    {errors.actionPrimaryId?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.actionPrimaryTitle} mb="4">
                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    mb="8px">
                    Birincil Buton Metni
                  </FormLabel>
                  <Input
                    fontSize="sm"
                    type="text"
                    fontWeight="500"
                    size="md"
                    {...register('actionPrimaryTitle')}
                  />
                  <FormErrorMessage>
                    {errors.actionPrimaryTitle?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.actionPrimaryValue} mb="4">
                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    mb="8px">
                    Birincil Deger
                  </FormLabel>
                  <Input
                    fontSize="sm"
                    type="text"
                    fontWeight="500"
                    size="md"
                    {...register('actionPrimaryValue')}
                  />
                  <FormErrorMessage>
                    {errors.actionPrimaryValue?.message}
                  </FormErrorMessage>
                </FormControl>
              </HStack>
              <HStack align="start" spacing="4" flexWrap="wrap">
                <FormControl isInvalid={!!errors.actionSecondaryId} mb="4">
                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    mb="8px">
                    Ikincil Aksiyon ID
                  </FormLabel>
                  <Input
                    fontSize="sm"
                    type="text"
                    fontWeight="500"
                    size="md"
                    {...register('actionSecondaryId')}
                  />
                  <FormErrorMessage>
                    {errors.actionSecondaryId?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.actionSecondaryTitle} mb="4">
                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    mb="8px">
                    Ikincil Buton Metni
                  </FormLabel>
                  <Input
                    fontSize="sm"
                    type="text"
                    fontWeight="500"
                    size="md"
                    {...register('actionSecondaryTitle')}
                  />
                  <FormErrorMessage>
                    {errors.actionSecondaryTitle?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.actionSecondaryValue} mb="4">
                  <FormLabel
                    display="flex"
                    ms="4px"
                    fontSize="sm"
                    fontWeight="500"
                    mb="8px">
                    Ikincil Deger
                  </FormLabel>
                  <Input
                    fontSize="sm"
                    type="text"
                    fontWeight="500"
                    size="md"
                    {...register('actionSecondaryValue')}
                  />
                  <FormErrorMessage>
                    {errors.actionSecondaryValue?.message}
                  </FormErrorMessage>
                </FormControl>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Yeni clientlerde en fazla iki aksiyon butonu render edilir.
              </Text>
            </Box>
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
