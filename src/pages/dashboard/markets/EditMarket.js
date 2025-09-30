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
  Avatar,
  Select,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  Textarea,
  FormHelperText,
  Text,
} from '@chakra-ui/react';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../../utils/string';
import {marketTypes} from '../../../config';
import {formatDate} from '../../../utils/date';
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {ReadOnlyInfo, Page as Layout, Condition} from '../../../components';
import {api} from '../../../api';
import {getCombinedLogoUrl} from '../../../utils/image';
import {pick} from '../../../utils/object';
import useFileInput from '../../../hooks/useFileInput';

const object = {
  name: yup.string().required(),
  code: yup.string().required(),
  type: yup.string().oneOf(marketTypes).required(),
  about: yup.string().notRequired(),
  website: yup.string().notRequired(),
  headquarters: yup.string().notRequired(),
  parent: yup.string().notRequired(),
  sector: yup.string().notRequired(),
  foundation: yup.string().notRequired(),
  logo: yup.string().notRequired(),
  exchangeCode: yup.string().notRequired(),
  chartSymbol: yup.string().notRequired(),
};

const typeLabel = {
  stock: 'Hisse',
  crypto: 'Kripto',
};

const schema = yup.object().shape(object);

const EditMarket = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
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
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew
        ? api.createMarketDetail(values)
        : api.updateMarketDetail(id, values),
  });

  const {mutateAsync: deleteMarketDetail, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteMarketDetail(id),
  });

  const {data, isLoading} = useQuery({
    enabled: !isNew,
    queryKey: ['market-details', id],
    queryFn: () =>
      api
        .getMarketDetail(id)
        .then(res => res.data)
        .then(values => {
          reset(pick(values, Object.keys(object)));
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      if (objectUrl) {
        const url = await upload();
        if (url) values.logo = url;
      }

      const {data} = await mutateAsync(values);
      if (data) {
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
        navigate(routes.markets.path);
      }
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
      const {data} = await deleteMarketDetail();
      toast({
        title: 'Başarıyla silindi.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.markets.path);
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
            <Box display={'flex'} flexDirection="column">
              <Avatar
                name={data?.name}
                src={objectUrl || getCombinedLogoUrl(getValues('logo'))}
                size={'xl'}
                m={'4'}
                alignSelf={'center'}
                cursor={'pointer'}
                onClick={() => {
                  open();
                }}
              />
              {input}
              <Input
                type={'hidden'}
                defaultValue={getValues('logo')}
                {...register('logo')}
              />
              <Button
                alignSelf={'center'}
                variant={'ghost'}
                onClick={() => {
                  reset({
                    logo: '',
                  });
                  resetFile();
                }}>
                Kaldır
              </Button>
            </Box>
            <FormControl isInvalid={!!errors.name} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                İsim
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.name}
                {...register('name')}
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.code} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kod
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.code}
                {...register('code')}
              />
              <FormErrorMessage>{errors.code?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.role} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Tip
              </FormLabel>
              <Select
                fontSize="sm"
                placeholder="Tip seçin"
                fontWeight="500"
                defaultValue={data?.role}
                size="md"
                {...register('type')}>
                {marketTypes.map(type => {
                  return (
                    <option key={type} value={type}>
                      {typeLabel?.[type]}
                    </option>
                  );
                })}
              </Select>
              <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.about} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hakkında
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                defaultValue={data?.about}
                {...register('about')}
              />
              <FormErrorMessage>{errors.about?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.website} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Website
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.website}
                {...register('website')}
              />
              <FormErrorMessage>{errors.website?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.headquarters} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Merkez
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.headquarters}
                {...register('headquarters')}
              />
              <FormErrorMessage>
                {errors.headquarters?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.parent} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Üst Kuruluş
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.parent}
                {...register('parent')}
              />
              <FormErrorMessage>{errors.parent?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.sector} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Sektör
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.sector}
                {...register('sector')}
              />
              <FormErrorMessage>{errors.sector?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.foundation} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kuruluş
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.foundation}
                {...register('foundation')}
              />
              <FormErrorMessage>{errors.foundation?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.exchangeCode} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Borsa Kodu (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                placeholder={'BIST/BINANCE/NASDAQ vs.'}
                defaultValue={data?.exchangeCode}
                {...register('exchangeCode')}
              />
              <FormErrorMessage>
                {errors.exchangeCode?.message}
              </FormErrorMessage>
              <FormHelperText>
                İşlem gördüğü borsa kodu. Grafikler için kullanılır. Hisseler
                varsayılan olarak BIST, kriptolar BINANCE olarak seçilir.
                Özellikle kripto piyasalarında "Hatalı Sembol" uyarısı
                görürseniz burayı değiştirebilirsiniz.
              </FormHelperText>
            </FormControl>
            <FormControl isInvalid={!!errors.chartSymbol} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Grafik Kodu (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                placeholder={'Örn: CRYPTOCAP:DAI'}
                defaultValue={data?.chartSymbol}
                {...register('chartSymbol')}
              />
              <FormErrorMessage>{errors.chartSymbol?.message}</FormErrorMessage>
              <FormHelperText>
                TradingView grafiklerinde bazı kripto paralarda Borsa Kodu'nu
                girdikten sonra da "Hatalı sembol" uyarısı almaya devam
                ederseniz,{' '}
                <Text
                  as={'a'}
                  color={'blue'}
                  href={
                    'https://www.tradingview.com/widget-docs/widgets/charts/symbol-overview/'
                  }
                  target={'_blank'}>
                  buradan
                </Text>{' '}
                ilgili kriptonun kodunu bulup yapıştırın.
              </FormHelperText>
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
              fontSize={'sm'}>
              Kaydet
            </Button>
          </Flex>
        </form>
      </Box>
      <Box display={'flex'} justifyContent={'end'}>
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
  return <EditMarket key={id} id={id} />;
};

export default Page;
