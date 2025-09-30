import {Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {BlacklistScopeLabel, BlacklistValueLabel} from '../../../config';

const fetchData = async options => {
  const response = await api.getBlacklists(options);
  return response.data;
};

const Blacklist = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editBlacklist.getPath(item.id));
  };

  return (
    <Page>
      <DataTable
        queryEnabled
        onRow={onRow}
        columns={[
          {
            header: 'Kapsam',
            accessorKey: 'scope',
            cell: ({getValue}) => {
              return <Text>{BlacklistScopeLabel[getValue()]}</Text>;
            },
          },
          {
            header: 'Değer Tipi',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return <Text>{BlacklistValueLabel[getValue()]}</Text>;
            },
          },
          {
            header: 'Değer',
            accessorKey: 'value',
          },
          {
            header: 'Kaynak',
            accessorKey: 'resource',
            cell: ({getValue}) => {
              return <Text>{getValue() ?? '-'}</Text>;
            },
          },
          {
            header: 'Aktiflik',
            accessorKey: 'isActive',
            cell: ({getValue}) => {
              return <Text>{getValue() ? 'Aktif' : 'Pasif'}</Text>;
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Blacklist;
