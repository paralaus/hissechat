import {Text, HStack, Avatar, Box} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {api} from '../../../api';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {FiStar} from 'react-icons/fi';
import useDisclosure from '../../../hooks/useDisclosure';
import RatingDetailModal from './RatingDetailModal';

const fetchData = async options => {
  const response = await api.getAppRatings(options);
  return response.data;
};

const AppRatings = () => {
  const detailModal = useDisclosure();

  return (
    <Page title="Uygulama Değerlendirmeleri">
      <DataTable
        deleteVisible={false}
        onRow={row => detailModal.open(row)}
        columns={[
          {
            header: 'Kullanıcı',
            accessorKey: 'user',
            cell: ({getValue}) => {
              const user = getValue();
              return (
                <HStack>
                  <Avatar size="sm" name={user?.name} src={user?.profileImage} />
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">
                      {user?.name || 'Anonim'}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user?.email}
                    </Text>
                  </Box>
                </HStack>
              );
            },
          },
          {
            header: 'Puan',
            accessorKey: 'rating',
            cell: ({getValue}) => (
              <HStack spacing={1}>
                <Text fontWeight="bold">{getValue()}</Text>
                <FiStar fill="gold" color="gold" />
              </HStack>
            ),
          },
          {
            header: 'Yorum',
            accessorKey: 'comment',
            cell: ({getValue}) => (
              <Text noOfLines={2} title={getValue()}>
                {getValue() || '-'}
              </Text>
            ),
          },
          {
            header: 'IP Adresi',
            accessorKey: 'ipAddress',
          },
          {
            header: 'Tarih',
            accessorKey: 'createdAt',
            cell: ({getValue}) => (
              <Text fontSize="sm">
                {format(new Date(getValue()), 'dd MMM yyyy HH:mm', {locale: tr})}
              </Text>
            ),
          },
        ]}
        fetchData={fetchData}
      />
      <RatingDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        rating={detailModal.variable}
      />
    </Page>
  );
};

export default AppRatings;
