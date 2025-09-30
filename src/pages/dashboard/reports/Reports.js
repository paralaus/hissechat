import {Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {ReportTypeLabel} from '../../../config';

const fetchData = async options => {
  const response = await api.getReports(options);
  return response.data;
};

const Reports = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.reportDetail.getPath(item.id));
  };

  return (
    <Page>
      <DataTable
        queryEnabled
        deleteVisible={false}
        onRow={onRow}
        columns={[
          {
            header: 'Tür',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return <Text>{ReportTypeLabel[getValue()]}</Text>;
            },
          },
          {
            header: 'Kullanıcı',
            accessorKey: 'user.fullname',
          },
          {
            header: 'Konu',
            accessorKey: 'subject',
            cell: ({getValue}) => {
              return <Text>{getValue() ?? '-'}</Text>;
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Reports;
