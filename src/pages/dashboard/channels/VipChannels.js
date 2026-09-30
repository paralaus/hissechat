import React, {useState} from 'react';
import {
  Avatar,
  Text,
  Badge,
  Button,
  Checkbox,
  HStack,
  Select,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import {FiUserPlus} from 'react-icons/fi';
import {useNavigate} from 'react-router-dom';
import {saveAs} from 'file-saver';
import {getChannelThumbnail} from '../../../utils/image';
import {getErrorMessage} from '../../../utils/string';
import {DataTable, Page} from '../../../components';
import {routes} from '../../../config/routes';
import {api} from '../../../api';
import AddVipMemberBulkModal from './AddVipMemberBulkModal';
import {
  SOURCE_FILTER_OPTIONS,
  MEMBER_EXPORT_HEADERS,
  getSourceFilterOption,
  getChannelAdminIds,
  escapeHtml,
  fetchAllVipChannels,
  fetchUnifiedVipMembers,
  filterUnifiedMembers,
  mapUnifiedMemberExportRow,
  renderMembersTableHtml,
  writePrintDocument,
  buildXlsxBlob,
} from './vipMemberExport';

const fetchData = async options => {
  const response = await api.getVipChannels(options);
  const data = response.data;
  const channelIds = (data?.results || []).map(channel => channel.id);
  if (channelIds.length === 0) return data;

  // Üye sayısı sütunu, export'taki ("Tümü") tekilleştirilmiş sayıyı gösterir.
  // Sayım alınamazsa liste yine açılır, sütunda "-" görünür.
  let counts = {};
  try {
    counts = (await api.getVipExportMemberCounts(channelIds)).data || {};
  } catch (error) {
    counts = {};
  }

  return {
    ...data,
    results: data.results.map(channel => ({
      ...channel,
      exportMemberCounts: counts[channel.id] || null,
    })),
  };
};

// Aynı anda kaç kanalın üyeleri çekilsin (API'yi boğmamak için sınırlı).
const CHANNEL_FETCH_CONCURRENCY = 3;

// Category labels and colors
const categoryConfig = {
  borsa: {label: 'Borsa', color: 'blue'},
  kripto: {label: 'Kripto', color: 'orange'},
  forex: {label: 'Forex', color: 'green'},
  analiz: {label: 'Analiz', color: 'purple'},
  emtia: {label: 'Emtia', color: 'yellow'},
  other: {label: 'Diğer', color: 'gray'},
};

const VipChannels = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const bulkAddModal = useDisclosure();
  const [sourceFilter, setSourceFilter] = useState('all');
  const [excludeAdmins, setExcludeAdmins] = useState(true);
  const [exporting, setExporting] = useState(null); // 'pdf' | 'xls' | null
  const [progress, setProgress] = useState(null); // {done, total}

  const onRow = async item => {
    navigate(routes.editVipChannels.getPath(item.id));
  };

  // Tüm VIP kanalları ve her kanalın (filtrelenmiş) üyelerini döner.
  const collectAllChannelMembers = async () => {
    const channels = await fetchAllVipChannels();
    const sections = new Array(channels.length);
    let nextIndex = 0;
    let done = 0;
    setProgress({done: 0, total: channels.length});

    const worker = async () => {
      while (nextIndex < channels.length) {
        const index = nextIndex;
        nextIndex += 1;
        const channel = channels[index];
        const members = await fetchUnifiedVipMembers(channel.id);
        sections[index] = {
          channel,
          members: filterUnifiedMembers(members, {
            sourceFilter,
            excludeAdmins,
            channelAdminIds: getChannelAdminIds(channel.admins),
          }),
        };
        done += 1;
        setProgress({done, total: channels.length});
      }
    };

    await Promise.all(
      Array.from({length: Math.min(CHANNEL_FETCH_CONCURRENCY, channels.length)}, worker),
    );

    if (sections.every(s => s.members.length === 0)) {
      throw new Error('export_empty');
    }

    return sections;
  };

  const handleExportError = error => {
    toast({
      title:
        error?.message === 'export_empty'
          ? 'Export edilecek uye bulunamadi'
          : getErrorMessage(error),
      status: error?.message === 'export_empty' ? 'warning' : 'error',
      position: 'top',
    });
  };

  const getSummary = sections => {
    const memberCount = sections.reduce((sum, s) => sum + s.members.length, 0);
    // Birden fazla kanalda olan kişi bir kez sayılır.
    const uniqueCount = new Set(
      sections.flatMap(s => s.members.map(m => m.userId || m.email)),
    ).size;
    return {memberCount, uniqueCount};
  };

  const exportAllAsPdf = async () => {
    const exportWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!exportWindow) {
      toast({
        title: 'PDF penceresi acilamadi',
        description: 'Tarayiciniz popup engelliyor olabilir.',
        status: 'warning',
        position: 'top',
      });
      return;
    }

    setExporting('pdf');
    try {
      const sections = await collectAllChannelMembers();
      const {memberCount, uniqueCount} = getSummary(sections);
      const sourceLabel = getSourceFilterOption(sourceFilter).label;

      const sectionsHtml = sections
        .map(({channel, members}) => {
          const heading = `<h2>${escapeHtml(channel.name || 'VIP Kanal')} (${members.length} üye)</h2>`;
          return members.length > 0
            ? `${heading}${renderMembersTableHtml(members)}`
            : `${heading}<p class="empty">Bu kanalda üye yok.</p>`;
        })
        .join('');

      writePrintDocument(exportWindow, {
        title: 'Tüm VIP Kanallar - Üyeler',
        bodyHtml: `
          <h1>Tüm VIP Kanallar - Üyeler</h1>
          <div class="meta">
            Kanal sayısı: ${sections.length}<br />
            Toplam üyelik: ${memberCount} (${uniqueCount} farklı kişi)<br />
            Kaynak: ${escapeHtml(sourceLabel)}<br />
            Adminler: ${excludeAdmins ? 'Hariç' : 'Dahil'}<br />
            Export tarihi: ${escapeHtml(new Date().toLocaleString('tr-TR'))}
          </div>
          ${sectionsHtml}
        `,
      });
    } catch (error) {
      exportWindow.close();
      handleExportError(error);
    } finally {
      setExporting(null);
      setProgress(null);
    }
  };

  const exportAllAsXls = async () => {
    setExporting('xls');
    try {
      const sections = await collectAllChannelMembers();
      const {memberCount, uniqueCount} = getSummary(sections);
      const sourceOption = getSourceFilterOption(sourceFilter);

      const rows = [
        ['Kanal sayısı', sections.length],
        ['Toplam üyelik', memberCount],
        ['Farklı kişi', uniqueCount],
        ['Kaynak', sourceOption.label],
        ['Adminler', excludeAdmins ? 'Hariç' : 'Dahil'],
        ['Export tarihi', new Date().toLocaleString('tr-TR')],
      ];

      sections.forEach(({channel, members}) => {
        rows.push([]);
        rows.push({
          bold: true,
          cells: [`${channel.name || 'VIP Kanal'} (${members.length} üye)`],
        });
        if (members.length === 0) {
          rows.push(['Bu kanalda üye yok.']);
          return;
        }
        rows.push({bold: true, cells: MEMBER_EXPORT_HEADERS});
        rows.push(...members.map(mapUnifiedMemberExportRow));
      });

      const content = await buildXlsxBlob(rows, 'Tum VIP Kanallar');
      saveAs(content, `tum-kanallar-${sourceOption.fileSuffix}.xlsx`);
    } catch (error) {
      handleExportError(error);
    } finally {
      setExporting(null);
      setProgress(null);
    }
  };

  const progressText = progress ? `Hazırlanıyor ${progress.done}/${progress.total}` : 'Hazırlanıyor';

  return (
    <Page
      action={
        <HStack spacing={3} flexWrap="wrap">
          <Select
            w="220px"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            isDisabled={!!exporting}>
            {SOURCE_FILTER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Checkbox
            isChecked={excludeAdmins}
            onChange={e => setExcludeAdmins(e.target.checked)}
            isDisabled={!!exporting}
            whiteSpace="nowrap">
            Adminleri hariç tut
          </Checkbox>
          <Button
            colorScheme="blue"
            onClick={exportAllAsPdf}
            isLoading={exporting === 'pdf'}
            loadingText={progressText}
            isDisabled={!!exporting}>
            Tüm Kanallar PDF
          </Button>
          <Button
            colorScheme="green"
            variant="outline"
            onClick={exportAllAsXls}
            isLoading={exporting === 'xls'}
            loadingText={progressText}
            isDisabled={!!exporting}>
            Tüm Kanallar Excel
          </Button>
          <Button leftIcon={<FiUserPlus />} colorScheme="purple" onClick={bulkAddModal.onOpen}>
            Kullanıcıyı Toplu Ekle
          </Button>
        </HStack>
      }>
      <AddVipMemberBulkModal isOpen={bulkAddModal.isOpen} onClose={bulkAddModal.onClose} />
      <DataTable
        queryEnabled
        deleteVisible={false}
        onRow={onRow}
        columns={[
          {
            header: 'Logo',
            accessorKey: 'thumbnail',
            cell: ({getValue, row}) => (
              <Avatar
                name={row?.original?.name}
                src={getChannelThumbnail(row.original)}
                size={'sm'}
              />
            ),
          },
          {
            header: 'İsim',
            accessorKey: 'name',
          },
          {
            header: 'Kategori',
            accessorKey: 'category',
            cell: ({getValue}) => {
              const value = getValue();
              const config = categoryConfig[value] || categoryConfig.other;
              return (
                <Badge colorScheme={config.color} variant="subtle">
                  {config.label}
                </Badge>
              );
            },
          },
          {
            header: 'Üye Sayısı',
            accessorKey: 'exportMemberCounts',
            cell: ({getValue}) => {
              const counts = getValue();
              if (!counts) return '-';
              return excludeAdmins ? counts.excludingAdmins : counts.total;
            },
          },
          {
            header: 'Aktiflik',
            accessorKey: 'isActive',
            cell: ({getValue}) => {
              return <Text>{getValue() ? 'Aktif' : 'Pasif'}</Text>;
            },
          },
          {
            header: 'Sıra Katsayısı',
            accessorKey: 'rank',
          },
        ]}
        fetchData={fetchData}
      />
    </Page>
  );
};

export default VipChannels;
