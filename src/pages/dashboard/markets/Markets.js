import {Avatar, Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {getCombinedLogoUrl} from '../../../utils/image';
import {DataTable, Page} from '../../../components';
import {MarketTypeLabel} from '../../../config';
import {routes} from '../../../config/routes';
import {api} from '../../../api';

const fetchData = async options => {
  const response = await api.getMarketDetails(options);
  return response.data;
};

const Markets = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editMarket.getPath(item.code));
  };

  return (
    <Page>
      <DataTable
        queryEnabled
        editVisible
        onRow={onRow}
        columns={[
          {
            header: 'Logo',
            accessorKey: 'logo',
            cell: ({getValue, row}) => (
              <Avatar
                name={row?.original?.name}
                src={getCombinedLogoUrl(getValue())}
                size={'sm'}
              />
            ),
          },
          {
            header: 'İsim',
            accessorKey: 'name',
          },
          {
            header: 'Kod',
            accessorKey: 'code',
          },
          {
            header: 'Tip',
            accessorKey: 'type',
            cell: ({getValue}) => {
              const data = MarketTypeLabel[getValue()];
              return <Text>{data}</Text>;
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Markets;
