import {Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {PolicyTypeLabel} from '../../../config';

const fetchData = async options => {
  const response = await api.getPolicies(options);
  return response.data;
};

const Policies = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editPolicy.getPath(item.type));
  };

  return (
    <Page>
      <DataTable
        deleteVisible={false}
        onRow={onRow}
        columns={[
          {
            header: 'Başlık',
            accessorKey: 'title',
          },
          {
            header: 'Tür',
            accessorKey: 'type',
            cell: ({getValue}) => {
              return <Text>{PolicyTypeLabel[getValue()]}</Text>;
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Policies;
