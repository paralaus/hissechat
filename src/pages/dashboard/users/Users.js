import {Box, Text, useToast} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {useNavigate} from 'react-router-dom';
import {api} from '../../../api';
import {RoleLabel} from '../../../config';
import {routes} from '../../../config/routes';

const fetchData = async options => {
  const response = await api.getUsers(options);
  return response.data;
};

const Users = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editUser.getPath(item.id));
  };

  return (
    <Page>
      <DataTable
        queryEnabled
        editVisible
        onRow={onRow}
        columns={[
          {
            header: 'Ad Soyad',
            accessorKey: 'fullname',
          },
          {
            header: 'E-posta',
            accessorKey: 'email',
          },
          {
            header: 'Rol',
            accessorKey: 'role',
            cell: ({getValue}) => {
              const data = RoleLabel[getValue()];
              return <Text>{data}</Text>;
            },
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Users;
