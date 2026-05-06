import React, {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  HStack,
  useToast,
  FormHelperText,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {api} from '../../../api';
import {getErrorMessage} from '../../../utils/string';
import {Page} from '../../../components';
import {routes} from '../../../config/routes';

const schema = yup
  .object({
    title: yup.string().required('Bu alan zorunludur.'),
    body: yup.string().required('Bu alan zorunludur.'),
    imageUrl: yup
      .string()
      .url('Geçerli bir URL girin (https://...)')
      .nullable()
      .transform(v => (v === '' ? null : v)),
    ctaLabel: yup.string(),
    ctaUrl: yup.string(),
    deepLink: yup.string(),
    type: yup.string().oneOf(['modal', 'banner', 'card']).default('modal'),
    priority: yup.number().integer().default(0),
    audienceType: yup
      .string()
      .oneOf(['all', 'free', 'vip', 'specific'])
      .default('all'),
    audienceUserIds: yup.string(),
    startsAt: yup.string(),
    endsAt: yup.string(),
    isActive: yup.boolean().default(true),
    dismissible: yup.boolean().default(true),
  })
  .required();

const toLocalInput = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {id} = useParams();
  const isEdit = id && id !== 'new';

  const {data: existing} = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => api.getAnnouncement(id).then(r => r.data),
    enabled: Boolean(isEdit),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      type: 'modal',
      priority: 0,
      audienceType: 'all',
      isActive: true,
      dismissible: true,
    },
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title || '',
      body: existing.body || '',
      imageUrl: existing.imageUrl || '',
      ctaLabel: existing.ctaLabel || '',
      ctaUrl: existing.ctaUrl || '',
      deepLink: existing.deepLink || '',
      type: existing.type || 'modal',
      priority: existing.priority ?? 0,
      audienceType: existing.audience?.type || 'all',
      audienceUserIds: (existing.audience?.userIds || []).join(','),
      startsAt: toLocalInput(existing.startsAt),
      endsAt: toLocalInput(existing.endsAt),
      isActive: existing.isActive !== false,
      dismissible: existing.dismissible !== false,
    });
  }, [existing, reset]);

  const audienceType = watch('audienceType');

  const {mutateAsync, isPending} = useMutation({
    mutationFn: payload => {
      if (isEdit) return api.updateAnnouncement(id, payload);
      return api.createAnnouncement(payload);
    },
  });

  const onSubmit = async values => {
    try {
      const payload = {
        title: values.title,
        body: values.body,
        imageUrl: values.imageUrl || undefined,
        ctaLabel: values.ctaLabel || undefined,
        ctaUrl: values.ctaUrl || undefined,
        deepLink: values.deepLink || undefined,
        type: values.type,
        priority: Number(values.priority) || 0,
        audience: {
          type: values.audienceType,
          userIds:
            values.audienceType === 'specific' && values.audienceUserIds
              ? values.audienceUserIds
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
              : [],
        },
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
        isActive: values.isActive,
        dismissible: values.dismissible,
      };
      await mutateAsync(payload);
      toast({
        title: isEdit ? 'Duyuru güncellendi.' : 'Duyuru oluşturuldu.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.announcements.path);
    } catch (e) {
      toast({title: getErrorMessage(e), status: 'error', position: 'top'});
    }
  };

  return (
    <Page title={isEdit ? 'Duyuru Düzenle' : 'Yeni Duyuru'}>
      <Box bg="white" borderRadius="md" boxShadow="md" p="4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            <FormControl isInvalid={!!errors.title}>
              <FormLabel>Başlık</FormLabel>
              <Input {...register('title')} />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.body}>
              <FormLabel>İçerik</FormLabel>
              <Textarea rows={4} {...register('body')} />
              <FormErrorMessage>{errors.body?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.imageUrl}>
              <FormLabel>Görsel URL (opsiyonel)</FormLabel>
              <Input {...register('imageUrl')} placeholder="https://..." />
              <FormErrorMessage>{errors.imageUrl?.message}</FormErrorMessage>
            </FormControl>

            <HStack>
              <FormControl>
                <FormLabel>CTA Buton Yazısı</FormLabel>
                <Input {...register('ctaLabel')} placeholder="Devam" />
              </FormControl>
              <FormControl>
                <FormLabel>CTA URL</FormLabel>
                <Input {...register('ctaUrl')} placeholder="https://..." />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Deep Link (opsiyonel)</FormLabel>
              <Input {...register('deepLink')} placeholder="myapp://..." />
              <FormHelperText>
                Belirtilirse CTA tıklamasında açılır (CTA URL üzerine yazar).
              </FormHelperText>
            </FormControl>

            <HStack>
              <FormControl>
                <FormLabel>Tip</FormLabel>
                <Select {...register('type')}>
                  <option value="modal">Modal</option>
                  <option value="banner">Banner</option>
                  <option value="card">Kart</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Öncelik</FormLabel>
                <Input type="number" {...register('priority')} />
                <FormHelperText>Yüksek olan önce gösterilir.</FormHelperText>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Hedef Kitle</FormLabel>
              <Select {...register('audienceType')}>
                <option value="all">Tüm kullanıcılar</option>
                <option value="free">Ücretsiz kullanıcılar</option>
                <option value="vip">VIP kullanıcılar</option>
                <option value="specific">Belirli kullanıcılar</option>
              </Select>
            </FormControl>

            {audienceType === 'specific' && (
              <FormControl>
                <FormLabel>Kullanıcı ID'leri</FormLabel>
                <Textarea
                  rows={2}
                  {...register('audienceUserIds')}
                  placeholder="virgülle ayrılmış: 64a..., 64b..."
                />
              </FormControl>
            )}

            <HStack>
              <FormControl>
                <FormLabel>Başlangıç</FormLabel>
                <Input type="datetime-local" {...register('startsAt')} />
                <FormHelperText>Boş bırakılırsa hemen başlar.</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel>Bitiş</FormLabel>
                <Input type="datetime-local" {...register('endsAt')} />
                <FormHelperText>Boş bırakılırsa süresizdir.</FormHelperText>
              </FormControl>
            </HStack>

            <HStack>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Aktif</FormLabel>
                <Switch {...register('isActive')} defaultChecked />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Kapatılabilir</FormLabel>
                <Switch {...register('dismissible')} defaultChecked />
              </FormControl>
            </HStack>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isPending}
              alignSelf="flex-start">
              {isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </Flex>
        </form>
      </Box>
    </Page>
  );
};

export default CreateAnnouncement;
