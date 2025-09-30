import {Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';

const fetchData = async options => {
  const response = await api.getProducts(options);
  return response.data;
};

const time = {
  30: 'Aylık',
  365: 'Yıllık',
};

const Products = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editProduct.getPath(item.id));
  };

  return (
    <Page>
      <DataTable
        queryEnabled
        deleteVisible={false}
        onRow={onRow}
        columns={[
          {
            header: 'İsim',
            accessorKey: 'name',
          },
          {
            header: 'Abonelik Süresi',
            accessorKey: 'timeDays',
            cell: ({getValue}) => {
              return <Text>{time[getValue()]}</Text>;
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

export default Products;
