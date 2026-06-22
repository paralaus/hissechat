import {
  Text,
  Badge,
  HStack,
  Select,
  Box,
  Button,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import {DataTable, Page} from '../../../components';
import {api} from '../../../api';
import {useState} from 'react';
import {format} from 'date-fns';
import {tr} from 'date-fns/locale';
import {FaApple, FaGooglePlay} from 'react-icons/fa';
import {useQuery} from '@tanstack/react-query';
import {FiFileText} from 'react-icons/fi';

const fetchData = async options => {
  const params = {...options, hasChannel: true, distinctUser: true, activeOnly: true};
  if (params.query) {
    params.search = params.query;
  }
  delete params.query;
  const response = await api.getPurchases(params);
  return response.data;
};

const fetchAllPurchases = async (filters = {}) => {
  const limit = 100;
  const firstRes = await api.getPurchases({limit, page: 1, ...filters});
  const firstData = firstRes.data;
  const firstResults = firstData?.results || [];
  const totalPages = Number(firstData?.totalPages || 1);

  if (totalPages <= 1) return firstResults;

  const requests = [];
  for (let page = 2; page <= totalPages; page += 1) {
    requests.push(api.getPurchases({limit, page, ...filters}));
  }
  const responses = await Promise.all(requests);
  const restResults = responses.flatMap(r => r.data?.results || []);
  return firstResults.concat(restResults);
};

const formatDateTime = value => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr});
  } catch {
    return '-';
  }
};

const escapeHtml = value => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const buildSubscriptionsPrintHtml = ({rows, filtersLabel}) => {
  const generatedAt = formatDateTime(new Date().toISOString());
  const safeFilters = escapeHtml(filtersLabel || '—');

  const bodyRows = (rows || [])
    .map(r => {
      const userName = r?.user?.fullname || 'İsimsiz';
      const userEmail = r?.user?.email || '';
      const channelName = r?.channel?.name || '-';
      const productId = r?.productId || '-';
      const platform = r?.platform || '-';
      const start = formatDateTime(r?.createdAt || r?.purchaseTime);
      const end = formatDateTime(r?.expiryTime);
      const expiryTime = r?.expiryTime ? new Date(r.expiryTime).getTime() : 0;
      const expired = Boolean(r?.isExpired) || (expiryTime ? expiryTime < Date.now() : false);
      const status = expired ? 'Süresi Dolmuş' : 'Aktif';

      return `
        <tr>
          <td>
            <div class="cell-title">${escapeHtml(userName)}</div>
            <div class="cell-sub">${escapeHtml(userEmail)}</div>
          </td>
          <td>${escapeHtml(channelName)}</td>
          <td>${escapeHtml(productId)}</td>
          <td>${escapeHtml(platform)}</td>
          <td>${escapeHtml(start)}</td>
          <td>${escapeHtml(end)}</td>
          <td><span class="badge ${expired ? 'badge-red' : 'badge-green'}">${escapeHtml(status)}</span></td>
        </tr>
      `;
    })
    .join('');

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Abonelikler</title>
        <style>
          @page { size: A4; margin: 16mm; }
          body { font-family: Arial, sans-serif; color: #111827; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 700; margin: 0; }
          .meta { font-size: 12px; color: #6b7280; line-height: 1.4; }
          .filters { margin-top: 6px; font-size: 12px; color: #374151; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; font-size: 12px; }
          th { background: #f9fafb; text-align: left; font-weight: 700; }
          .cell-title { font-weight: 700; }
          .cell-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-red { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Abonelikler</h1>
            <div class="meta">Oluşturma: ${escapeHtml(generatedAt)}</div>
            <div class="filters"><b>Filtreler:</b> ${safeFilters}</div>
            <div class="meta">Kayıt: ${escapeHtml(rows?.length || 0)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Kanal</th>
              <th>Ürün</th>
              <th>Platform</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows || ''}
          </tbody>
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

const Subscriptions = () => {
  const [filterParams, setFilterParams] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [tableQuery, setTableQuery] = useState('');
  const toast = useToast();

  const {data: channels} = useQuery({
    queryKey: ['channels', 'vip'],
    queryFn: () => api.getVipChannels({limit: 1000}).then(res => res.data.results),
  });

  const handlePlatformFilter = e => {
    const value = e.target.value;
    const newParams = {...filterParams};
    if (value) {
      newParams.platform = value;
    } else {
      delete newParams.platform;
    }
    setFilterParams(newParams);
  };

  const handleChannelFilter = e => {
    const value = e.target.value;
    const newParams = {...filterParams};
    if (value) {
      newParams.channel = value;
    } else {
      delete newParams.channel;
    }
    setFilterParams(newParams);
  };

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const exportFilters = {
        ...filterParams,
        hasChannel: true,
        distinctUser: true,
        activeOnly: true,
      };
      const search = String(tableQuery || '').trim();
      if (search) {
        exportFilters.search = search;
      }
      const rows = await fetchAllPurchases(exportFilters);

      const platformLabel = exportFilters.platform
        ? exportFilters.platform === 'apple'
          ? 'Apple'
          : exportFilters.platform === 'google'
            ? 'Google'
            : String(exportFilters.platform)
        : 'Tümü';

      const selectedChannelLabel = exportFilters.channel
        ? channels?.find(c => String(c.id) === String(exportFilters.channel))?.name ||
          String(exportFilters.channel)
        : 'Tümü';

      const filtersLabel = `Platform: ${platformLabel} | Kanal: ${selectedChannelLabel}${search ? ` | Arama: ${search}` : ''}`;
      const html = buildSubscriptionsPrintHtml({rows, filtersLabel});
      const win = window.open('', '_blank');
      if (!win) {
        toast({
          title: 'PDF açılamadı',
          description: 'Pop-up engellenmiş olabilir. Lütfen izin verip tekrar deneyin.',
          status: 'error',
          position: 'top',
        });
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch (e) {
      toast({
        title: 'PDF dışa aktarma başarısız',
        description: String(e?.message || e),
        status: 'error',
        position: 'top',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      header: 'Kullanıcı',
      accessorKey: 'user',
      cell: ({getValue}) => {
        const value = getValue();
        return (
          <Box>
            <Text fontWeight="bold">{value?.fullname || 'İsimsiz'}</Text>
            <Text fontSize="sm" color="gray.500">
              {value?.email}
            </Text>
          </Box>
        );
      },
    },
    {
      header: 'Kanal',
      accessorKey: 'channel',
      cell: ({getValue}) => {
        const value = getValue();
        return <Text>{value?.name || '-'}</Text>;
      },
    },
    {
      header: 'Ürün',
      accessorKey: 'productId',
      cell: ({getValue}) => <Badge>{getValue()}</Badge>,
    },
    {
      header: 'Platform',
      accessorKey: 'platform',
      cell: ({getValue}) => {
        const value = getValue();
        if (value === 'apple') {
          return (
            <Badge colorScheme="gray" display="flex" alignItems="center" gap={1}>
              <FaApple /> Apple
            </Badge>
          );
        }
        if (value === 'google') {
          return (
            <Badge colorScheme="green" display="flex" alignItems="center" gap={1}>
              <FaGooglePlay /> Google
            </Badge>
          );
        }
        return <Badge>{value}</Badge>;
      },
    },
    {
      header: 'Başlangıç',
      accessorKey: 'purchaseTime',
      cell: ({row}) => {
        const date = row.original.createdAt || row.original.purchaseTime;
        return date ? format(new Date(date), 'dd MMM yyyy HH:mm', {locale: tr}) : '-';
      },
    },
    {
      header: 'Bitiş',
      accessorKey: 'expiryTime',
      cell: ({getValue}) => {
        const value = getValue();
        return value ? format(new Date(value), 'dd MMM yyyy HH:mm', {locale: tr}) : '-';
      },
    },
    {
      header: 'Durum',
      id: 'status',
      cell: ({row}) => {
        const isExpired = row.original.isExpired;
        const expiryTime = new Date(row.original.expiryTime).getTime();
        const now = Date.now();
        const expired = isExpired || expiryTime < now;
        
        return (
          <Badge colorScheme={expired ? 'red' : 'green'}>
            {expired ? 'Süresi Dolmuş' : 'Aktif'}
          </Badge>
        );
      },
    },
  ];

  return (
    <Page title="Abonelikler">
      <HStack mb={4} spacing={4} justify="space-between" flexWrap="wrap">
        <HStack spacing={4} flexWrap="wrap">
          <Select
            placeholder="Tüm Platformlar"
            maxW="200px"
            onChange={handlePlatformFilter}
          >
            <option value="apple">Apple App Store</option>
            <option value="google">Google Play Store</option>
          </Select>
          <Select
            placeholder="Tüm Kanallar"
            maxW="300px"
            onChange={handleChannelFilter}
          >
            {channels?.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </Select>
        </HStack>

        <Button
          leftIcon={isExporting ? <Spinner size="sm" /> : <FiFileText />}
          onClick={handleExportPdf}
          isDisabled={isExporting}
          colorScheme="blue"
          variant="outline"
          size="sm"
        >
          PDF Dışa Aktar
        </Button>
      </HStack>
      <DataTable
        columns={columns}
        fetchData={fetchData}
        filters={filterParams}
        queryEnabled={true}
        onQueryChange={setTableQuery}
        searchPlaceholder="Kullanıcı veya Ürün ID ara..."
      />
    </Page>
  );
};

export default Subscriptions;
