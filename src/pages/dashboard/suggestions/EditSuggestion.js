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
  FormHelperText,
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
import { SuggestionTypeLabel, suggestionTypes } from '../../../config';

applyGoogleTranslateFix();

const object = {
  title: yup.string().required('Bu alan zorunludur.'),
  content: yup.string().required('Bu alan zorunludur.'),
  type: yup.string(),
};

const schema = yup.object().shape(object);

const EditSuggestion = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: {errors},
    setValue,
    reset,
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

  const {data, isLoading} = useQuery({
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

  const onSubmit = async values => {
    try {
      const {data} = await mutateAsync(values);
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
      const {data} = await deleteItem();
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
