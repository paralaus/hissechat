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
import { SuggestionTypeLabel, suggestionTypes, SuggestionType } from '../../../config';
import useFileInput from '../../../hooks/useFileInput';

applyGoogleTranslateFix();

const object = {
  title: yup.string(),
  content: yup.string(),
  type: yup.string(),
  imageUrl: yup.string(),
  videoUrl: yup.string(),
  audioUrl: yup.string(),
};

const schema = yup.object().shape({
  title: yup
    .string()
    .nullable()
    .when('type', (type, schema) =>
      type === SuggestionType.Headline ? schema.nullable() : schema.required('Bu alan zorunludur.')
    ),
  content: yup
    .string()
    .nullable()
    .when('type', (type, schema) =>
      type === SuggestionType.Headline ? schema.nullable() : schema.required('Bu alan zorunludur.')
    ),
  type: yup.string().required('Bu alan zorunludur.'),
  imageUrl: yup.string().nullable(),
  videoUrl: yup.string().nullable(),
  audioUrl: yup.string().nullable(),
});

const EditSuggestion = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  const {
    input: imageInput,
    open: openImage,
    file: imageFile,
    upload: uploadImage,
    isUploading: isUploadingImage,
  } = useFileInput({ accept: 'image/*' });
  const {
    input: mediaInput,
    open: openMedia,
    file: mediaFile,
    upload: uploadMedia,
    isUploading: isUploadingMedia,
  } = useFileInput({ accept: 'video/*,audio/*' });
  const {
    register,
    handleSubmit,
    formState: {errors},
    setValue,
    reset,
    watch,
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
  const typeValue = watch('type');
  const isHeadline = typeValue === SuggestionType.Headline;
  const hasMedia =
    !!imageFile ||
    !!mediaFile ||
    !!(imageUrlValue && imageUrlValue.trim()) ||
    !!(videoUrlValue && videoUrlValue.trim()) ||
    !!(audioUrlValue && audioUrlValue.trim());

  const onSubmit = async values => {
    try {
      if (values.type === SuggestionType.Headline) {
        const submitHasMedia =
          !!imageFile ||
          !!mediaFile ||
          !!(values.imageUrl && values.imageUrl.trim()) ||
          !!(values.videoUrl && values.videoUrl.trim()) ||
          !!(values.audioUrl && values.audioUrl.trim());
        if (!submitHasMedia) {
          toast({
            title: 'Manşet için en az bir medya zorunludur.',
            status: 'error',
            position: 'top',
          });
          return;
        }
      }
      const submissionValues = {...values};
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
        const isVideo = mimeType.startsWith('video/') || videoExtensions.some(ext => fileName.endsWith(ext));
        const isAudio = mimeType.startsWith('audio/') || audioExtensions.some(ext => fileName.endsWith(ext));
        if (isVideo) {
          submissionValues.videoUrl = url;
        } else if (isAudio) {
          submissionValues.audioUrl = url;
        } else {
          submissionValues.imageUrl = url;
        }
      }
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
            <FormControl isInvalid={!!errors.title} mb="4" key={0}>
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
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.content} mb="4" key={1}>
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
              <FormErrorMessage>{errors.content?.message}</FormErrorMessage>
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
                  return <option value={type}>{SuggestionTypeLabel[type]}</option>;
                })}
              </Select>
              <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
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
                mb="2"
              >
                Görsel Seç
              </Button>
              {imageInput}
              <Input type="hidden" {...register('imageUrl')} />
              {(imageUrlValue || imageFile) && (
                <Box mt="1" fontSize="xs" color="green.500">
                  Görsel mevcut
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
                mb="2"
              >
                Video veya Ses Seç
              </Button>
              {mediaInput}
              <Input type="hidden" {...register('videoUrl')} />
              <Input type="hidden" {...register('audioUrl')} />
              {(videoUrlValue || audioUrlValue || mediaFile) && (
                <Box mt="1" fontSize="xs" color="blue.500">
                  {mediaFile
                    ? mediaFile.type?.startsWith('audio/')
                      ? 'Ses seçildi'
                      : mediaFile.type?.startsWith('video/')
                      ? 'Video seçildi'
                      : 'Medya seçildi'
                    : videoUrlValue
                    ? 'Video mevcut'
                    : 'Ses mevcut'}
                </Box>
              )}
              <FormErrorMessage>
                {isHeadline && !hasMedia ? 'Manşet için en az bir medya zorunludur.' : ''}
              </FormErrorMessage>
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
