import React from 'react';
import {NavLink, useParams} from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Avatar,
  Text,
} from '@chakra-ui/react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../api';
import {ReportType, ReportTypeLabel, roles} from '../../../config';
import {formatDate} from '../../../utils/date';
import {ReadOnlyInfo, Page, Condition} from '../../../components';
import {routes} from '../../../config/routes';
import {RxExternalLink} from 'react-icons/rx';

const ReportDetail = () => {
  const {id} = useParams();

  const {data, isLoading} = useQuery({
    queryKey: ['report', id],
    queryFn: () => api.getReport(id).then(res => res.data),
  });

  return (
    <Page>
      <Box
        bg={'white'}
        overflow={'scroll'}
        borderRadius={'md'}
        display={'flex'}
        flexDirection={'column'}
        boxShadow={'md'}
        p={'4'}>
        <Box display={'flex'} flexDirection="column">
          <Text fontSize={'md'} fontWeight={'bold'} mt={'2'} mb={'2'}>
            Rapor Bilgileri
          </Text>
          <ReadOnlyInfo label={'ID'} value={data?.id} />
          <ReadOnlyInfo label={'Tür'} value={ReportTypeLabel?.[data?.type]} />
          <ReadOnlyInfo
            label={'Konu'}
            value={data?.subject}
            visible={!!data?.subject}
          />
          <ReadOnlyInfo label={'Mesaj'} value={data?.message} />
          <ReadOnlyInfo
            label={'Oluşturulma Tarihi'}
            value={formatDate(data?.createdAt)}
          />
          <Condition condition={!!data?.sub}>
            <Box
              display={'flex'}
              alignItems={'center'}
              mt={'5'}
              mb={'2'}
              justifyContent={'flex-start'}>
              <Text fontSize={'md'} fontWeight={'bold'}>
                Şikayet Edilen Kullanıcı
              </Text>
              <Text
                display={'flex'}
                alignItems={'center'}
                fontSize={'sm'}
                ml={'2'}
                fontWeight={'medium'}
                color={'main'}>
                <NavLink
                  to={routes.editUser.getPath(data?.sub?.id)}
                  target={'_blank'}>
                  Yeni Sekmede Aç
                </NavLink>
                <RxExternalLink />
              </Text>
            </Box>
            <ReadOnlyInfo label={'ID'} value={data?.sub?.id} />
            <ReadOnlyInfo label={'Tam Ad'} value={data?.sub?.fullname} />
            <ReadOnlyInfo label={'E-Posta'} value={data?.sub?.email} />
          </Condition>{' '}
          <Condition condition={!!data?.channel}>
            <Box
              display={'flex'}
              alignItems={'center'}
              mt={'5'}
              mb={'2'}
              justifyContent={'flex-start'}>
              <Text fontSize={'md'} fontWeight={'bold'}>
                Şikayet Edilen Kanal
              </Text>
              {/*<Text*/}
              {/*  display={'flex'}*/}
              {/*  alignItems={'center'}*/}
              {/*  fontSize={'sm'}*/}
              {/*  ml={'2'}*/}
              {/*  fontWeight={'medium'}*/}
              {/*  color={'main'}>*/}
              {/*  <NavLink*/}
              {/*    to={routes.editChannel.getPath(data?.channel?.id)}*/}
              {/*    target={'_blank'}>*/}
              {/*    Yeni Sekmede Aç*/}
              {/*  </NavLink>*/}
              {/*  <RxExternalLink />*/}
              {/*</Text>*/}
            </Box>
            <ReadOnlyInfo label={'ID'} value={data?.channel?.id} />
            <ReadOnlyInfo label={'İsim'} value={data?.channel?.name} />
          </Condition>
          <Box
            display={'flex'}
            alignItems={'center'}
            mt={'5'}
            mb={'2'}
            justifyContent={'flex-start'}>
            <Text fontSize={'md'} fontWeight={'bold'}>
              Raporu Oluşturan Kullanıcı
            </Text>
            <Text
              display={'flex'}
              alignItems={'center'}
              fontSize={'sm'}
              ml={'2'}
              fontWeight={'medium'}
              color={'main'}>
              <NavLink
                to={routes.editUser.getPath(data?.user?.id)}
                target={'_blank'}>
                Yeni Sekmede Aç
              </NavLink>
              <RxExternalLink />
            </Text>
          </Box>
          <ReadOnlyInfo label={'ID'} value={data?.user?.id} />
          <ReadOnlyInfo label={'Tam Ad'} value={data?.user?.fullname} />
          <ReadOnlyInfo label={'E-Posta'} value={data?.user?.email} />
        </Box>
      </Box>
      {/*<Box display={'flex'} justifyContent={'end'}>*/}
      {/*  <Button*/}
      {/*    isLoading={isDeleting}*/}
      {/*    colorScheme={'red'}*/}
      {/*    isDisabled={isDeleting}*/}
      {/*    type="button"*/}
      {/*    my={'4'}*/}
      {/*    onClick={deleteModal.open}*/}
      {/*    fontSize={'sm'}>*/}
      {/*    Kullanıcıyı Sil*/}
      {/*  </Button>*/}
      {/*</Box>*/}
    </Page>
  );
};

export default ReportDetail;
