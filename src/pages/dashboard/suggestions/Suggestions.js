import {Text} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import {SuggestionTypeLabel} from '../../../config';

const fetchData = async options => {
  const response = await api.getSuggestions(options);
  return response.data;
};

const Suggestions = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editSuggestion.getPath(item.id));
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
              return <Text>{SuggestionTypeLabel[getValue()]}</Text>;
            },
         },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Suggestions;
