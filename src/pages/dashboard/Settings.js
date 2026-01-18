import React, {useState, useEffect} from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  Image as ChakraImage,
  VStack,
  Icon,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  HStack,
  Divider,
} from '@chakra-ui/react';
import {FiImage, FiUpload, FiUser, FiBell, FiLock} from 'react-icons/fi';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../utils/string';
import {formatDate} from '../../utils/date';
import {Page as Layout} from '../../components';
import {api} from '../../api';
import {pick} from '../../utils/object';
import useFileInput from '../../hooks/useFileInput';
import {ReadOnlyInfo} from '../../components';
import {useUserStore} from '../../store';
import useBrowserNotification from '../../hooks/useBrowserNotification';
import {playNotificationSound} from '../../utils/sound';
import {PolicyType} from '../../config';

// --- Profile Settings Component ---
const profileSchema = yup
  .object({
    thumbnail: yup.string(),
    fullname: yup.string().required('Bu alan zorunludur.'),
    email: yup
      .string()
      .email('Geçersiz email adresi')
      .required('Bu alan zorunludur.'),
  })
  .required();

const ProfileSettings = ({user}) => {
  const toast = useToast();
  const {updateUser} = useUserStore();
  const id = user?.id;
  const {
    input,
    open,
    objectUrl,
    reset: resetFile,
    upload,
    isUploading,
  } = useFileInput();
  const {
    register,
    handleSubmit,
    getValues,
    formState: {errors},
    reset,
  } = useForm({
    resolver: yupResolver(profileSchema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.updateUser(id, values),
  });

  const {data} = useQuery({
    queryKey: ['users', id],
    queryFn: () =>
      api
        .getUser(id)
        .then(res => res.data)
        .then(values => {
          reset(pick(values, ['thumbnail', 'fullname', 'email']));
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      if (objectUrl) {
        const url = await upload();
        if (url) values.thumbnail = url;
      }

      const {data} = await mutateAsync(values);
      if (data) {
        updateUser(data);
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
      }
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" maxW="100%" borderRadius="md" me="auto">
        <Box display={'flex'} flexDirection="column" alignItems="center" mb="6">
          <Box
            onClick={() => open()}
            cursor="pointer"
            borderRadius="xl"
            border="2px dashed"
            borderColor={
              objectUrl || getValues('thumbnail')?.length > 0
                ? 'transparent'
                : 'gray.300'
            }
            bg={
              objectUrl || getValues('thumbnail')?.length > 0
                ? 'transparent'
                : 'gray.50'
            }
            p={objectUrl || getValues('thumbnail')?.length > 0 ? '0' : '8'}
            minH="150px"
            minW="150px"
            maxW="200px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all 0.2s"
            _hover={{
              borderColor: 'brand.400',
              bg:
                objectUrl || getValues('thumbnail')?.length > 0
                  ? 'transparent'
                  : 'brand.50',
            }}
            position="relative"
            overflow="hidden">
            {objectUrl || getValues('thumbnail')?.length > 0 ? (
              <ChakraImage
                src={objectUrl || getValues('thumbnail')}
                alt="Profil Fotoğrafı"
                maxH="150px"
                objectFit="contain"
                borderRadius="lg"
              />
            ) : (
              <VStack spacing="3">
                <Box p="4" bg="gray.100" borderRadius="full">
                  <Icon as={FiImage} boxSize="8" color="gray.400" />
                </Box>
                <VStack spacing="1">
                  <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Fotoğraf Yükle
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    Tıklayarak görsel seçin
                  </Text>
                </VStack>
                <Icon as={FiUpload} boxSize="4" color="gray.400" />
              </VStack>
            )}
          </Box>
          {input}
          <Input type={'hidden'} {...register('thumbnail')} />
          {(objectUrl || getValues('thumbnail')?.length > 0) && (
            <Button
              mt="3"
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={e => {
                e.stopPropagation();
                reset({thumbnail: ''});
                resetFile();
              }}>
              Kaldır
            </Button>
          )}
        </Box>
        <FormControl isInvalid={!!errors.fullname} mb="4">
          <FormLabel fontSize="sm" fontWeight="500" mb="8px">
            Ad Soyad
          </FormLabel>
          <Input
            fontSize="sm"
            type="text"
            fontWeight="500"
            size="md"
            defaultValue={data?.fullname}
            {...register('fullname')}
          />
          <FormErrorMessage>{errors.fullname?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.email} mb="4">
          <FormLabel fontSize="sm" fontWeight="500" mb="8px">
            E-Posta
          </FormLabel>
          <Input
            fontSize="sm"
            fontWeight="500"
            size="md"
            type={'email'}
            defaultValue={data?.email}
            {...register('email')}
          />
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
        </FormControl>
        <ReadOnlyInfo
          label={'Kayıt Tarihi'}
          value={formatDate(data?.createdAt)}
        />
        <ReadOnlyInfo
          label={'Son Güncellenme Tarihi'}
          value={formatDate(data?.updatedAt)}
        />
        <Button
          isLoading={isPending || isUploading}
          colorScheme={'primary'}
          isDisabled={isPending || isUploading}
          type="submit"
          fontSize={'sm'}
          mt={4}>
          Kaydet
        </Button>
      </Flex>
    </form>
  );
};

// --- Notification Settings Component ---
const NotificationSettings = () => {
  const {permission, enabled, toggleEnabled, showNotification} =
    useBrowserNotification();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const savedSound = localStorage.getItem('notification_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
  }, []);

  const handleBrowserNotificationChange = async () => {
    const result = await toggleEnabled();
    if (result) {
      // enabled state might not be updated yet in this scope, so we invert the current enabled value for the message
      const newState = !enabled;
      if (newState) {
        toast({
          title: 'Bildirimler aktif',
          status: 'success',
          position: 'top',
        });
      } else {
        toast({
          title: 'Bildirimler kapatıldı',
          status: 'info',
          position: 'top',
        });
      }
    } else {
      toast({
        title: 'İzin verilmedi',
        description: 'Tarayıcı ayarlarından bildirimlere izin vermelisiniz.',
        status: 'warning',
        position: 'top',
      });
    }
  };

  const handleSoundChange = e => {
    const isChecked = e.target.checked;
    setSoundEnabled(isChecked);
    localStorage.setItem('notification_sound_enabled', isChecked);
  };

  const handleTestNotification = async () => {
    // Ses testi
    if (soundEnabled) {
      playNotificationSound();
    }

    if (!enabled && permission === 'granted') {
      toast({
        title: 'Bildirimler kapalı',
        description: 'Test etmek için önce bildirimleri açmalısınız.',
        status: 'warning',
        position: 'top',
      });
      return;
    }

    // Görsel test
    if (permission === 'granted') {
      showNotification('Test Bildirimi', {
        body: 'Bu bir test bildirimidir. Bildirimler ve ses çalışıyor.',
        tag: 'test-notification',
      });

      toast({
        title: 'Test bildirimi gönderildi',
        status: 'info',
        duration: 2000,
        position: 'top',
      });
    } else {
      // showNotification will try to request permission if not denied, but here we can show a toast if denied
      if (permission === 'denied') {
        toast({
          title: 'Bildirim izni yok',
          description: 'Tarayıcı ayarlarından bildirimlere izin vermelisiniz.',
          status: 'warning',
          position: 'top',
        });
      } else {
        // try to show notification which will request permission
        showNotification('Test Bildirimi', {
          body: 'Bu bir test bildirimidir. Bildirimler ve ses çalışıyor.',
          tag: 'test-notification',
        });
      }
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Bildirim Tercihleri
        </Text>
        <VStack spacing={4} divider={<Divider />} align="stretch">
          <HStack spacing={4} justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Tarayıcı Bildirimleri</Text>
              <Text fontSize="sm" color="gray.500">
                Yeni mesaj geldiğinde masaüstü bildirimi göster
              </Text>
            </VStack>
            <Switch
              isChecked={enabled && permission === 'granted'}
              onChange={handleBrowserNotificationChange}
              isDisabled={permission === 'denied' && !enabled}
            />
          </HStack>

          <HStack spacing={4} justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium">Bildirim Sesi</Text>
              <Text fontSize="sm" color="gray.500">
                Bildirim geldiğinde ses çal
              </Text>
            </VStack>
            <Switch isChecked={soundEnabled} onChange={handleSoundChange} />
          </HStack>

          <Box pt={2}>
            <Button size="sm" onClick={handleTestNotification}>
              Test Bildirimi Gönder
            </Button>
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
};

// --- Security Settings Component ---
const passwordSchema = yup
  .object({
    currentPassword: yup.string().required('Mevcut şifre zorunludur.'),
    password: yup
      .string()
      .min(6, 'Şifre en az 6 karakter olmalıdır.')
      .required('Yeni şifre zorunludur.'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], 'Şifreler eşleşmiyor.')
      .required('Şifre tekrarı zorunludur.'),
  })
  .required();

const SecuritySettings = ({user}) => {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values => api.changePassword(user.id, values),
  });

  const onSubmit = async values => {
    try {
      await mutateAsync({
        currentPassword: values.currentPassword,
        password: values.password,
      });
      toast({
        title: 'Şifre başarıyla güncellendi.',
        status: 'success',
        position: 'top',
      });
      reset();
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          Şifre Değiştir
        </Text>
        <FormControl isInvalid={!!errors.currentPassword}>
          <FormLabel fontSize="sm">Mevcut Şifre</FormLabel>
          <Input type="password" {...register('currentPassword')} />
          <FormErrorMessage>{errors.currentPassword?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.password}>
          <FormLabel fontSize="sm">Yeni Şifre</FormLabel>
          <Input type="password" {...register('password')} />
          <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormLabel fontSize="sm">Yeni Şifre (Tekrar)</FormLabel>
          <Input type="password" {...register('confirmPassword')} />
          <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
        </FormControl>

        <Button
          type="submit"
          colorScheme="primary"
          isLoading={isPending}
          mt={2}>
          Şifreyi Güncelle
        </Button>
      </VStack>
    </form>
  );
};

const appVersionSchema = yup
  .object({
    androidMinVersion: yup.string().required('Bu alan zorunludur.'),
    androidCriticalVersion: yup.string().required('Bu alan zorunludur.'),
    iosMinVersion: yup.string().required('Bu alan zorunludur.'),
    iosCriticalVersion: yup.string().required('Bu alan zorunludur.'),
  })
  .required();

const AppVersionSettings = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const {
    register,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm({
    resolver: yupResolver(appVersionSchema),
    defaultValues: {
      androidMinVersion: '',
      androidCriticalVersion: '',
      iosMinVersion: '',
      iosCriticalVersion: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await api.getPolicy(PolicyType.AppSettings);
        const data = response?.data;
        if (data?.content) {
          try {
            const parsed = JSON.parse(data.content);
            const android = parsed?.android || {};
            const ios = parsed?.ios || {};
            if (isMounted) {
              reset({
                androidMinVersion: android.minVersion || '',
                androidCriticalVersion: android.criticalVersion || '',
                iosMinVersion: ios.minVersion || '',
                iosCriticalVersion: ios.criticalVersion || '',
              });
            }
          } catch {}
        }
      } catch {
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [reset]);

  const onSubmit = async values => {
    try {
      const payload = {
        type: PolicyType.AppSettings,
        title: 'Uygulama Ayarları',
        content: JSON.stringify({
          android: {
            minVersion: values.androidMinVersion,
            criticalVersion: values.androidCriticalVersion,
          },
          ios: {
            minVersion: values.iosMinVersion,
            criticalVersion: values.iosCriticalVersion,
          },
        }),
      };
      await api.createPolicy(payload);
      toast({
        title: 'Uygulama ayarları kaydedildi.',
        status: 'success',
        position: 'top',
      });
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          Uygulama Sürüm Ayarları
        </Text>
        <VStack spacing={4} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            Android
          </Text>
          <FormControl isInvalid={!!errors.androidMinVersion}>
            <FormLabel fontSize="sm">Minimum Sürüm</FormLabel>
            <Input
              placeholder="Örn: 1.3.40"
              {...register('androidMinVersion')}
            />
            <FormErrorMessage>
              {errors.androidMinVersion?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.androidCriticalVersion}>
            <FormLabel fontSize="sm">Kritik Sürüm</FormLabel>
            <Input
              placeholder="Örn: 1.3.46"
              {...register('androidCriticalVersion')}
            />
            <FormErrorMessage>
              {errors.androidCriticalVersion?.message}
            </FormErrorMessage>
          </FormControl>
        </VStack>

        <Divider />

        <VStack spacing={4} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            iOS
          </Text>
          <FormControl isInvalid={!!errors.iosMinVersion}>
            <FormLabel fontSize="sm">Minimum Sürüm</FormLabel>
            <Input placeholder="Örn: 1.3.40" {...register('iosMinVersion')} />
            <FormErrorMessage>{errors.iosMinVersion?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.iosCriticalVersion}>
            <FormLabel fontSize="sm">Kritik Sürüm</FormLabel>
            <Input
              placeholder="Örn: 1.3.46"
              {...register('iosCriticalVersion')}
            />
            <FormErrorMessage>
              {errors.iosCriticalVersion?.message}
            </FormErrorMessage>
          </FormControl>
        </VStack>

        <Button type="submit" colorScheme="primary" isLoading={isLoading}>
          Kaydet
        </Button>
      </VStack>
    </form>
  );
};

// --- Main Settings Page ---
const Settings = () => {
  const {user} = useUserStore();

  return (
    <Layout>
      <Box
        bg={'white'}
        borderRadius={'md'}
        boxShadow={'md'}
        p={'4'}
        minH="80vh">
        <Tabs
          orientation="vertical"
          variant="soft-rounded"
          colorScheme="blue"
          isLazy>
          <TabList minW="200px" mr={8}>
            <Tab justifyContent="flex-start" mb={2}>
              <Icon as={FiUser} mr={2} /> Profil
            </Tab>
            <Tab justifyContent="flex-start" mb={2}>
              <Icon as={FiBell} mr={2} /> Bildirimler
            </Tab>
            <Tab justifyContent="flex-start" mb={2}>
              <Icon as={FiLock} mr={2} /> Güvenlik
            </Tab>
            <Tab justifyContent="flex-start" mb={2}>
              <Icon as={FiLock} mr={2} /> Uygulama Ayarları
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0} py={0}>
              <Box maxW="600px">
                <ProfileSettings user={user} />
              </Box>
            </TabPanel>
            <TabPanel px={0} py={0}>
              <Box maxW="600px">
                <NotificationSettings />
              </Box>
            </TabPanel>
            <TabPanel px={0} py={0}>
              <Box maxW="600px">
                <SecuritySettings user={user} />
              </Box>
            </TabPanel>
            <TabPanel px={0} py={0}>
              <Box maxW="600px">
                <AppVersionSettings />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Layout>
  );
};

export default Settings;
