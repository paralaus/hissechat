import React from 'react';
import {Text, HStack, Badge, Button, useToast} from '@chakra-ui/react';
import {useNavigate} from 'react-router-dom';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {DataTable, Page} from '../../../components';
import {api} from '../../../api';
import {routes} from '../../../config/routes';

const fetchData = async options => {
  const response = await api.getAnnouncements(options);
  return response.data;
};

const audienceLabels = {
  all: 'Tümü',
  free: 'Ücretsiz',
  vip: 'VIP',
  specific: 'Belirli kullanıcılar',
};

const Announcements = () => {
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <Page
      title="Duyurular"
      action={
        <Button
          colorScheme="blue"
          onClick={() => navigate(routes.createAnnouncement.path)}>
          Yeni Duyuru
        </Button>
      }>
      <DataTable
        deleteVisible
        onDelete={async row => {
          try {
            await api.deleteAnnouncement(row.id);
            toast({title: 'Duyuru silindi.', status: 'success', position: 'top'});
          } catch (e) {
            toast({title: 'Silme başarısız.', status: 'error', position: 'top'});
          }
        }}
        onRow={row => navigate(routes.editAnnouncement.getPath(row.id))}
        columns={[
          {
            header: 'Başlık',
            accessorKey: 'title',
            cell: ({getValue}) => (
              <Text fontWeight="bold" noOfLines={1}>
                {getValue()}
              </Text>
            ),
          },
          {
            header: 'İçerik',
            accessorKey: 'body',
            cell: ({getValue}) => (
              <Text noOfLines={2} fontSize="sm" color="gray.600">
                {getValue()}
              </Text>
            ),
          },
          {
            header: 'Hedef',
            accessorKey: 'audience',
            cell: ({getValue}) => {
              const a = getValue() || {};
              return <Badge>{audienceLabels[a.type] || 'Tümü'}</Badge>;
            },
          },
          {
            header: 'Öncelik',
            accessorKey: 'priority',
          },
          {
            header: 'Aktif',
            accessorKey: 'isActive',
            cell: ({getValue}) => (
              <Badge colorScheme={getValue() ? 'green' : 'gray'}>
                {getValue() ? 'Evet' : 'Hayır'}
              </Badge>
            ),
          },
          {
            header: 'Başlangıç',
            accessorKey: 'startsAt',
            cell: ({getValue}) =>
              getValue() ? (
                <Text fontSize="sm">
                  {format(new Date(getValue()), 'dd MMM yyyy HH:mm', {locale: tr})}
                </Text>
              ) : (
                '-'
              ),
          },
          {
            header: 'Bitiş',
            accessorKey: 'endsAt',
            cell: ({getValue}) =>
              getValue() ? (
                <Text fontSize="sm">
                  {format(new Date(getValue()), 'dd MMM yyyy HH:mm', {locale: tr})}
                </Text>
              ) : (
                <Text fontSize="sm" color="gray.400">
                  Süresiz
                </Text>
              ),
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default Announcements;
