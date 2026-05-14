import React, {useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  Select,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../../utils/string';
import {applyGoogleTranslateFix} from '../../../utils/GoogleTranslateFix';
import {formatDate} from '../../../utils/date';
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {
  Condition,
  ReadOnlyInfo,
  Page as Layout,
  RichTextEditor,
} from '../../../components';
import {api} from '../../../api';
import {pick} from '../../../utils/object';
import {
  SuggestionTypeLabel,
  suggestionTypes,
  SuggestionType,
} from '../../../config';
import useFileInput from '../../../hooks/useFileInput';

applyGoogleTranslateFix();

const object = {
  title: yup.string(),
  content: yup.string(),
  type: yup.string(),
  sortOrder: yup.number(),
  imageUrl: yup.string(),
  videoUrl: yup.string(),
  audioUrl: yup.string(),
  mediaUrls: yup.array().of(yup.string()),
};

const schema = yup.object().shape({
  title: yup.string().when('type', {
    is: SuggestionType.Headline,
    then: schema => schema.nullable().notRequired(),
    otherwise: schema => schema.required('Bu alan zorunludur.'),
  }),
  content: yup.string().when('type', {
    is: SuggestionType.Headline,
    then: schema => schema.nullable().notRequired(),
    otherwise: schema => schema.required('Bu alan zorunludur.'),
  }),
  type: yup.string().required('Bu alan zorunludur.'),
  sortOrder: yup
    .number()
    .typeError('Sıra sayısal olmalıdır.')
    .min(0, 'Sıra 0 veya daha büyük olmalıdır.')
    .required('Sıra zorunludur.'),
  imageUrl: yup.string().nullable(),
  videoUrl: yup.string().nullable(),
  audioUrl: yup.string().nullable(),
  mediaUrls: yup.array().of(yup.string().nullable()).default([]),
});

const EditSuggestion = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  const [draggedMediaIndex, setDraggedMediaIndex] = React.useState(null);
  const [dragOverMediaIndex, setDragOverMediaIndex] = React.useState(null);
  const {
    input: imageInput,
    open: openImage,
    file: imageFile,
    objectUrl: imageObjectUrl,
    upload: uploadImage,
    isUploading: isUploadingImage,
  } = useFileInput({accept: 'image/*'});
  const {
    input: mediaInput,
    open: openMedia,
    file: mediaFile,
    objectUrl: mediaObjectUrl,
    isVideo: isVideoMedia,
    thumbnail: mediaThumbnail,
    upload: uploadMedia,
    isUploading: isUploadingMedia,
  } = useFileInput({accept: 'video/*,audio/*'});
  const {
    input: galleryInput,
    open: openGalleryMedia,
    file: galleryMediaFile,
    objectUrl: galleryMediaObjectUrl,
    isVideo: isGalleryVideo,
    upload: uploadGalleryMedia,
    isUploading: isUploadingGalleryMedia,
    reset: resetGalleryMedia,
  } = useFileInput({accept: 'image/*,video/*,audio/*'});
  const {
    register,
    handleSubmit,
    formState: {errors},
    setValue,
    reset,
    watch,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew ? api.createSuggestion(values) : api.updateSuggestion(id, values),
  });

  const {mutateAsync: deleteItem, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteSuggestion(id),
  });

  const {data} = useQuery({
    enabled: !isNew,
    queryKey: ['suggestion', id],
    queryFn: () =>
      api
        .getSuggestion(id)
        .then(res => res.data)
        .then(values => {
          const data = pick(values, Object.keys(object));
          reset(data);
          return values;
        }),
  });

  const imageUrlValue = watch('imageUrl');
  const videoUrlValue = watch('videoUrl');
  const audioUrlValue = watch('audioUrl');
  const watchedMediaUrls = watch('mediaUrls');
  const mediaUrlsValue = React.useMemo(
    () => watchedMediaUrls || [],
    [watchedMediaUrls],
  );
  const typeValue = watch('type');
  const sortOrderValue = watch('sortOrder');
  const isHeadline = typeValue === SuggestionType.Headline;
  const hasMedia =
    !!imageFile ||
    !!mediaFile ||
    !!(imageUrlValue && imageUrlValue.trim()) ||
    !!(videoUrlValue && videoUrlValue.trim()) ||
    !!(audioUrlValue && audioUrlValue.trim()) ||
    (Array.isArray(mediaUrlsValue) &&
      mediaUrlsValue.some(url => typeof url === 'string' && url.trim()));

  React.useEffect(() => {
    if (isHeadline) {
      clearErrors(['title', 'content']);
    }
  }, [isHeadline, clearErrors]);

  const sanitizeMediaUrls = React.useCallback(urls => {
    if (!Array.isArray(urls)) return [];
    const seen = new Set();
    return urls
      .filter(url => typeof url === 'string' && url.trim())
      .map(url => url.trim())
      .filter(url => {
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
      });
  }, []);

  const handleAddGalleryMedia = async () => {
    if (!galleryMediaFile) {
      toast({
        title: 'Önce bir medya dosyası seçin.',
        status: 'warning',
        position: 'top',
      });
      return;
    }
    const url = await uploadGalleryMedia();
    if (!url) {
      toast({
        title: 'Medya galeriye eklenemedi.',
        status: 'error',
        position: 'top',
      });
      return;
    }
    const next = sanitizeMediaUrls([...(mediaUrlsValue || []), url]);
    setValue('mediaUrls', next, {shouldDirty: true});
    resetGalleryMedia();
    toast({
      title: 'Medya galeriye eklendi.',
      status: 'success',
      position: 'top',
    });
  };

  const moveMediaItem = React.useCallback(
    (fromIndex, toIndex) => {
      if (
        !Array.isArray(mediaUrlsValue) ||
        fromIndex === null ||
        toIndex === null ||
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= mediaUrlsValue.length ||
        toIndex >= mediaUrlsValue.length
      ) {
        return;
      }
      const next = [...mediaUrlsValue];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      setValue('mediaUrls', next, {shouldDirty: true});
    },
    [mediaUrlsValue, setValue],
  );

  const onSubmit = async values => {
    try {
      const cleanedMediaUrls = sanitizeMediaUrls(values.mediaUrls);
      if (values.type === SuggestionType.Headline) {
        const submitHasMedia =
          !!imageFile ||
          !!mediaFile ||
          !!(values.imageUrl && values.imageUrl.trim()) ||
          !!(values.videoUrl && values.videoUrl.trim()) ||
          !!(values.audioUrl && values.audioUrl.trim()) ||
          cleanedMediaUrls.length > 0;
        if (!submitHasMedia) {
          toast({
            title: 'Manşet için en az bir medya zorunludur.',
            status: 'error',
            position: 'top',
          });
          return;
        }
      }
      const submissionValues = {...values, mediaUrls: cleanedMediaUrls};
      submissionValues.sortOrder = Number.isFinite(Number(values.sortOrder))
        ? Number(values.sortOrder)
        : 1000;
      if (imageFile) {
        const url = await uploadImage();
        if (!url) {
          toast({
            title: 'Görsel yüklenemedi.',
            status: 'error',
            position: 'top',
          });
          return;
        }
        submissionValues.imageUrl = url;
      }
      if (mediaFile) {
        const url = await uploadMedia();
        if (!url) {
          toast({
            title: 'Medya yüklenemedi.',
            status: 'error',
            position: 'top',
          });
          return;
        }
        const mimeType = mediaFile.type || '';
        const fileName = mediaFile.name ? mediaFile.name.toLowerCase() : '';
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
        const isVideo =
          mimeType.startsWith('video/') ||
          videoExtensions.some(ext => fileName.endsWith(ext));
        const isAudio =
          mimeType.startsWith('audio/') ||
          audioExtensions.some(ext => fileName.endsWith(ext));
        if (isVideo) {
          submissionValues.videoUrl = url;
        } else if (isAudio) {
          submissionValues.audioUrl = url;
        } else {
          submissionValues.imageUrl = url;
        }
      }
      submissionValues.mediaUrls = sanitizeMediaUrls([
        ...(submissionValues.mediaUrls || []),
        submissionValues.imageUrl,
        submissionValues.videoUrl,
        submissionValues.audioUrl,
      ]);
      const {data} = await mutateAsync(submissionValues);
      if (data) {
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
      }
      navigate(routes.suggestions.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const onDelete = async () => {
    try {
      await deleteItem();
      toast({
        title: 'Başarıyla silindi.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.suggestions.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  return (
    <Layout>
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
            <FormControl
              isInvalid={!isHeadline && !!errors.title}
              mb="4"
              key={0}>
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
                defaultValue={data?.title}
                {...register('title')}
              />
              <FormErrorMessage>
                {!isHeadline ? errors.title?.message : ''}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              isInvalid={!isHeadline && !!errors.content}
              mb="4"
              key={1}>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                İçerik
              </FormLabel>
              {/*<Input*/}
              {/*  fontSize="sm"*/}
              {/*  type="text"*/}
              {/*  fontWeight="500"*/}
              {/*  size="md"*/}
              {/*  defaultValue={data?.content}*/}
              {/*  {...register('content')}*/}
              {/*/>*/}
              <RichTextEditor
                defaultValue={data?.content}
                onChange={html => setValue('content', html)}
              />
              <FormErrorMessage>
                {!isHeadline ? errors.content?.message : ''}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.type} mb="4" key={2}>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Tür
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Tür seçin"
                fontWeight="500"
                size="md"
                {...register('type')}>
                {suggestionTypes.map(type => {
                  return (
                    <option value={type}>{SuggestionTypeLabel[type]}</option>
                  );
                })}
              </Select>
              <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.sortOrder} mb="4" key={21}>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Slider Sırası
              </FormLabel>
              <Input
                fontSize="sm"
                type="number"
                min={0}
                fontWeight="500"
                size="md"
                defaultValue={data?.sortOrder ?? 1000}
                {...register('sortOrder')}
              />
              <Text fontSize="xs" color="gray.500" mt="1">
                Küçük sayı önce görünür. Mevcut: {Number.isFinite(Number(sortOrderValue)) ? Number(sortOrderValue) : 1000}
              </Text>
              <FormErrorMessage>{errors.sortOrder?.message}</FormErrorMessage>
            </FormControl>
            <FormControl mb="4" key={3}>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Manşet Görseli (opsiyonel)
              </FormLabel>
              <Button
                onClick={openImage}
                isLoading={isUploadingImage}
                loadingText="Yükleniyor"
                variant="outline"
                mb="2">
                Görsel Seç
              </Button>
              {imageInput}
              <Input type="hidden" {...register('imageUrl')} />
              {(imageUrlValue || imageFile) && (
                <Box mt="2">
                  <Box
                    as="img"
                    src={imageFile ? imageObjectUrl : imageUrlValue}
                    maxH="150px"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    objectFit="cover"
                  />
                </Box>
              )}
            </FormControl>
            <FormControl mb="4" key={4} isInvalid={isHeadline && !hasMedia}>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Video / Ses (opsiyonel)
              </FormLabel>
              <Button
                onClick={openMedia}
                isLoading={isUploadingMedia}
                loadingText="Yükleniyor"
                variant="outline"
                mb="2">
                Video veya Ses Seç
              </Button>
              {mediaInput}
              <Input type="hidden" {...register('videoUrl')} />
              <Input type="hidden" {...register('audioUrl')} />
              {(videoUrlValue || audioUrlValue || mediaFile) && (
                <Box mt="2">
                  {mediaFile ? (
                    isVideoMedia ? (
                      <Box>
                        {mediaThumbnail ? (
                          <Box
                            as="img"
                            src={mediaThumbnail}
                            maxH="150px"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                            objectFit="cover"
                          />
                        ) : (
                          <Box
                            as="video"
                            src={mediaObjectUrl}
                            maxH="200px"
                            controls
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                          />
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Box
                          as="audio"
                          src={mediaObjectUrl}
                          controls
                          width="100%"
                        />
                      </Box>
                    )
                  ) : videoUrlValue ? (
                    <Box>
                      <Box
                        as="video"
                        src={videoUrlValue}
                        maxH="200px"
                        controls
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                      />
                    </Box>
                  ) : (
                    <Box>
                      <Box
                        as="audio"
                        src={audioUrlValue}
                        controls
                        width="100%"
                      />
                    </Box>
                  )}
                </Box>
              )}
              <FormErrorMessage>
                {isHeadline && !hasMedia
                  ? 'Manşet için en az bir medya zorunludur.'
                  : ''}
              </FormErrorMessage>
            </FormControl>
            <FormControl mb="4" key={5}>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Manşet Medya Galerisi (çoklu)
              </FormLabel>
              <Button
                onClick={openGalleryMedia}
                variant="outline"
                mb="2"
                isLoading={isUploadingGalleryMedia}
                loadingText="Yükleniyor">
                Galeri Medyası Seç
              </Button>
              {galleryInput}
              {galleryMediaObjectUrl && (
                <Box mt="2" mb="2">
                  {isGalleryVideo ? (
                    <Box
                      as="video"
                      src={galleryMediaObjectUrl}
                      maxH="180px"
                      controls
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="gray.200"
                    />
                  ) : (
                    <Box
                      as="img"
                      src={galleryMediaObjectUrl}
                      maxH="150px"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="gray.200"
                      objectFit="cover"
                    />
                  )}
                  <Button
                    mt="2"
                    size="sm"
                    colorScheme="blue"
                    onClick={handleAddGalleryMedia}
                    isLoading={isUploadingGalleryMedia}
                    loadingText="Ekleniyor">
                    Galeriye Ekle
                  </Button>
                </Box>
              )}

              <Input type="hidden" {...register('mediaUrls')} />
              {Array.isArray(mediaUrlsValue) && mediaUrlsValue.length > 0 && (
                <VStack align="stretch" spacing="2" mt="2">
                  <Text fontSize="xs" color="gray.500">
                    Siralamak icin medya satirini surukleyip birakabilirsiniz.
                  </Text>
                  {mediaUrlsValue.map((url, idx) => (
                    <HStack
                      key={`${url}-${idx}`}
                      p="2"
                      borderWidth="1px"
                      borderColor={dragOverMediaIndex === idx ? 'blue.300' : 'gray.200'}
                      borderRadius="md"
                      justify="space-between"
                      bg={dragOverMediaIndex === idx ? 'blue.50' : 'white'}
                      draggable
                      cursor="grab"
                      onDragStart={() => {
                        setDraggedMediaIndex(idx);
                        setDragOverMediaIndex(idx);
                      }}
                      onDragOver={event => {
                        event.preventDefault();
                        if (dragOverMediaIndex !== idx) {
                          setDragOverMediaIndex(idx);
                        }
                      }}
                      onDrop={event => {
                        event.preventDefault();
                        moveMediaItem(draggedMediaIndex, idx);
                        setDraggedMediaIndex(null);
                        setDragOverMediaIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedMediaIndex(null);
                        setDragOverMediaIndex(null);
                      }}>
                      <HStack spacing="2" flex="1" minW="0">
                        <Text fontSize="sm" color="gray.400">
                          ⋮⋮
                        </Text>
                        <Text fontSize="xs" color="gray.600" noOfLines={1} flex="1">
                          {idx + 1}. {url}
                        </Text>
                      </HStack>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          const next = (mediaUrlsValue || []).filter((_, i) => i !== idx);
                          setValue('mediaUrls', next, {shouldDirty: true});
                        }}>
                        Kaldır
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              )}
            </FormControl>
            <Condition condition={!isNew}>
              <ReadOnlyInfo
                label={'Kayıt Tarihi'}
                value={formatDate(data?.createdAt)}
              />
              <ReadOnlyInfo
                label={'Son Güncellenme Tarihi'}
                value={formatDate(data?.updatedAt)}
              />
            </Condition>
            <Button
              isLoading={isPending}
              colorScheme={'primary'}
              isDisabled={isPending}
              type="submit"
              fontSize={'sm'}>
              Kaydet
            </Button>
          </Flex>
        </form>
      </Box>

      <Box display={'flex'} justifyContent={'end'}>
        <Condition condition={!isNew}>
          <Button
            isLoading={isDeleting}
            colorScheme={'red'}
            isDisabled={isDeleting}
            type="button"
            my={'4'}
            onClick={deleteModal.open}
            fontSize={'sm'}>
            Sil
          </Button>
        </Condition>
      </Box>
      <AlertDialog
        closeOnOverlayClick
        closeOnEsc
        leastDestructiveRef={cancelRef}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Emin misiniz?
            </AlertDialogHeader>
            <AlertDialogBody>Silmek istediğinize emin misiniz?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteModal.close}>
                Vazgeç
              </Button>
              <Button
                colorScheme="red"
                onClick={onDelete}
                ml={3}
                isLoading={isDeleting}
                disabled={isDeleting}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};

const Page = () => {
  const {id} = useParams();
  return <EditSuggestion key={id} id={id} />;
};

export default Page;
