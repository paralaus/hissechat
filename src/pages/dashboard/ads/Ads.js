import {useNavigate} from 'react-router-dom';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';

const fetchData = async options => {
  const response = await api.getAdsDetails(options);
  return response.data;
};

const Ads = () => {
  const navigate = useNavigate();

  const onRow = async item => {
    navigate(routes.editAds.getPath(item.id));
  };

  return (
    <Page>
      <DataTable
        queryEnabled
        editVisible
        onRow={onRow}
        columns={[
          {
            header: 'Başlık',
            accessorKey: 'title',
          },
          {
            header: 'Açıklama',
            accessorKey: 'description',
          },
          {
            header: 'Bağlantı',
            accessorKey: 'link',
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Ads;
