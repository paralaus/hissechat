import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Button,
  Text,
  useToast,
} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {getChannelThumbnail} from '../../utils/image';
import {DataTable} from '../../components';
import {routes} from '../../config/routes';
import {api} from '../../api';
import React, {useRef, useState} from 'react';
import useDisclosure from '../../hooks/useDisclosure';
import {useMutation} from '@tanstack/react-query';
import {getErrorMessage} from '../../utils/string';
import {ChannelType} from '../../config';

const fetchData = userId => async options => {
  const response = await api.getChannelsOfUser(userId, options);
  return response.data;
};

const UserChannels = ({userId}) => {
  const navigate = useNavigate();
  const kickOutModal = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();
  const [refresh, setRefresh] = useState();

  const {mutateAsync: kickOut, isPending: isKickingOut} = useMutation({
    mutationFn: channelId => api.kickOutFromChannel(userId, channelId),
  });

  const onRow = async item => {
    navigate(routes.editChannel.getPath(item.id));
  };

  const onKickOut = async channelId => {
    try {
      const {data} = await kickOut(channelId);
      toast({
        title: 'Başarıyla çıkarıldı.',
        status: 'success',
        position: 'top',
      });
      setRefresh(channelId);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    } finally {
      kickOutModal.close();
    }
  };

  return (
    <>
      <Text fontSize={'medium'} fontWeight={'bold'}>
        Katıldığı Kanallar
      </Text>
      <DataTable
        key={refresh}
        shadow={false}
        queryEnabled
        deleteVisible={false}
        onRow={onRow}
        columns={[
          {
            header: 'Logo',
            accessorKey: 'thumbnail',
            cell: ({getValue, row}) => (
              <Avatar
                name={row?.original?.name}
                src={getChannelThumbnail(row.original)}
                size={'sm'}
              />
            ),
          },
          {
            header: 'İsim',
            accessorKey: 'name',
          },
          {
            header: 'Vip',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return (
                <Text>{getValue() === ChannelType.Vip ? 'Evet' : 'Hayır'}</Text>
              );
            },
          },
          {
            header: '',
            accessorKey: 'id',
            cell: ({getValue}) => {
              return (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    kickOutModal.open(getValue());
                  }}>
                  Kanaldan Çıkar
                </Button>
              );
            },
          },
        ]}
        fetchData={fetchData(userId)}
      />
      <AlertDialog
        closeOnOverlayClick
        closeOnEsc
        leastDestructiveRef={cancelRef}
        isOpen={kickOutModal.isOpen}
        onClose={kickOutModal.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Kanaldan Çıkar
            </AlertDialogHeader>
            <AlertDialogBody>
              Kullanıcıyı kanaldan çıkarmak istediğinize emin misiniz?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={kickOutModal.close}>
                Vazgeç
              </Button>
              <Button
                colorScheme="red"
                onClick={() => onKickOut(kickOutModal.variable)}
                ml={3}
                isLoading={isKickingOut}
                disabled={isKickingOut}>
                Çıkar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default UserChannels;
