import {HStack, Select, Text} from '@chakra-ui/react';
import {useState} from 'react';
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
  const [messageFilter, setMessageFilter] = useState('all');

  const onRow = async item => {
    navigate(routes.reportDetail.getPath(item.id));
  };

  return (
    <Page>
      <HStack mb="3" justify="flex-end">
        <Select
          value={messageFilter}
          onChange={e => setMessageFilter(e.target.value)}
          maxW="260px"
          size="sm">
          <option value="all">Tum Raporlar</option>
          <option value="with">Aciklamasi Olanlar</option>
          <option value="without">Aciklamasi Olmayanlar</option>
        </Select>
      </HStack>
      <DataTable
        queryEnabled
        deleteVisible={false}
        onRow={onRow}
        filters={
          messageFilter === 'with'
            ? {hasMessage: true}
            : messageFilter === 'without'
            ? {hasMessage: false}
            : {}
        }
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
          {
            header: 'Açıklama',
            accessorKey: 'message',
            cell: ({getValue}) => {
              const value = getValue();
              if (!value) return <Text>-</Text>;
              return (
                <Text noOfLines={2} title={value}>
                  {value}
                </Text>
              );
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Reports;
