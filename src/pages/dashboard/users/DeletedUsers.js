import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {DataTable, Page} from '../../../components';
import {api} from '../../../api';
import {useState} from 'react';

const formatDateTime = value => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr});
  } catch {
    return '-';
  }
};

const getDisplayEmail = user => {
  return user?.deletedEmail || user?.email || '-';
};

const escapeHtml = value => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const fetchData = async options => {
  const response = await api.getUsers({
    ...options,
    isDeleted: true,
  });
  return response.data;
};

const fetchAllDeletedUsers = async filters => {
  const limit = 100;
  const firstResponse = await api.getUsers({
    ...filters,
    isDeleted: true,
    page: 1,
    limit,
  });
  const firstData = firstResponse.data;
  const allResults = [...(firstData?.results || [])];
  const totalPages = Number(firstData?.totalPages || 1);

  for (let page = 2; page <= totalPages; page += 1) {
    const nextResponse = await api.getUsers({
      ...filters,
      isDeleted: true,
      page,
      limit,
    });
    allResults.push(...(nextResponse.data?.results || []));
  }

  return allResults;
};

const buildDeletedUsersPdfHtml = ({rows, filtersLabel}) => {
  const generatedAt = formatDateTime(new Date().toISOString());

  const bodyRows = rows
    .map((user, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(user?.fullname || 'İsimsiz')}</td>
          <td>${escapeHtml(getDisplayEmail(user))}</td>
          <td>${escapeHtml(user?.deleteReason || '-')}</td>
          <td>${escapeHtml(
            user?.deletionSource === 'admin' ? 'Admin' : 'Kullanıcı',
          )}</td>
          <td>${escapeHtml(user?.authProvider || '-')}</td>
          <td>${escapeHtml(user?.platform || '-')}</td>
          <td>${escapeHtml(formatDateTime(user?.deletedAt))}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Silinen Kullanıcılar</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
          h1 { margin: 0 0 8px 0; font-size: 20px; }
          .meta { font-size: 12px; color: #4b5563; line-height: 1.5; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; vertical-align: top; font-size: 11px; word-break: break-word; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Silinen Kullanıcılar</h1>
        <div class="meta">
          Kayıt sayısı: ${escapeHtml(rows.length)}<br />
          Export tarihi: ${escapeHtml(generatedAt)}<br />
          Filtreler: ${escapeHtml(filtersLabel || '-')}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Ad Soyad</th>
              <th>Email</th>
              <th>Silme Nedeni</th>
              <th style="width:80px">Kaynak</th>
              <th style="width:80px">Sağlayıcı</th>
              <th style="width:80px">Platform</th>
              <th style="width:140px">Silinme Tarihi</th>
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;
};

const downloadDeletedUsersExcel = ({rows, filtersLabel}) => {
  const generatedAt = formatDateTime(new Date().toISOString());
  const tableRows = rows
    .map((user, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(user?.fullname || 'İsimsiz')}</td>
          <td>${escapeHtml(getDisplayEmail(user))}</td>
          <td>${escapeHtml(user?.deleteReason || '-')}</td>
          <td>${escapeHtml(
            user?.deletionSource === 'admin' ? 'Admin' : 'Kullanıcı',
          )}</td>
          <td>${escapeHtml(user?.authProvider || '-')}</td>
          <td>${escapeHtml(user?.platform || '-')}</td>
          <td>${escapeHtml(formatDateTime(user?.deletedAt))}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table>
          <tr><td colspan="8"><b>Silinen Kullanıcılar</b></td></tr>
          <tr><td colspan="8">Export tarihi: ${escapeHtml(generatedAt)}</td></tr>
          <tr><td colspan="8">Filtreler: ${escapeHtml(filtersLabel || '-')}</td></tr>
          <tr><td colspan="8">Kayıt sayısı: ${escapeHtml(rows.length)}</td></tr>
        </table>
        <br />
        <table border="1">
          <thead>
            <tr>
              <th>#</th>
              <th>Ad Soyad</th>
              <th>Email</th>
              <th>Silme Nedeni</th>
              <th>Kaynak</th>
              <th>Sağlayıcı</th>
              <th>Platform</th>
              <th>Silinme Tarihi</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([`\ufeff${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const fileName = `silinen-kullanicilar-${new Date()
    .toISOString()
    .slice(0, 10)}.xls`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const DeletedUsers = () => {
  const [filterParams, setFilterParams] = useState({});
  const [tableQuery, setTableQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const toast = useToast();

  const handleDateFilter = (key, value) => {
    const nextFilters = {...filterParams};
    if (value) {
      nextFilters[key] = value;
    } else {
      delete nextFilters[key];
    }
    setFilterParams(nextFilters);
  };

  const buildFiltersLabel = () => {
    const search = String(tableQuery || '').trim();
    const from = filterParams.deletedAfter || '-';
    const to = filterParams.deletedBefore || '-';
    return `Silinme Tarihi Başlangıç: ${from} | Silinme Tarihi Bitiş: ${to}${
      search ? ` | Arama: ${search}` : ''
    }`;
  };

  const getExportRows = async () => {
    const exportFilters = {...filterParams};
    const search = String(tableQuery || '').trim();
    if (search) {
      exportFilters.query = search;
    }
    return fetchAllDeletedUsers(exportFilters);
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const rows = await getExportRows();
      const popup = window.open('', '_blank', 'width=1200,height=900');
      if (!popup) {
        toast({
          title: 'PDF açılamadı',
          description: 'Tarayıcı popup engelliyor olabilir.',
          status: 'error',
          position: 'top',
        });
        return;
      }

      popup.document.open();
      popup.document.write(
        buildDeletedUsersPdfHtml({
          rows,
          filtersLabel: buildFiltersLabel(),
        }),
      );
      popup.document.close();
    } catch (error) {
      toast({
        title: 'PDF export başarısız',
        description: String(error?.message || error),
        status: 'error',
        position: 'top',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const rows = await getExportRows();
      downloadDeletedUsersExcel({
        rows,
        filtersLabel: buildFiltersLabel(),
      });
    } catch (error) {
      toast({
        title: 'Excel export başarısız',
        description: String(error?.message || error),
        status: 'error',
        position: 'top',
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <Page>
      <Box mb={4}>
        <HStack spacing={3} flexWrap="wrap" align="end">
          <Box>
            <Text fontSize="sm" mb={1}>
              Silinme Tarihi Başlangıç
            </Text>
            <Input
              type="date"
              value={filterParams.deletedAfter || ''}
              onChange={e => handleDateFilter('deletedAfter', e.target.value)}
              maxW="190px"
            />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1}>
              Silinme Tarihi Bitiş
            </Text>
            <Input
              type="date"
              value={filterParams.deletedBefore || ''}
              onChange={e => handleDateFilter('deletedBefore', e.target.value)}
              maxW="190px"
            />
          </Box>
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={handleExportPdf}
            isLoading={isExportingPdf}>
            PDF Export
          </Button>
          <Button
            colorScheme="green"
            variant="outline"
            onClick={handleExportExcel}
            isLoading={isExportingExcel}>
            Excel Export
          </Button>
        </HStack>
      </Box>
      <DataTable
        queryEnabled
        filters={{isDeleted: true, ...filterParams}}
        onQueryChange={setTableQuery}
        searchPlaceholder="Silinen kullanıcı ara..."
        fetchData={fetchData}
        columns={[
          {
            header: 'Ad Soyad',
            accessorKey: 'fullname',
            cell: ({getValue}) => getValue() || 'İsimsiz',
          },
          {
            header: 'E-posta',
            accessorKey: 'deletedEmail',
            cell: ({row}) => getDisplayEmail(row.original),
          },
          {
            header: 'Neden',
            accessorKey: 'deleteReason',
            cell: ({getValue}) => {
              const value = getValue();
              return (
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {value || '-'}
                </Text>
              );
            },
          },
          {
            header: 'Kaynak',
            accessorKey: 'deletionSource',
            cell: ({getValue}) => {
              const value = getValue();
              const label = value === 'admin' ? 'Admin' : 'Kullanıcı';
              return (
                <Badge colorScheme={value === 'admin' ? 'red' : 'orange'}>
                  {label}
                </Badge>
              );
            },
          },
          {
            header: 'Sağlayıcı',
            accessorKey: 'authProvider',
            cell: ({getValue}) => {
              const value = getValue();
              return <Badge colorScheme="blue">{value || '-'}</Badge>;
            },
          },
          {
            header: 'Platform',
            accessorKey: 'platform',
            cell: ({getValue}) => getValue() || '-',
          },
          {
            header: 'Silinme Tarihi',
            accessorKey: 'deletedAt',
            cell: ({getValue}) => {
              const value = getValue();
              if (!value) {
                return (
                  <Text fontSize="sm" color="gray.500">
                    -
                  </Text>
                );
              }

              return (
                <Text fontSize="sm">
                  {format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr})}
                </Text>
              );
            },
          },
        ]}
      />
    </Page>
  );
};

export default DeletedUsers;
