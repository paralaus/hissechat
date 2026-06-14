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
  VStack,
  Text,
} from '@chakra-ui/react';
import {useFieldArray, useForm} from 'react-hook-form';
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
    ctas: yup.array().of(
      yup.object({
        label: yup.string(),
        url: yup.string(),
        deepLink: yup.string(),
      }),
    ),
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

const emptyCta = () => ({
  label: '',
  url: '',
  deepLink: '',
});

const mapAnnouncementCtasToForm = announcement => {
  const rawCtas =
    Array.isArray(announcement?.ctas) && announcement.ctas.length > 0
      ? announcement.ctas
      : announcement?.ctaLabel || announcement?.ctaUrl || announcement?.deepLink
      ? [
          {
            label: announcement.ctaLabel || '',
            url: announcement.ctaUrl || '',
            deepLink: announcement.deepLink || '',
          },
        ]
      : [];

  return rawCtas.map(item => ({
    label: item?.label || '',
    url: item?.url || '',
    deepLink: item?.deepLink || '',
  }));
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
    control,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ctas: [emptyCta()],
      type: 'modal',
      priority: 0,
      audienceType: 'all',
      isActive: true,
      dismissible: true,
    },
  });

  const {fields: ctaFields, append: appendCta, remove: removeCta} = useFieldArray({
    control,
    name: 'ctas',
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title || '',
      body: existing.body || '',
      imageUrl: existing.imageUrl || '',
      ctas: mapAnnouncementCtasToForm(existing).length
        ? mapAnnouncementCtasToForm(existing)
        : [emptyCta()],
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
      const ctas = (values.ctas || [])
        .map(item => ({
          label: String(item?.label || '').trim(),
          url: String(item?.url || '').trim(),
          deepLink: String(item?.deepLink || '').trim(),
        }))
        .filter(item => item.label || item.url || item.deepLink)
        .map(item => ({
          label: item.label || 'Detay',
          ...(item.url ? {url: item.url} : {}),
          ...(item.deepLink ? {deepLink: item.deepLink} : {}),
        }));

      const payload = {
        title: values.title,
        body: values.body,
        imageUrl: values.imageUrl || undefined,
        ctas,
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

            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p="4">
              <Flex justify="space-between" align="center" mb="3">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb="0">
                    CTA Butonları
                  </Text>
                  <FormHelperText mt="1">
                    Birden fazla CTA ekleyebilirsin. Deep link varsa URL yerine onu açar.
                  </FormHelperText>
                </Box>
                <Button type="button" size="sm" onClick={() => appendCta(emptyCta())}>
                  CTA Ekle
                </Button>
              </Flex>

              <VStack spacing="3" align="stretch">
                {ctaFields.map((field, index) => (
                  <Box key={field.id} borderWidth="1px" borderColor="gray.100" borderRadius="md" p="3">
                    <Flex justify="space-between" align="center" mb="3">
                      <Text fontSize="sm" fontWeight="medium" mb="0">
                        Buton {index + 1}
                      </Text>
                      {ctaFields.length > 1 && (
                        <Button
                          type="button"
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeCta(index)}>
                          Sil
                        </Button>
                      )}
                    </Flex>

                    <VStack spacing="3">
                      <FormControl isInvalid={!!errors.ctas?.[index]?.label}>
                        <FormLabel>CTA Buton Yazısı</FormLabel>
                        <Input
                          {...register(`ctas.${index}.label`)}
                          placeholder="Devam"
                        />
                        <FormErrorMessage>{errors.ctas?.[index]?.label?.message}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.ctas?.[index]?.url}>
                        <FormLabel>CTA URL</FormLabel>
                        <Input
                          {...register(`ctas.${index}.url`)}
                          placeholder="https://..."
                        />
                        <FormErrorMessage>{errors.ctas?.[index]?.url?.message}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.ctas?.[index]?.deepLink}>
                        <FormLabel>Deep Link (opsiyonel)</FormLabel>
                        <Input
                          {...register(`ctas.${index}.deepLink`)}
                          placeholder="myapp://..."
                        />
                        <FormHelperText>
                          Belirtilirse CTA tıklamasında URL yerine deep link açılır.
                        </FormHelperText>
                        <FormErrorMessage>{errors.ctas?.[index]?.deepLink?.message}</FormErrorMessage>
                      </FormControl>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>

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
