import {Avatar, Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {getChannelThumbnail} from '../../../utils/image';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';

const fetchData = async options => {
  const response = await api.getVipChannels(options);
  return response.data;
};

const VipChannels = () => {
  const navigate = useNavigate();
  const onRow = async item => {
    navigate(routes.editVipChannels.getPath(item.id));
  };

  return (
    <Page>
      <DataTable
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
            header: 'Üye Sayısı',
            accessorKey: 'memberCount',
          },
          {
            header: 'Aktiflik',
            accessorKey: 'isActive',
            cell: ({getValue}) => {
              return <Text>{getValue() ? 'Aktif' : 'Pasif'}</Text>;
            },
          },
          {
            header: 'Sıra Katsayısı',
            accessorKey: 'rank',
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default VipChannels;
