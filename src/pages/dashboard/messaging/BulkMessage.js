import React, {useState} from 'react';
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
import {
  FiSend,
  FiMessageCircle,
  FiTrendingUp,
  FiImage,
  FiVideo,
  FiMusic,
  FiUpload,
  FiX,
  FiFile,
  FiSmile,
  FiActivity,
  FiRefreshCw,
  FiCpu,
  FiPieChart,
  FiStar,
} from 'react-icons/fi';
import useFileInput from '../../../hooks/useFileInput';
const EmojiPickerLazy = React.lazy(() => import('emoji-picker-react'));

const schema = yup
  .object({
    message: yup.string().notRequired(),
    targetType: yup.string().required('Hedef kitle seçimi zorunludur.'),
    selectedChannels: yup.array().when('targetType', {
      is: 'selected',
      then: schema => schema.min(1, 'En az bir kanal seçmelisiniz.'),
      otherwise: schema => schema.notRequired(),
    }),
  })
  .required();

const deleteSchema = yup
  .object({
    text: yup.string().notRequired(),
    mediaUrl: yup
      .string()
      .nullable()
      .transform(value => {
        if (typeof value !== 'string') return value;
        const cleaned = value.replace(/`+/g, '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return null;
        try {
          return new URL(encodeURI(cleaned)).toString();
        } catch {
          return cleaned;
        }
      })
      .test(
        'valid-media-url',
        'Geçerli bir medya linki girin.',
        value => {
          if (!value) return true;
          if (typeof value !== 'string') return false;
          if (!/^https?:\/\//i.test(value)) return false;
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
      ),
    confirm: yup
      .string()
      .oneOf(['DELETE'], 'Onay için DELETE yazmalısınız.')
      .required('Onay zorunludur.'),
    since: yup.string().notRequired(),
    until: yup.string().notRequired(),
  })
  .test(
    'delete-filter-required',
    'Silmek için mesaj metni veya medya linki girmelisiniz.',
    function validateDeleteFilters(values) {
      const hasText = typeof values?.text === 'string' && values.text.trim().length > 0;
      const hasMediaUrl =
        typeof values?.mediaUrl === 'string' && values.mediaUrl.trim().length > 0;
      if (hasText || hasMediaUrl) {
        return true;
      }
      return this.createError({
        path: 'text',
        message: 'Silmek için mesaj metni veya medya linki girmelisiniz.',
      });
    },
  )
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
const isViopChannel = c =>
  c.type === 'market' &&
  (c.marketCode?.startsWith('F_') ||
    c.name?.toUpperCase().includes('VİOP') ||
    c.marketCode?.includes('VIOP'));

// Helper to fetch all items with pagination
const fetchAll = async (apiFunc, params = {}) => {
  const limit = 100; // Max limit allowed by API
  const firstRes = await apiFunc({...params, limit, page: 1});

  if (!firstRes.data) return [];

  let allResults = firstRes.data.results || [];
  const totalPages = firstRes.data.totalPages || 1;

  if (totalPages > 1) {
    const promises = [];
    for (let page = 2; page <= totalPages; page += 1) {
      promises.push(apiFunc({...params, limit, page}));
    }
    const responses = await Promise.all(promises);
    responses.forEach(res => {
      if (res.data?.results) {
        allResults = allResults.concat(res.data.results);
      }
    });
  }

  return allResults;
};

const bulkStageLabels = {
  uploading: 'Medya Yükleniyor',
  queued: 'Kuyrukta',
  waiting: 'Bekliyor',
  preparing: 'Hazırlanıyor',
  persisted: 'Veritabanına Yazıldı',
  fanout: 'Kanallara Dağıtılıyor',
  deleting: 'Siliniyor',
  cancel_requested: 'İptal İstendi',
  cancelled: 'İptal Edildi',
  completed: 'Tamamlandı',
  completed_with_errors: 'Tamamlandı (Hatalı)',
  failed: 'Başarısız',
  active: 'İşleniyor',
};

const bulkStateColors = {
  completed: 'green',
  failed: 'red',
  active: 'blue',
  waiting: 'yellow',
  delayed: 'orange',
  cancel_requested: 'orange',
  cancelled: 'gray',
};

const formatBulkStage = stage =>
  bulkStageLabels[stage] || (stage ? stage : 'Hazırlanıyor');

const formatBulkState = state =>
  bulkStageLabels[state] || (state ? state : 'Bekliyor');

const bulkJobFilters = [
  {value: 'all', label: 'Tümü'},
  {value: 'active', label: 'Aktif'},
  {value: 'waiting', label: 'Bekleyen'},
  {value: 'failed', label: 'Başarısız'},
  {value: 'cancelled', label: 'İptal'},
  {value: 'completed', label: 'Tamamlanan'},
];

const bulkJobFilterColors = {
  all: 'purple',
  active: 'blue',
  waiting: 'orange',
  failed: 'red',
  cancelled: 'gray',
  completed: 'green',
};

const matchesBulkJobFilter = (job, filter) => {
  if (filter === 'all') return true;
  if (filter === 'active') return job.state === 'active';
  if (filter === 'waiting') {
    return ['queued', 'waiting', 'delayed', 'cancel_requested'].includes(
      job.state,
    );
  }
  return job.state === filter;
};

const getBulkJobType = jobName => {
  if (jobName === 'delete-bulk-message-by-text') return 'delete';
  return 'send';
};

const getBulkJobTypeLabel = jobName => {
  if (jobName === 'delete-bulk-message-by-text') return 'Silme';
  return 'Gönderim';
};

const getBulkJobTypeColor = jobName => {
  if (jobName === 'delete-bulk-message-by-text') return 'red';
  return 'blue';
};

const mediaTypeMeta = {
  image: {
    label: 'Gorsel',
    icon: '🖼️',
    colorScheme: 'green',
  },
  video: {
    label: 'Video',
    icon: '🎬',
    colorScheme: 'purple',
  },
  audio: {
    label: 'Ses',
    icon: '🎵',
    colorScheme: 'orange',
  },
  file: {
    label: 'Dosya',
    icon: '📄',
    colorScheme: 'blue',
  },
};

const BulkMessage = () => {
  const toast = useToast();
  const [sendResult, setSendResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [sendProgress, setSendProgress] = useState({
    current: 0,
    total: 0,
    successCount: 0,
    failCount: 0,
    stage: 'idle',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [bulkJobFilter, setBulkJobFilter] = useState('all');
  const textareaRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);
  const pollTimeoutRef = React.useRef(null);
  const activeJobIdRef = React.useRef(null);
  const [activeJobId, setActiveJobId] = useState(null);

  // File inputs for different media types
  const imageInput = useFileInput({
    accept: 'image/*',
    multiple: true,
    validateOnSelect: false,
  });
  const videoInput = useFileInput({
    accept: 'video/*',
    multiple: true,
    validateOnSelect: false,
  });
  const audioInput = useFileInput({
    accept: 'audio/*',
    multiple: true,
    validateOnSelect: false,
  });
  const fileInput = useFileInput({
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar',
    multiple: true,
    validateOnSelect: false,
  });

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
      targetType: 'all_channels',
      selectedChannels: [],
      message: '',
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
      mediaUrl: '',
      since: '',
      until: '',
      confirm: '',
    },
  });

  React.useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Fetch all channels for selection
  const targetType = watch('targetType');
  const {data: channelsData, isLoading: isLoadingChannels} = useQuery({
    queryKey: ['all-channels-for-bulk'],
    queryFn: () => fetchAll(api.getAllChannels),
    staleTime: 300000,
    cacheTime: 900000,
    refetchOnWindowFocus: false,
  });

  // Fetch VIP channels
  const {data: vipChannelsData} = useQuery({
    queryKey: ['vip-channels-for-bulk'],
    queryFn: () => fetchAll(api.getVipChannels),
    staleTime: 300000,
    cacheTime: 900000,
    refetchOnWindowFocus: false,
  });

  // Fetch VIOP Markets
  const {data: viopMarketsData} = useQuery({
    queryKey: ['viop-markets-bulk'],
    queryFn: () => fetchAll(api.getMarkets, {type: 'viop'}),
    staleTime: 300000,
    cacheTime: 900000,
    refetchOnWindowFocus: false,
  });

  // Fetch Crypto Markets
  const {data: cryptoMarketsData} = useQuery({
    queryKey: ['crypto-markets-bulk'],
    queryFn: () => fetchAll(api.getMarkets, {type: 'crypto'}),
    staleTime: 300000,
    cacheTime: 900000,
    refetchOnWindowFocus: false,
  });

  // Fetch Stock Markets
  const {data: stockMarketsData} = useQuery({
    queryKey: ['stock-markets-bulk'],
    queryFn: () => fetchAll(api.getMarkets, {type: 'stock'}),
    staleTime: 300000,
    cacheTime: 900000,
    refetchOnWindowFocus: false,
  });

  // Fetch Funds
  const {data: fundsData} = useQuery({
    queryKey: ['funds-list-bulk'],
    queryFn: () => fetchAll(api.getFunds),
    staleTime: 300000,
    cacheTime: 900000,
    refetchOnWindowFocus: false,
  });

  const {
    data: bulkJobs = [],
    isLoading: isLoadingBulkJobs,
    refetch: refetchBulkJobs,
  } = useQuery({
    queryKey: ['bulk-message-jobs'],
    queryFn: async () => {
      const {data} = await api.listBulkMessageJobs({limit: 12});
      return data?.results || [];
    },
    refetchInterval: activeJobId ? 3000 : 15000,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      return api.sendBulkMessage(values, {
        signal: abortControllerRef.current.signal,
      });
    },
  });

  const {mutateAsync: deleteMutateAsync, isPending: isDeletePending} =
    useMutation({
      mutationFn: values => {
        abortControllerRef.current = new AbortController();
        return api.deleteBulkMessagesByText(values, {
          signal: abortControllerRef.current.signal,
        });
      },
    });

  // Merge VİOP markets with existing channels
  const mergedViopChannels = React.useMemo(() => {
    if (!viopMarketsData) return [];
    return viopMarketsData.map(market => {
      const existingChannel = channelsData?.find(
        c => c.marketCode === market.code,
      );
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
      const existingChannel = channelsData?.find(
        c => c.marketCode === market.code,
      );
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
      const existingChannel = channelsData?.find(
        c => c.marketCode === market.code,
      );
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
    if (activeJobIdRef.current) {
      if (['queued', 'waiting'].includes(sendProgress.stage)) {
        cancelJobMutation.mutate(activeJobIdRef.current);
        return;
      }
      toast({
        title: 'İşlem başladı',
        description: 'Başlamış bulk işi güvenli şekilde yarıda kesilmiyor.',
        status: 'info',
        position: 'top',
      });
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsCancelled(true);
      setIsSending(false);
      setIsDeleting(false);
      setIsUploading(false);
      toast({
        title: 'İşlem iptal edildi',
        description: isDeleting
          ? 'Bazı mesajlar silinmiş olabilir.'
          : 'Bazı mesajlar gönderilmiş olabilir.',
        status: 'warning',
        position: 'top',
        duration: 5000,
      });
    }
  };

  const clearPolling = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const resetComposer = () => {
    reset();
    imageInput.reset();
    videoInput.reset();
    audioInput.reset();
    fileInput.reset();
  };

  const getSelectedMediaItems = React.useCallback(() => {
    const collect = (input, type) =>
      (input.selectedFiles || []).map(file => ({
        type,
        file,
      }));

    return [
      ...collect(imageInput, 'image'),
      ...collect(videoInput, 'video'),
      ...collect(audioInput, 'audio'),
      ...collect(fileInput, 'file'),
    ];
  }, [audioInput, fileInput, imageInput, videoInput]);

  const uploadBulkMediaItems = React.useCallback(async () => {
    const mediaFiles = getSelectedMediaItems();
    const uploadedItems = [];

    for (const media of mediaFiles) {
      // eslint-disable-next-line no-await-in-loop
      const url = await (media.type === 'image'
        ? imageInput.upload({file: media.file})
        : media.type === 'video'
        ? videoInput.upload({file: media.file})
        : media.type === 'audio'
        ? audioInput.upload({file: media.file})
        : fileInput.upload({file: media.file}));

      if (!url) {
        throw new Error(
          `${
            mediaTypeMeta[media.type]?.label || 'Medya'
          } yuklenemedi. Lutfen tekrar deneyin.`,
        );
      }

      uploadedItems.push({
        type: media.type,
        url,
        ...(media.type === 'video' ? {videoStatus: 'uploaded'} : {}),
        ...(media.type === 'audio' ? {audioStatus: 'uploaded'} : {}),
      });
    }

    return uploadedItems;
  }, [audioInput, fileInput, getSelectedMediaItems, imageInput, videoInput]);

  const pollBulkMessageJob = async (jobId, fallbackTotal) => {
    try {
      const {data: status} = await api.getBulkMessageJobStatus(jobId);
      const progress = status?.progress || {};
      const jobType = getBulkJobType(status?.jobName);
      const total =
        progress.total || status?.result?.totalChannels || fallbackTotal || 0;

      setSendProgress({
        current: progress.current || 0,
        total,
        successCount: progress.successCount || 0,
        failCount: progress.failCount || 0,
        stage: progress.stage || status?.state || 'queued',
      });

      if (status?.state === 'completed' && status.result) {
        clearPolling();
        activeJobIdRef.current = null;
        setActiveJobId(null);
        setIsSending(false);
        setIsDeleting(false);
        setSendResult({
          ...status.result,
          queued: false,
          state: 'completed',
        });
        toast({
          title:
            jobType === 'delete'
              ? 'Toplu mesaj silme tamamlandı!'
              : 'Toplu mesaj gönderildi!',
          description:
            jobType === 'delete'
              ? `${status.result.successCount || 0} mesaj silindi.`
              : `${
                  status.result.successCount || 0
                } kanala başarıyla gönderildi.`,
          status: 'success',
          position: 'top',
          duration: 5000,
        });
        refetchBulkJobs();
        return;
      }

      if (status?.state === 'cancelled' || status?.result?.cancelled) {
        clearPolling();
        activeJobIdRef.current = null;
        setActiveJobId(null);
        setIsSending(false);
        setIsDeleting(false);
        setSendResult({
          ...(status.result || {}),
          cancelled: true,
          state: 'cancelled',
        });
        toast({
          title:
            jobType === 'delete'
              ? 'Toplu silme işi iptal edildi'
              : 'Bulk mesaj işi iptal edildi',
          description:
            jobType === 'delete'
              ? 'Bekleyen toplu silme işlemi sonlandırıldı.'
              : 'Bekleyen bulk mesaj gönderimi sonlandırıldı.',
          status: 'warning',
          position: 'top',
          duration: 5000,
        });
        refetchBulkJobs();
        return;
      }

      if (status?.state === 'failed') {
        clearPolling();
        activeJobIdRef.current = null;
        setActiveJobId(null);
        setIsSending(false);
        setIsDeleting(false);
        toast({
          title:
            jobType === 'delete'
              ? 'Toplu silme işlemi başarısız oldu'
              : 'Toplu mesaj gönderimi başarısız oldu',
          description: status.failedReason || 'Kuyruktaki işlem tamamlanamadı.',
          status: 'error',
          position: 'top',
          duration: 5000,
        });
        refetchBulkJobs();
        return;
      }

      pollTimeoutRef.current = setTimeout(
        () => pollBulkMessageJob(jobId, total),
        2000,
      );
    } catch (error) {
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);
      setIsSending(false);
      setIsDeleting(false);
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const retryJobMutation = useMutation({
    mutationFn: jobId => api.retryBulkMessageJob(jobId),
    onSuccess: ({data}) => {
      const jobType = getBulkJobType(data?.jobName);
      const total = data?.progress?.total || data?.result?.totalChannels || 0;
      activeJobIdRef.current = data?.jobId || null;
      setActiveJobId(data?.jobId || null);
      setSendResult(null);
      setIsCancelled(false);
      setIsSending(jobType === 'send');
      setIsDeleting(jobType === 'delete');
      setSendProgress({
        current: data?.progress?.current || 0,
        total,
        successCount: data?.progress?.successCount || 0,
        failCount: data?.progress?.failCount || 0,
        stage: data?.progress?.stage || data?.state || 'queued',
      });
      toast({
        title: 'Bulk mesaj işi yeniden kuyruğa alındı',
        description: 'Arka planda tekrar işleniyor.',
        status: 'info',
        position: 'top',
        duration: 4000,
      });
      refetchBulkJobs();
      if (data?.jobId) {
        pollBulkMessageJob(data.jobId, total);
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
    mutationFn: jobId => api.cancelBulkMessageJob(jobId),
    onSuccess: ({data}) => {
      const total = data?.progress?.total || data?.result?.totalChannels || 0;
      if (activeJobIdRef.current === data?.jobId) {
        setSendProgress({
          current: data?.progress?.current || 0,
          total,
          successCount: data?.progress?.successCount || 0,
          failCount: data?.progress?.failCount || 0,
          stage: data?.progress?.stage || data?.state || 'cancel_requested',
        });
      }
      toast({
        title:
          data?.state === 'cancelled'
            ? 'Bulk mesaj işi iptal edildi'
            : 'Bulk mesaj işi için iptal istendi',
        description:
          data?.state === 'cancelled'
            ? 'İşlem tamamlanmadan sonlandırıldı.'
            : 'Worker işi aldığında iptal edilmiş olarak sonlandıracak.',
        status: 'warning',
        position: 'top',
        duration: 4000,
      });
      refetchBulkJobs();
    },
    onError: error => {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    },
  });

  // Calculate target channel count based on selection
  const getTargetChannelCount = () => {
    const targetType = watch('targetType');
    const selectedChannels = watch('selectedChannels') || [];

    switch (targetType) {
      case 'all_channels':
        const othersCount =
          channelsData?.filter(
            c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund',
          ).length || 0;
        return (
          mergedStockChannels.length +
          mergedCryptoChannels.length +
          mergedViopChannels.length +
          mergedFundChannels.length +
          (vipChannelsData?.length || 0) +
          othersCount
        );
      case 'all_markets':
        return (
          mergedStockChannels.length +
          mergedCryptoChannels.length +
          mergedViopChannels.length
        );
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

  const onSubmit = async values => {
    try {
      const trimmedMessage = String(values.message || '').trim();
      const selectedMediaItems = getSelectedMediaItems();

      if (!trimmedMessage && selectedMediaItems.length === 0) {
        toast({
          title: 'Mesaj veya medya eklemelisiniz.',
          status: 'error',
          position: 'top',
        });
        return;
      }

      setSendResult(null);
      setIsCancelled(false);
      setIsDeleting(false);
      setIsUploading(true);
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);

      const totalChannels = getTargetChannelCount();
      setSendProgress({
        current: 0,
        total: totalChannels,
        successCount: 0,
        failCount: 0,
        stage: 'uploading',
      });

      const uploadedMediaItems =
        selectedMediaItems.length > 0 ? await uploadBulkMediaItems() : [];

      setIsUploading(false);
      setIsSending(true);

      // Transform all_funds and all_viop to selected list if backend doesn't support them natively
      // We assume backend might only know about market/vip/all.
      let submissionValues = {
        ...values,
        message: trimmedMessage,
        mediaItems: uploadedMediaItems,
      };

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

      if (data) {
        if (data.queued && data.jobId) {
          activeJobIdRef.current = data.jobId;
          setActiveJobId(data.jobId);
          resetComposer();
          setSendProgress({
            current: 0,
            total: data.totalChannels || totalChannels,
            successCount: 0,
            failCount: 0,
            stage: data.state || 'queued',
          });
          toast({
            title: 'Toplu mesaj kuyruğa alındı',
            description: `${
              data.totalChannels || totalChannels
            } kanal için arka planda işleniyor.`,
            status: 'info',
            position: 'top',
            duration: 4000,
          });
          pollBulkMessageJob(data.jobId, data.totalChannels || totalChannels);
          return;
        }

        activeJobIdRef.current = null;
        setActiveJobId(null);
        setIsSending(false);
        setSendProgress({
          current: totalChannels,
          total: totalChannels,
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          stage: 'completed',
        });
        setSendResult(data);
        toast({
          title: 'Toplu mesaj gönderildi!',
          description: `${data.successCount || 0} kanala başarıyla gönderildi.`,
          status: 'success',
          position: 'top',
          duration: 5000,
        });
        resetComposer();
        refetchBulkJobs();
      }
    } catch (error) {
      setIsUploading(false);
      setIsSending(false);
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);

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

  const onDeleteSubmit = async values => {
    try {
      setSendResult(null);
      setIsCancelled(false);
      setIsUploading(false);
      setIsSending(false);
      setIsDeleting(true);
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);

      setSendProgress({
        current: 0,
        total: 0,
        successCount: 0,
        failCount: 0,
        stage: 'preparing',
      });

      const payload = {
        text: values.text,
        confirm: values.confirm,
        ...(values.since ? {since: values.since} : {}),
        ...(values.until ? {until: values.until} : {}),
      };

      const {data} = await deleteMutateAsync(payload);

      if (data) {
        if (data.queued && data.jobId) {
          activeJobIdRef.current = data.jobId;
          setActiveJobId(data.jobId);
          resetDelete();
          setSendProgress({
            current: 0,
            total: 0,
            successCount: 0,
            failCount: 0,
            stage: data.state || 'queued',
          });
          toast({
            title: 'Toplu silme kuyruğa alındı',
            description: 'Arka planda silme işlemi başlatıldı.',
            status: 'info',
            position: 'top',
            duration: 4000,
          });
          pollBulkMessageJob(data.jobId, 0);
          return;
        }

        activeJobIdRef.current = null;
        setActiveJobId(null);
        setIsDeleting(false);
        setSendProgress({
          current: data.successCount + data.failCount,
          total: data.successCount + data.failCount,
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          stage:
            data.state ||
            (data.failCount > 0 ? 'completed_with_errors' : 'completed'),
        });
        setSendResult(data);
        toast({
          title: 'Toplu mesaj silme tamamlandı!',
          description: `${data.successCount || 0} mesaj silindi.`,
          status: data.failCount > 0 ? 'warning' : 'success',
          position: 'top',
          duration: 5000,
        });
        refetchBulkJobs();
      }
    } catch (error) {
      setIsDeleting(false);
      clearPolling();
      activeJobIdRef.current = null;
      setActiveJobId(null);

      if (error.name === 'AbortError' || error.message === 'canceled') {
        return;
      }

      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const selectedChannels = watch('selectedChannels') || [];

  // Calculate target channel count
  const getTargetCount = getTargetChannelCount;

  // Check if any media is selected
  const hasMedia = getSelectedMediaItems().length > 0;
  const selectedMediaSummary = React.useMemo(
    () => [
      ...((imageInput.selectedFiles || []).map((file, index) => ({
        id: `image-${index}-${file.name}`,
        type: 'image',
        name: file.name,
        size: file.size,
        previewUrl: imageInput.objectUrls?.[index],
      })) || []),
      ...((videoInput.selectedFiles || []).map((file, index) => ({
        id: `video-${index}-${file.name}`,
        type: 'video',
        name: file.name,
        size: file.size,
        previewUrl: videoInput.objectUrls?.[index],
      })) || []),
      ...((audioInput.selectedFiles || []).map((file, index) => ({
        id: `audio-${index}-${file.name}`,
        type: 'audio',
        name: file.name,
        size: file.size,
        previewUrl: audioInput.objectUrls?.[index],
      })) || []),
      ...((fileInput.selectedFiles || []).map((file, index) => ({
        id: `file-${index}-${file.name}`,
        type: 'file',
        name: file.name,
        size: file.size,
        previewUrl: fileInput.objectUrls?.[index],
      })) || []),
    ],
    [
      audioInput.objectUrls,
      audioInput.selectedFiles,
      fileInput.objectUrls,
      fileInput.selectedFiles,
      imageInput.objectUrls,
      imageInput.selectedFiles,
      videoInput.objectUrls,
      videoInput.selectedFiles,
    ],
  );

  // Group channels by type for display
  const stockChannels = mergedStockChannels.filter(c => !!(c.name || c.label));
  const cryptoChannels = mergedCryptoChannels.filter(
    c => !!(c.name || c.label),
  );
  const vipChannels = (vipChannelsData || []).filter(
    c => !!(c.name || c.label),
  );
  const fundChannels = mergedFundChannels.filter(c => !!(c.name || c.label));
  const viopChannels = mergedViopChannels.filter(c => !!(c.name || c.label));

  // Combine for selection list
  // Note: We might want to separate them in the UI later, but for now we group them as "Market" excluding VIOP if that was the pattern,
  // or just put Stock and Crypto in Market.
  const marketChannels = [...stockChannels, ...cryptoChannels];
  const otherChannels =
    (
      channelsData?.filter(
        c => c.type !== 'market' && c.type !== 'vip' && c.type !== 'fund',
      ) || []
    ).filter(c => !!(c.name || c.label)) || [];

  const filteredBulkJobs = React.useMemo(
    () => bulkJobs.filter(job => matchesBulkJobFilter(job, bulkJobFilter)),
    [bulkJobs, bulkJobFilter],
  );

  const bulkJobFilterCounts = React.useMemo(
    () =>
      Object.fromEntries(
        bulkJobFilters.map(filter => [
          filter.value,
          bulkJobs.filter(job => matchesBulkJobFilter(job, filter.value))
            .length,
        ]),
      ),
    [bulkJobs],
  );

  return (
    <Page>
      <Box mb="6">
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          Toplu Mesaj
        </Text>
        <Text color="gray.500" mt="1">
          Tüm kanallara veya seçili kanallara toplu mesaj gönderin; isterseniz
          metne göre toplu silin.
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
          flex="1">
          <StatLabel color="gray.500">
            <HStack>
              <Icon as={FiMessageCircle} />
              <Text>Tümü</Text>
            </HStack>
          </StatLabel>
          <StatNumber>
            {marketChannels.length +
              viopChannels.length +
              fundChannels.length +
              vipChannels.length +
              otherChannels.length}
          </StatNumber>
        </Stat>

        <Stat
          bg="white"
          p="4"
          borderRadius="lg"
          boxShadow="sm"
          minW="150px"
          flex="1">
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
          flex="1">
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
          flex="1">
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
          flex="1">
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
          flex="1">
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
      {(isUploading || isSending || isDeleting) && (
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
                {isUploading
                  ? '📤 Medya yükleniyor...'
                  : isDeleting
                  ? '�️ Mesajlar siliniyor...'
                  : '�� Mesajlar gönderiliyor...'}
              </AlertTitle>
            </HStack>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={handleCancel}
              isLoading={cancelJobMutation.isPending}
              leftIcon={<Icon as={FiX} />}>
              İptal Et
            </Button>
          </HStack>

          {(isSending || isDeleting) && sendProgress.total > 0 && (
            <Box width="100%">
              <HStack justify="space-between" mb="2">
                <Text fontSize="sm" color="gray.600">
                  Hedef: {sendProgress.total} {isDeleting ? 'mesaj' : 'kanal'}
                </Text>
                <HStack spacing="2">
                  <Badge colorScheme="purple" fontSize="sm">
                    {formatBulkStage(sendProgress.stage)}
                  </Badge>
                  <Badge colorScheme="blue" fontSize="sm">
                    {sendProgress.current > 0
                      ? `${sendProgress.current}/${sendProgress.total}`
                      : isDeleting
                      ? 'Siliniyor...'
                      : 'Gönderiliyor...'}
                  </Badge>
                </HStack>
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
              <HStack mt="3" spacing="4" fontSize="sm" justify="space-between">
                <Text color="gray.500">
                  ⏳ Lütfen bekleyin, iş arka planda işleniyor...
                </Text>
                <Text color="orange.500" fontSize="xs">
                  {activeJobId
                    ? ['queued', 'waiting'].includes(sendProgress.stage)
                      ? '💡 Bekleyen kuyruğa alınmış işi iptal edebilirsiniz.'
                      : '💡 Başlayan bulk işi güvenli şekilde yarıda kesilmiyor.'
                    : '💡 İptal ederseniz, gönderilmiş mesajlar kalacaktır.'}
                </Text>
              </HStack>
            </Box>
          )}
        </Alert>
      )}

      {/* Cancelled Result */}
      {isCancelled && !isSending && !isUploading && !sendResult && (
        <Alert status="warning" variant="subtle" borderRadius="lg" mb="6">
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
          status={
            sendResult.cancelled
              ? 'warning'
              : sendResult.failCount > 0
              ? 'warning'
              : 'success'
          }
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="lg"
          mb="6"
          p="4">
          <AlertIcon />
          <AlertTitle mt={2}>
            {sendResult.cancelled
              ? 'Bulk mesaj işi iptal edildi'
              : sendResult.operation === 'delete'
              ? '🗑️ Silme Tamamlandı'
              : '🎉 Gönderim Tamamlandı'}
          </AlertTitle>
          <AlertDescription mt={2} width="100%">
            <VStack align="start" spacing="2" width="100%">
              <HStack spacing="6">
                <HStack>
                  <Badge
                    colorScheme={sendResult.cancelled ? 'gray' : 'green'}
                    fontSize="md"
                    px="3"
                    py="1">
                    ✅ {sendResult.successCount}
                  </Badge>
                  <Text>
                    {sendResult.operation === 'delete' ? 'Silinen' : 'Başarılı'}
                  </Text>
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
                value={
                  sendResult.successCount + sendResult.failCount > 0
                    ? (sendResult.successCount /
                        (sendResult.successCount + sendResult.failCount)) *
                      100
                    : 0
                }
                size="sm"
                colorScheme={sendResult.failCount > 0 ? 'yellow' : 'green'}
                borderRadius="full"
                width="100%"
              />

              <HStack spacing="4" fontSize="sm" color="gray.500">
                <Text>
                  📊 Toplam: {sendResult.successCount + sendResult.failCount}{' '}
                  {sendResult.operation === 'delete' ? 'mesaj' : 'kanal'}
                </Text>
                <Text>⏱️ Süre: {(sendResult.duration / 1000).toFixed(1)}s</Text>
                <Text>
                  📈 Başarı:{' '}
                  {sendResult.successCount + sendResult.failCount > 0
                    ? Math.round(
                        (sendResult.successCount /
                          (sendResult.successCount + sendResult.failCount)) *
                          100,
                      )
                    : 0}
                  %
                </Text>
              </HStack>
              {sendResult.cancelled && (
                <Text fontSize="sm" color="orange.600">
                  İş worker tarafından alınmadan önce sonlandırıldı.
                </Text>
              )}
            </VStack>
          </AlertDescription>
        </Alert>
      )}

      <Box bg="white" borderRadius="xl" boxShadow="md" p="6" mb="6">
        <HStack justify="space-between" mb="4" align="center">
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              Son Bulk İşleri
            </Text>
            <Text fontSize="sm" color="gray.500">
              Son 12 toplu mesaj job kaydı, durum ve yeniden deneme işlemleri.
            </Text>
          </Box>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={FiRefreshCw} />}
            onClick={() => refetchBulkJobs()}>
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
            {bulkJobFilters.map(filter => (
              <Button
                key={filter.value}
                size="sm"
                borderRadius="full"
                flexShrink={0}
                variant={bulkJobFilter === filter.value ? 'solid' : 'outline'}
                colorScheme={bulkJobFilter === filter.value ? 'blue' : 'gray'}
                onClick={() => setBulkJobFilter(filter.value)}>
                <HStack spacing="2">
                  <Text>{filter.label}</Text>
                  <Badge
                    borderRadius="full"
                    px="2"
                    colorScheme={
                      bulkJobFilter === filter.value
                        ? bulkJobFilterColors[filter.value] || 'blue'
                        : bulkJobFilterColors[filter.value] || 'gray'
                    }>
                    {bulkJobFilterCounts[filter.value] || 0}
                  </Badge>
                </HStack>
              </Button>
            ))}
          </HStack>
        </Box>

        {isLoadingBulkJobs ? (
          <Flex justify="center" py="6">
            <Spinner size="md" />
          </Flex>
        ) : bulkJobs.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Henüz bulk job kaydı yok.</Text>
          </Alert>
        ) : filteredBulkJobs.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Seçilen filtreye uygun bulk job bulunamadı.</Text>
          </Alert>
        ) : (
          <VStack align="stretch" spacing="3">
            {filteredBulkJobs.map(job => {
              const total =
                job.progress?.total || job.result?.totalChannels || 0;
              const current = job.progress?.current || 0;
              const stage = job.progress?.stage || job.state;
              const successCount =
                job.progress?.successCount || job.result?.successCount || 0;
              const failCount =
                job.progress?.failCount || job.result?.failCount || 0;
              const isFailed = job.state === 'failed';
              const isCancelled = job.state === 'cancelled';
              const jobMediaTypeCounts =
                job.mediaTypeCounts &&
                typeof job.mediaTypeCounts === 'object' &&
                !Array.isArray(job.mediaTypeCounts)
                  ? job.mediaTypeCounts
                  : {};
              const jobMediaTypes = Object.keys(jobMediaTypeCounts).length
                ? Object.keys(jobMediaTypeCounts)
                : Array.isArray(job.mediaTypes)
                ? job.mediaTypes
                : [];

              return (
                <Box
                  key={job.jobId}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  p="4">
                  <HStack justify="space-between" align="start" mb="2">
                    <VStack align="start" spacing="1">
                      <HStack>
                        <Badge
                          colorScheme={bulkStateColors[job.state] || 'gray'}>
                          {formatBulkState(job.state)}
                        </Badge>
                        <Badge colorScheme="purple">
                          {formatBulkStage(stage)}
                        </Badge>
                        <Badge colorScheme={getBulkJobTypeColor(job.jobName)}>
                          {getBulkJobTypeLabel(job.jobName)}
                        </Badge>
                        <Badge colorScheme="blue">
                          {job.targetType || 'bulk'}
                        </Badge>
                        {job.mediaCount > 0 && (
                          <Badge colorScheme="cyan">
                            {job.mediaCount} medya
                          </Badge>
                        )}
                        {jobMediaTypes.map(type => (
                          <Badge
                            key={`${job.jobId}-${type}`}
                            colorScheme={
                              mediaTypeMeta[type]?.colorScheme || 'gray'
                            }>
                            {mediaTypeMeta[type]?.icon}{' '}
                            {mediaTypeMeta[type]?.label || type}
                            {jobMediaTypeCounts[type]
                              ? ` x${jobMediaTypeCounts[type]}`
                              : ''}
                          </Badge>
                        ))}
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        Job ID: {job.jobId}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Kuyruğa alındı:{' '}
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
                          İptal Et
                        </Button>
                      )}
                      {isFailed && (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          leftIcon={<Icon as={FiRefreshCw} />}
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
                    <Text>
                      Hedef: {total || job.selectedChannelsCount || 0}
                    </Text>
                    <Text>
                      İlerleme: {current}/{total || '-'}
                    </Text>
                    <Text>Başarılı: {successCount}</Text>
                    <Text>Başarısız: {failCount}</Text>
                    {job.mediaCount > 0 && <Text>Medya: {job.mediaCount}</Text>}
                    {jobMediaTypes.length > 0 && (
                      <Text>
                        Tipler:{' '}
                        {jobMediaTypes
                          .map(
                            type =>
                              `${mediaTypeMeta[type]?.label || type}${
                                jobMediaTypeCounts[type]
                                  ? ` x${jobMediaTypeCounts[type]}`
                                  : ''
                              }`,
                          )
                          .join(', ')}
                      </Text>
                    )}
                    {job.state === 'cancel_requested' && (
                      <Text color="orange.500">İptal isteği bekliyor</Text>
                    )}
                    {isCancelled && (
                      <Text color="gray.500">İşlem iptal edildi</Text>
                    )}
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

      <Box bg="white" borderRadius="xl" boxShadow="md" p="6" mb="6">
        <HStack justify="space-between" mb="4" align="center">
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              Toplu Mesaj Sil
            </Text>
            <Text fontSize="sm" color="gray.500">
              Daha once gonderdiginiz mesajlari metne veya medya linkine gore
              topluca siler.
            </Text>
          </Box>
        </HStack>

        <Alert status="warning" borderRadius="lg" mb="6">
          <AlertIcon />
          <Box>
            <AlertTitle fontSize="sm">Dikkat!</AlertTitle>
            <AlertDescription fontSize="sm">
              Bu islem geri alinamaz. Mesaj metni birebir eslesir; medya linki
              de tam URL olarak aranir. Guvenlik icin onay alanina DELETE
              yazmalisiniz.
            </AlertDescription>
          </Box>
        </Alert>

        <form onSubmit={handleSubmitDelete(onDeleteSubmit)}>
          <Flex direction="column" maxW="100%">
            <FormControl isInvalid={!!deleteErrors.text} mb="6">
              <FormLabel fontWeight="600" fontSize="sm">
                Mesaj Metni (Opsiyonel)
              </FormLabel>
              <Textarea
                placeholder="Silmek istediginiz mesaj metnini birebir yapistirin..."
                size="lg"
                rows={4}
                {...registerDelete('text')}
              />
              <FormHelperText>
                Metin eslesmesi birebir yapilir. Sadece medya linkine gore
                silmek istiyorsaniz bu alani bos birakabilirsiniz.
              </FormHelperText>
              <FormErrorMessage>{deleteErrors.text?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!deleteErrors.mediaUrl} mb="6">
              <FormLabel fontWeight="600" fontSize="sm">
                Medya Linki (Opsiyonel)
              </FormLabel>
              <Input
                placeholder="https://.../dosya.jpg"
                size="lg"
                autoComplete="off"
                {...registerDelete('mediaUrl')}
              />
              <FormHelperText>
                Gorsel, video, ses veya dosya linkine gore tam eslesme ile
                siler. Mesaj metni ile birlikte girerseniz sonuc daralir.
              </FormHelperText>
              <FormErrorMessage>
                {deleteErrors.mediaUrl?.message}
              </FormErrorMessage>
            </FormControl>

            <HStack spacing="4" align="start" flexWrap="wrap" mb="6">
              <FormControl
                isInvalid={!!deleteErrors.since}
                flex="1"
                minW="240px">
                <FormLabel fontWeight="600" fontSize="sm">
                  Başlangıç (Opsiyonel)
                </FormLabel>
                <Input
                  type="datetime-local"
                  size="lg"
                  {...registerDelete('since')}
                />
                <FormErrorMessage>
                  {deleteErrors.since?.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={!!deleteErrors.until}
                flex="1"
                minW="240px">
                <FormLabel fontWeight="600" fontSize="sm">
                  Bitiş (Opsiyonel)
                </FormLabel>
                <Input
                  type="datetime-local"
                  size="lg"
                  {...registerDelete('until')}
                />
                <FormErrorMessage>
                  {deleteErrors.until?.message}
                </FormErrorMessage>
              </FormControl>
            </HStack>

            <FormControl isInvalid={!!deleteErrors.confirm} mb="6">
              <FormLabel fontWeight="600" fontSize="sm">
                Onay
              </FormLabel>
              <Input
                placeholder="DELETE"
                size="lg"
                autoComplete="off"
                {...registerDelete('confirm')}
              />
              <FormErrorMessage>
                {deleteErrors.confirm?.message}
              </FormErrorMessage>
            </FormControl>

            {(isDeletePending || isDeleting) && (
              <Box mb="4">
                <Text mb="2" fontSize="sm" color="gray.500">
                  Silme işlemi başlatılıyor...
                </Text>
                <Progress
                  size="sm"
                  isIndeterminate
                  colorScheme="red"
                  borderRadius="full"
                />
              </Box>
            )}

            <Button
              isLoading={isDeletePending || isDeleting}
              loadingText="Siliniyor..."
              colorScheme="red"
              size="lg"
              type="submit"
              leftIcon={<Icon as={FiX} />}
              isDisabled={isUploading || isSending}>
              Toplu Sil
            </Button>
          </Flex>
        </form>
      </Box>

      <Box
        bg="white"
        overflow="visible"
        borderRadius="xl"
        display="flex"
        flexDirection="column"
        boxShadow="md"
        p="6">
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
                {...register('targetType')}>
                {targetTypes.map(item => (
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
                <Badge
                  colorScheme="blue"
                  fontSize="md"
                  px="3"
                  py="1"
                  borderRadius="full">
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
                  p="4">
                  {isLoadingChannels ? (
                    <Text>Kanallar yükleniyor...</Text>
                  ) : (
                    <CheckboxGroup
                      value={selectedChannels}
                      onChange={values => setValue('selectedChannels', values)}>
                      <VStack align="start" spacing="4">
                        {/* Market Channels */}
                        {marketChannels.length > 0 && (
                          <Box w="100%">
                            <Text fontWeight="bold" mb="2" color="gray.600">
                              📈 Piyasa Kanalları ({marketChannels.length})
                            </Text>
                            <VStack align="start" pl="4" spacing="2">
                              {marketChannels.map(channel => (
                                <Checkbox
                                  key={
                                    channel.id ||
                                    channel.marketCode ||
                                    channel.name
                                  }
                                  value={channel.id}
                                  isDisabled={!channel.id}>
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="green">
                                      Market
                                    </Badge>
                                    {!channel.id && (
                                      <Badge size="sm" colorScheme="gray">
                                        Başlatılmadı
                                      </Badge>
                                    )}
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
                              {vipChannels.map(channel => (
                                <Checkbox key={channel.id} value={channel.id}>
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="purple">
                                      VIP
                                    </Badge>
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
                              {viopChannels.map(channel => (
                                <Checkbox
                                  key={
                                    channel.id ||
                                    channel.marketCode ||
                                    channel.name
                                  }
                                  value={channel.id}
                                  isDisabled={!channel.id}>
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="orange">
                                      VİOP
                                    </Badge>
                                    {!channel.id && (
                                      <Badge size="sm" colorScheme="gray">
                                        Başlatılmadı
                                      </Badge>
                                    )}
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
                              {fundChannels.map(channel => (
                                <Checkbox
                                  key={
                                    channel.id ||
                                    channel.fundCode ||
                                    channel.name
                                  }
                                  value={channel.id}
                                  isDisabled={!channel.id}>
                                  <HStack>
                                    <Text>{channel.name}</Text>
                                    <Badge size="sm" colorScheme="blue">
                                      Fon
                                    </Badge>
                                    {!channel.id && (
                                      <Badge size="sm" colorScheme="gray">
                                        Başlatılmadı
                                      </Badge>
                                    )}
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
                              {otherChannels.map(channel => (
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
                <FormErrorMessage>
                  {errors.selectedChannels?.message}
                </FormErrorMessage>
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
                  placement="top-end">
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
                      _hover={{color: 'blue.500'}}
                    />
                  </PopoverTrigger>
                  <PopoverContent width="350px" border="none" boxShadow="xl">
                    <PopoverBody p="0">
                      <React.Suspense
                        fallback={
                          <Box p="4">
                            <Spinner size="sm" />
                          </Box>
                        }>
                        <EmojiPickerLazy
                          onEmojiClick={emojiData => {
                            const currentValue = watch('message') || '';
                            setValue('message', currentValue + emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                          width="100%"
                          height="350px"
                          searchPlaceholder="Emoji ara..."
                          previewConfig={{showPreview: false}}
                        />
                      </React.Suspense>
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
                  <TabPanel p="0">
                    <Box
                      onClick={() => imageInput.open()}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={
                        imageInput.selectedFiles?.length
                          ? 'green.300'
                          : 'gray.300'
                      }
                      bg={
                        imageInput.selectedFiles?.length
                          ? 'green.50'
                          : 'gray.50'
                      }
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: imageInput.selectedFiles?.length
                          ? 'green.50'
                          : 'blue.50',
                      }}>
                      <VStack spacing="3">
                        <Box p="4" bg="gray.100" borderRadius="full">
                          <Icon as={FiImage} boxSize="8" color="gray.400" />
                        </Box>
                        <VStack spacing="1">
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600">
                            {imageInput.selectedFiles?.length
                              ? `${imageInput.selectedFiles.length} görsel seçildi`
                              : 'Görsel Yükle'}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            PNG, JPG, GIF - Birden fazla dosya seçebilirsiniz
                          </Text>
                        </VStack>
                        <Icon as={FiUpload} boxSize="4" color="gray.400" />
                      </VStack>
                    </Box>
                    {imageInput.input}
                  </TabPanel>

                  <TabPanel p="0">
                    <Box
                      onClick={() =>
                        !videoInput.isProcessing && videoInput.open()
                      }
                      cursor={videoInput.isProcessing ? 'wait' : 'pointer'}
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={
                        videoInput.selectedFiles?.length
                          ? 'green.300'
                          : 'gray.300'
                      }
                      bg={
                        videoInput.selectedFiles?.length
                          ? 'green.50'
                          : 'gray.50'
                      }
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: videoInput.selectedFiles?.length
                          ? 'green.50'
                          : 'blue.50',
                      }}>
                      <VStack spacing="3">
                        <Box p="4" bg="gray.100" borderRadius="full">
                          <Icon as={FiVideo} boxSize="8" color="gray.400" />
                        </Box>
                        <VStack spacing="1">
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600">
                            {videoInput.selectedFiles?.length
                              ? `${videoInput.selectedFiles.length} video seçildi`
                              : 'Video Yükle'}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            MP4, MOV, AVI - Birden fazla dosya seçebilirsiniz
                          </Text>
                        </VStack>
                        <Icon as={FiUpload} boxSize="4" color="gray.400" />
                      </VStack>
                    </Box>
                    {videoInput.input}
                  </TabPanel>

                  <TabPanel p="0">
                    <Box
                      onClick={() => audioInput.open()}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={
                        audioInput.selectedFiles?.length
                          ? 'green.300'
                          : 'gray.300'
                      }
                      bg={
                        audioInput.selectedFiles?.length
                          ? 'green.50'
                          : 'gray.50'
                      }
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: audioInput.selectedFiles?.length
                          ? 'green.50'
                          : 'blue.50',
                      }}>
                      <VStack spacing="3">
                        <Box p="4" bg="gray.100" borderRadius="full">
                          <Icon as={FiMusic} boxSize="8" color="gray.400" />
                        </Box>
                        <VStack spacing="1">
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600">
                            {audioInput.selectedFiles?.length
                              ? `${audioInput.selectedFiles.length} ses dosyası seçildi`
                              : 'Ses Dosyası Yükle'}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            MP3, WAV, OGG - Birden fazla dosya seçebilirsiniz
                          </Text>
                        </VStack>
                        <Icon as={FiUpload} boxSize="4" color="gray.400" />
                      </VStack>
                    </Box>
                    {audioInput.input}
                  </TabPanel>

                  <TabPanel p="0">
                    <Box
                      onClick={() => fileInput.open()}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor={
                        fileInput.selectedFiles?.length
                          ? 'green.300'
                          : 'gray.300'
                      }
                      bg={
                        fileInput.selectedFiles?.length ? 'green.50' : 'gray.50'
                      }
                      p="8"
                      minH="200px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: 'blue.400',
                        bg: fileInput.selectedFiles?.length
                          ? 'green.50'
                          : 'blue.50',
                      }}>
                      <VStack spacing="3">
                        <Box p="4" bg="gray.100" borderRadius="full">
                          <Icon as={FiFile} boxSize="8" color="gray.400" />
                        </Box>
                        <VStack spacing="1">
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="gray.600">
                            {fileInput.selectedFiles?.length
                              ? `${fileInput.selectedFiles.length} dosya seçildi`
                              : 'Dosya Yükle'}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            PDF, DOC, XLS, PPT, TXT, ZIP - Birden fazla dosya
                            seçebilirsiniz
                          </Text>
                        </VStack>
                        <Icon as={FiUpload} boxSize="4" color="gray.400" />
                      </VStack>
                    </Box>
                    {fileInput.input}
                  </TabPanel>
                </TabPanels>
              </Tabs>

              {/* Selected Media Summary */}
              {hasMedia && (
                <VStack mt="4" align="stretch" spacing="3">
                  <Box p="3" bg="blue.50" borderRadius="lg">
                    <Text fontSize="sm" fontWeight="medium" color="blue.700">
                      📎 Ekli Medya: {selectedMediaSummary.length} dosya
                    </Text>
                  </Box>
                  <VStack align="stretch" spacing="2">
                    {selectedMediaSummary.map(item => (
                      <HStack
                        key={item.id}
                        justify="space-between"
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p="3"
                        bg="gray.50">
                        <HStack spacing="3">
                          {item.type === 'image' && item.previewUrl ? (
                            <ChakraImage
                              src={item.previewUrl}
                              alt={item.name}
                              boxSize="40px"
                              borderRadius="md"
                              objectFit="cover"
                            />
                          ) : (
                            <Box
                              boxSize="40px"
                              borderRadius="md"
                              bg="white"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="lg">
                              {mediaTypeMeta[item.type]?.icon}
                            </Box>
                          )}
                          <Box>
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.700"
                              noOfLines={1}>
                              {item.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {mediaTypeMeta[item.type]?.label} •{' '}
                              {imageInput.formatSize(item.size || 0)}
                            </Text>
                          </Box>
                        </HStack>
                        <IconButton
                          icon={<FiX />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          aria-label={`${item.name} kaldir`}
                          onClick={() => {
                            if (item.type === 'image') {
                              imageInput.removeFile(
                                imageInput.selectedFiles.findIndex(
                                  file =>
                                    file.name === item.name &&
                                    file.size === item.size,
                                ),
                              );
                            } else if (item.type === 'video') {
                              videoInput.removeFile(
                                videoInput.selectedFiles.findIndex(
                                  file =>
                                    file.name === item.name &&
                                    file.size === item.size,
                                ),
                              );
                            } else if (item.type === 'audio') {
                              audioInput.removeFile(
                                audioInput.selectedFiles.findIndex(
                                  file =>
                                    file.name === item.name &&
                                    file.size === item.size,
                                ),
                              );
                            } else {
                              fileInput.removeFile(
                                fileInput.selectedFiles.findIndex(
                                  file =>
                                    file.name === item.name &&
                                    file.size === item.size,
                                ),
                              );
                            }
                          }}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              )}
            </FormControl>

            {/* Warning */}
            <Alert status="warning" borderRadius="lg" mb="6">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Dikkat!</AlertTitle>
                <AlertDescription fontSize="sm">
                  Bu işlem geri alınamaz. Mesaj ve medya seçilen tüm kanallara
                  anında gönderilecektir.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Progress during sending */}
            {(isPending || isUploading) && (
              <Box mb="4">
                <Text mb="2" fontSize="sm" color="gray.500">
                  {isUploading
                    ? 'Medya yükleniyor...'
                    : 'Mesajlar gönderiliyor...'}
                </Text>
                <Progress
                  size="sm"
                  isIndeterminate
                  colorScheme="blue"
                  borderRadius="full"
                />
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
              isDisabled={isPending || isUploading || !targetType}>
              {getTargetCount()} Kanala Mesaj Gönder
            </Button>
          </Flex>
        </form>
      </Box>
    </Page>
  );
};

export default BulkMessage;
