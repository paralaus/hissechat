import {Avatar, Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {getChannelThumbnail} from '../../../utils/image';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {ChannelType} from '../../../config';
import React from 'react';

const fetchData = async options => {
  const response = await api.getAllChannels(options);
  return response.data;
};

const AllChannels = () => {
  const navigate = useNavigate();
  const onRow = async item => {
    navigate(routes.editChannel.getPath(item.id));
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
            header: 'Vip',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return (
                <Text>{getValue() === ChannelType.Vip ? 'Evet' : 'Hayır'}</Text>
              );
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default AllChannels;
