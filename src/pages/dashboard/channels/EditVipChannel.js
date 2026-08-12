import React, {useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  Image as ChakraImage,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialog,
  Textarea,
  FormHelperText,
  Switch,
  Select,
  VStack,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import {FiImage, FiUpload} from 'react-icons/fi';
import {useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {useMutation, useQuery} from '@tanstack/react-query';
import * as yup from 'yup';
import {getErrorMessage} from '../../../utils/string';
import {formatDate} from '../../../utils/date';
import useDisclosure from '../../../hooks/useDisclosure';
import {routes} from '../../../config/routes';
import {Condition, ReadOnlyInfo, Page as Layout} from '../../../components';
import {api} from '../../../api';
import {getCombinedLogoUrl} from '../../../utils/image';
import {pick} from '../../../utils/object';
import useFileInput from '../../../hooks/useFileInput';
import {AsyncSelect} from 'chakra-react-select';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';

// Channel categories
const channelCategories = [
  {value: 'borsa', label: 'Borsa'},
  {value: 'kripto', label: 'Kripto'},
  {value: 'forex', label: 'Forex'},
  {value: 'analiz', label: 'Analiz'},
  {value: 'emtia', label: 'Emtia'},
  {value: 'other', label: 'Diğer'},
];

const object = {
  name: yup.string().required('Bu alan zorunludur.'),
  thumbnail: yup.string(),
  category: yup.string().notRequired(),
  about: yup.string().required('Bu alan zorunludur.'),
  admins: yup.array().required('Bu alan zorunludur.'),
  marketCode: yup.string().notRequired(),
  hashtagAliases: yup.string().notRequired(),
  isActive: yup.boolean().notRequired(),
  isFixed: yup.boolean().notRequired(),
  rank: yup.number('Bu alana bir sayı girin.').notRequired(),
  onlyAdminCanPost: yup.boolean().notRequired(),
  subscribeText: yup.string().notRequired(),
};

const schema = yup.object().shape(object);

const parseHashtagAliases = value =>
  Array.from(
    new Set(
      String(value || '')
        .split(/\r?\n|,/)
        .map(item => item.trim().replace(/^#/, ''))
        .filter(Boolean),
    ),
  );

const escapeHtml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatJoinDate = value =>
  value ? new Date(value).toLocaleString('tr-TR') : '-';

const escapeXml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getExcelColumnName = index => {
  let value = index + 1;
  let result = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
};

const createWorksheetXml = rows => {
  const columnWidths = [8, 26, 34, 22, 14, 16, 22, 22];
  const colsXml = columnWidths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join('');

  const rowsXml = rows
    .map((row, rowIndex) => {
      const cellsXml = row
        .map((cell, cellIndex) => {
          const cellRef = `${getExcelColumnName(cellIndex)}${rowIndex + 1}`;
          if (typeof cell === 'number') {
            return `<c r="${cellRef}"><v>${cell}</v></c>`;
          }

          return `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
            cell,
          )}</t></is></c>`;
        })
        .join('');

      return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
    })
    .join('');

  const lastCellRef = `${getExcelColumnName(rows[0].length - 1)}${rows.length}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCellRef}"/>
  <sheetViews>
    <sheetView workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
};

const VipMemberManagement = ({channelId, channelName}) => {
  const toast = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [unifiedMembers, setUnifiedMembers] = useState([]);
  const [isUnifiedLoading, setIsUnifiedLoading] = useState(false);
  const [isExportingUnifiedPdf, setIsExportingUnifiedPdf] = useState(false);
  const [isExportingUnifiedXls, setIsExportingUnifiedXls] = useState(false);

  const loadUsers = async query => {
    const {data} = await api.getUsers({query});
    return (data?.results || []).map(user => ({
      label: `${user?.fullname || 'İsimsiz'}${
        user?.email ? ` (${user.email})` : ''
      }`,
      value: user?.id,
    }));
  };

  const grantMutation = useMutation({
    mutationFn: userId => api.grantVipMemberAccess(channelId, userId),
    onSuccess: () => {
      setSelectedUser(null);
      loadUnifiedVipMembers();
      toast({
        title: 'Kullanıcı VIP kanala eklendi',
        status: 'success',
        position: 'top',
      });
    },
    onError: error => {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: userId => api.revokeVipMemberAccess(channelId, userId),
    onSuccess: () => {
      loadUnifiedVipMembers();
      toast({
        title: 'Kullanıcının VIP kanal erişimi kaldırıldı',
        status: 'success',
        position: 'top',
      });
    },
    onError: error => {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    },
  });

  const addUserByEmail = async () => {
    const normalizedEmail = emailToAdd.trim().toLowerCase();
    if (!normalizedEmail) return;

    try {
      const {data} = await api.getUsers({query: normalizedEmail, limit: 20});
      const matchedUser = (data?.results || []).find(
        user =>
          String(user?.email || '')
            .trim()
            .toLowerCase() === normalizedEmail,
      );

      if (!matchedUser?.id) {
        toast({
          title: 'Bu email ile kullanıcı bulunamadı',
          status: 'warning',
          position: 'top',
        });
        return;
      }

      await grantMutation.mutateAsync(matchedUser.id);
      setEmailToAdd('');
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const normalizedUnifiedSearch = String(unifiedSearch || '').trim().toLowerCase();
  const visibleUnifiedMembers = normalizedUnifiedSearch
    ? (unifiedMembers || []).filter(m =>
        `${m?.fullname || ''} ${m?.email || ''}`.toLowerCase().includes(normalizedUnifiedSearch),
      )
    : unifiedMembers || [];

  const fetchAllSubscribersForExport = async () => {
    const exportLimit = 100;
    const firstResponse = await api
      .getPurchases({
        hasChannel: true,
        distinctUser: true,
        activeOnly: true,
        channel: channelId,
        page: 1,
        limit: exportLimit,
      })
      .then(res => res.data);

    const all = [...(firstResponse?.results || [])];
    const totalPagesForExport = firstResponse?.totalPages || 1;

    for (let page = 2; page <= totalPagesForExport; page += 1) {
      const pageResponse = await api
        .getPurchases({
          hasChannel: true,
          distinctUser: true,
          activeOnly: true,
          channel: channelId,
          page,
          limit: exportLimit,
        })
        .then(res => res.data);

      all.push(...(pageResponse?.results || []));
    }

    if (all.length === 0) {
      throw new Error('export_empty');
    }

    return all;
  };

  const fetchAllMembersForExport = async () => {
    const exportLimit = 100;
    const firstResponse = await api
      .getVipChannelMembers(channelId, {
        page: 1,
        limit: exportLimit,
      })
      .then(res => res.data);

    const allMembers = [...(firstResponse?.results || [])];
    const totalPagesForExport = firstResponse?.totalPages || 1;

    for (let page = 2; page <= totalPagesForExport; page += 1) {
      const pageResponse = await api
        .getVipChannelMembers(channelId, {
          page,
          limit: exportLimit,
        })
        .then(res => res.data);

      allMembers.push(...(pageResponse?.results || []));
    }

    if (allMembers.length === 0) {
      throw new Error('export_empty');
    }

    return allMembers;
  };

  const handleExportError = error => {
    if (error?.message === 'export_empty') {
      toast({
        title: 'Export edilecek uye bulunamadi',
        status: 'warning',
        position: 'top',
      });
      return;
    }

    toast({
      title: getErrorMessage(error),
      status: 'error',
      position: 'top',
    });
  };

  const mergeUnifiedVipMembers = ({subscriptionRows, manualUsers}) => {
    const map = new Map();
    const normalizeEmail = value => String(value || '').trim().toLowerCase();

    const ensure = (userId, email) => {
      const key = userId ? `id:${userId}` : `email:${normalizeEmail(email)}`;
      if (!key || key === 'email:') return null;
      if (!map.has(key)) {
        map.set(key, {
          key,
          userId: userId || null,
          fullname: '',
          email: email || '',
          thumbnail: null,
          sources: {subscription: false, manual: false},
          platforms: new Set(),
          expiryTime: null,
          status: null,
          manualJoinDate: null,
        });
      }
      return map.get(key);
    };

    (subscriptionRows || []).forEach(item => {
      const user = item?.user || {};
      const userId = user?.id || user?._id || null;
      const email = user?.email || '';
      const entry = ensure(userId, email);
      if (!entry) return;

      entry.sources.subscription = true;
      entry.fullname = entry.fullname || user?.fullname || 'İsimsiz';
      entry.email = entry.email || email || '';
      entry.thumbnail = entry.thumbnail || user?.thumbnail || null;

      const platform = item?.platform || null;
      if (platform) entry.platforms.add(String(platform));

      const expiry = item?.expiryTime || null;
      if (expiry) {
        const current = entry.expiryTime ? new Date(entry.expiryTime).getTime() : 0;
        const next = new Date(expiry).getTime();
        if (!current || next > current) entry.expiryTime = expiry;
      }

      const expiryMs = entry.expiryTime ? new Date(entry.expiryTime).getTime() : 0;
      const expired =
        Boolean(item?.isExpired) || (expiryMs ? expiryMs < Date.now() : false);
      entry.status = expired ? 'Süresi Dolmuş' : 'Aktif';
    });

    (manualUsers || []).forEach(user => {
      const userId = user?.id || user?._id || null;
      const email = user?.email || '';
      const entry = ensure(userId, email);
      if (!entry) return;

      entry.sources.manual = true;
      entry.fullname = entry.fullname || user?.fullname || 'İsimsiz';
      entry.email = entry.email || email || '';
      entry.thumbnail = entry.thumbnail || user?.thumbnail || null;
      entry.manualJoinDate = entry.manualJoinDate || user?.joinDate || null;
    });

    const results = Array.from(map.values()).map(entry => ({
      ...entry,
      platforms: Array.from(entry.platforms.values()),
    }));

    results.sort((a, b) =>
      String(a.fullname || '').localeCompare(String(b.fullname || ''), 'tr'),
    );

    return results;
  };

  const loadUnifiedVipMembers = async () => {
    if (!channelId) return;
    setIsUnifiedLoading(true);
    try {
      const [subscriptionRows, manualUsers] = await Promise.all([
        fetchAllSubscribersForExport(),
        fetchAllMembersForExport(),
      ]);
      setUnifiedMembers(
        mergeUnifiedVipMembers({subscriptionRows, manualUsers}),
      );
    } catch (error) {
      handleExportError(error);
    } finally {
      setIsUnifiedLoading(false);
    }
  };

  React.useEffect(() => {
    setUnifiedMembers([]);
    setUnifiedSearch('');
    loadUnifiedVipMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const getUnifiedMembersForExport = async () => {
    const [subscriptionRows, manualUsers] = await Promise.all([
      fetchAllSubscribersForExport(),
      fetchAllMembersForExport(),
    ]);

    const merged = mergeUnifiedVipMembers({subscriptionRows, manualUsers});
    const search = String(unifiedSearch || '').trim().toLowerCase();

    return search
      ? merged.filter(m =>
          `${m.fullname || ''} ${m.email || ''}`.toLowerCase().includes(search),
        )
      : merged;
  };

  const mapUnifiedMemberExportRow = (member, index) => {
    const source =
      member.sources.subscription && member.sources.manual
        ? 'Abonelik + Manuel'
        : member.sources.subscription
          ? 'Abonelik'
          : 'Manuel';
    const platform =
      Array.isArray(member.platforms) && member.platforms.length > 0
        ? member.platforms.join(', ')
        : '-';

    return {
      index: index + 1,
      fullname: member.fullname || 'İsimsiz',
      email: member.email || '-',
      source,
      platform,
      status: member.status || '-',
      expiry: member.expiryTime ? formatJoinDate(member.expiryTime) : '-',
      manualJoin: member.manualJoinDate ? formatJoinDate(member.manualJoinDate) : '-',
    };
  };

  const exportUnifiedMembersAsPdf = async () => {
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

    setIsExportingUnifiedPdf(true);
    try {
      const filteredMembers = await getUnifiedMembersForExport();
      const exportedAt = new Date().toLocaleString('tr-TR');
      const safeChannelName = escapeHtml(channelName || 'VIP Kanal');

      const rows = filteredMembers
        .map((member, index) => {
          const row = mapUnifiedMemberExportRow(member, index);
          return `
            <tr>
              <td>${row.index}</td>
              <td>${escapeHtml(row.fullname)}</td>
              <td>${escapeHtml(row.email)}</td>
              <td>${escapeHtml(row.source)}</td>
              <td>${escapeHtml(row.platform)}</td>
              <td>${escapeHtml(row.status)}</td>
              <td>${escapeHtml(row.expiry)}</td>
              <td>${escapeHtml(row.manualJoin)}</td>
            </tr>
          `;
        })
        .join('');

      exportWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${safeChannelName} - VIP Üyeleri</title>
            <style>
              * { box-sizing: border-box; }
              html, body { padding: 0; margin: 0; }
              body { font-family: Arial, sans-serif; color: #111827; padding: 10mm; }
              h1 { font-size: 18px; margin: 0 0 6px 0; }
              .meta { margin-bottom: 12px; color: #4b5563; font-size: 11px; line-height: 1.5; }
              .table-wrap { width: 100%; }
              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }
              col.col-index { width: 12mm; }
              col.col-name { width: 42mm; }
              col.col-email { width: 56mm; }
              col.col-source { width: 28mm; }
              col.col-platform { width: 20mm; }
              col.col-status { width: 22mm; }
              col.col-expiry { width: 40mm; }
              col.col-manual { width: 40mm; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
              th, td {
                border: 1px solid #d1d5db;
                padding: 5px 6px;
                text-align: left;
                vertical-align: top;
                font-size: 10px;
                line-height: 1.3;
                white-space: normal;
                overflow-wrap: anywhere;
                word-break: break-word;
              }
              th {
                background: #f3f4f6;
                font-weight: 700;
              }
              @page { size: A4 landscape; margin: 10mm; }
            </style>
          </head>
          <body>
            <h1>${safeChannelName} - VIP Üyeleri</h1>
            <div class="meta">
              Toplam uye: ${filteredMembers.length}<br />
              Export tarihi: ${escapeHtml(exportedAt)}<br />
              Arama: ${escapeHtml(unifiedSearch || '') || '-'}
            </div>
            <div class="table-wrap">
            <table>
              <colgroup>
                <col class="col-index" />
                <col class="col-name" />
                <col class="col-email" />
                <col class="col-source" />
                <col class="col-platform" />
                <col class="col-status" />
                <col class="col-expiry" />
                <col class="col-manual" />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ad Soyad</th>
                  <th>Email</th>
                  <th>Kaynak</th>
                  <th>Platform</th>
                  <th>Durum</th>
                  <th>Abonelik Bitiş</th>
                  <th>Manuel Katılım</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            </div>
          </body>
        </html>
      `);
      exportWindow.document.close();
      exportWindow.focus();
      setTimeout(() => {
        exportWindow.print();
      }, 400);
    } catch (error) {
      exportWindow.close();
      handleExportError(error);
    } finally {
      setIsExportingUnifiedPdf(false);
    }
  };

  const exportUnifiedMembersAsXls = async () => {
    setIsExportingUnifiedXls(true);
    try {
      const filteredMembers = await getUnifiedMembersForExport();
      const exportedAt = new Date().toLocaleString('tr-TR');
      const safeFileName = String(channelName || 'vip-uyeleri')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-');

      const worksheetRows = [
        ['Kanal', channelName || 'VIP Kanal'],
        ['Toplam uye', filteredMembers.length],
        ['Export tarihi', exportedAt],
        ['Arama', unifiedSearch || '-'],
        [],
        [
          '#',
          'Ad Soyad',
          'Email',
          'Kaynak',
          'Platform',
          'Durum',
          'Abonelik Bitiş',
          'Manuel Katılım',
        ],
        ...filteredMembers.map((member, index) => {
          const row = mapUnifiedMemberExportRow(member, index);
          return [
            row.index,
            row.fullname,
            row.email,
            row.source,
            row.platform,
            row.status,
            row.expiry,
            row.manualJoin,
          ];
        }),
      ];

      const zip = new JSZip();
      zip.file(
        '[Content_Types].xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
      );
      zip.folder('_rels').file(
        '.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
      );
      zip.folder('docProps').file(
        'app.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Trae</Application>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>VIP Uyeleri</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
</Properties>`,
      );
      zip.folder('docProps').file(
        'core.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Trae</dc:creator>
  <cp:lastModifiedBy>Trae</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`,
      );
      zip.folder('xl').file(
        'workbook.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="VIP Uyeleri" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
      );
      zip.folder('xl').folder('_rels').file(
        'workbook.xml.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
      );
      zip
        .folder('xl')
        .folder('worksheets')
        .file('sheet1.xml', createWorksheetXml(worksheetRows));

      const content = await zip.generateAsync({type: 'blob'});
      saveAs(content, `${safeFileName || 'vip-uyeleri'}-vip-uyeleri.xlsx`);
    } catch (error) {
      handleExportError(error);
    } finally {
      setIsExportingUnifiedXls(false);
    }
  };

  return (
    <Box mt={8} bg="gray.50" p={4} borderRadius="md">
      <Flex align="center" gap={3} mb={2}>
        <Text fontSize="lg" fontWeight="bold">
          VIP Üyelik Yönetimi
        </Text>
        <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
          Sadece VIP
        </Badge>
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={4}>
        Abonelik ve manuel üyelikler tekilleştirilmiş listede birleştirilir.
        Kullanıcıları bu kanala manuel olarak ekleyebilir; hem manuel hem de
        Apple/Google abonelik üyelerini kaldırabilirsiniz (abonelik üyeleri
        kaldırıldığında altındaki satın alma kaydı da sona erdirilir).
      </Text>

      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={4}>
        <Text fontWeight="bold" mb={3}>
          Kullanıcı Ekle
        </Text>
        <Flex
          gap={3}
          direction={{base: 'column', md: 'row'}}
          align={{base: 'stretch', md: 'center'}}>
          <Box flex="1">
            <AsyncSelect
              value={selectedUser}
              onChange={val => setSelectedUser(val || null)}
              placeholder="Kullanıcı seçin (isim veya email ile arayın)"
              loadOptions={loadUsers}
              cacheOptions
              defaultOptions
            />
          </Box>
          <Button
            colorScheme="green"
            onClick={() =>
              selectedUser?.value && grantMutation.mutate(selectedUser.value)
            }
            isDisabled={!selectedUser?.value}
            isLoading={grantMutation.isPending}>
            Kullanıcı Ekle
          </Button>
        </Flex>
        <Text fontSize="xs" color="gray.500" mt={2}>
          Bu alan sadece VIP kanallarda görünür ve kullanıcıyı doğrudan kanal
          üyeliğine ekler.
        </Text>
      </Box>

      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={4}>
        <Text fontWeight="bold" mb={3}>
          Email ile Direkt Ekle
        </Text>
        <Flex
          gap={3}
          direction={{base: 'column', md: 'row'}}
          align={{base: 'stretch', md: 'center'}}>
          <Input
            flex="1"
            placeholder="ornek@email.com"
            value={emailToAdd}
            onChange={e => setEmailToAdd(e.target.value)}
          />
          <Button
            colorScheme="purple"
            onClick={addUserByEmail}
            isDisabled={!emailToAdd.trim()}
            isLoading={grantMutation.isPending}>
            Email ile Ekle
          </Button>
        </Flex>
        <Text fontSize="xs" color="gray.500" mt={2}>
          Kullanıcı sistemde kayıtlıysa email ile bulunur ve VIP kanala eklenir.
        </Text>
      </Box>

      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={4}>
        <Flex
          justify="space-between"
          align={{base: 'stretch', md: 'center'}}
          direction={{base: 'column', md: 'row'}}
          mb={4}
          gap={3}>
          <Box>
            <Text fontWeight="bold">
              VIP Üyeleri (Tekilleştirilmiş) ({visibleUnifiedMembers.length}
              {normalizedUnifiedSearch ? ` / ${unifiedMembers.length}` : ''})
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Abonelik + manuel listeler birleştirilir; eşleşen kullanıcı tek satır görünür.
            </Text>
          </Box>
          <Flex gap={3} direction={{base: 'column', md: 'row'}}>
            <Input
              maxW={{base: '100%', md: '280px'}}
              placeholder="Üye ara"
              value={unifiedSearch}
              onChange={e => setUnifiedSearch(e.target.value)}
            />
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={loadUnifiedVipMembers}
              isLoading={isUnifiedLoading}
              isDisabled={isUnifiedLoading}>
              Yenile
            </Button>
            <Button
              colorScheme="blue"
              variant="solid"
              onClick={exportUnifiedMembersAsPdf}
              isLoading={isExportingUnifiedPdf}
              isDisabled={
                isExportingUnifiedPdf || isExportingUnifiedXls || isUnifiedLoading
              }>
              PDF Export
            </Button>
            <Button
              colorScheme="green"
              variant="outline"
              onClick={exportUnifiedMembersAsXls}
              isLoading={isExportingUnifiedXls}
              isDisabled={
                isExportingUnifiedPdf || isExportingUnifiedXls || isUnifiedLoading
              }>
              Excel Export
            </Button>
          </Flex>
        </Flex>
        <VStack align="stretch" spacing={2} maxH="520px" overflowY="auto">
          {!isUnifiedLoading && visibleUnifiedMembers.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              Üye bulunamadı.
            </Text>
          )}
          {visibleUnifiedMembers.map(m => {
            const canRevoke = !!m?.userId;
            const platforms =
              Array.isArray(m?.platforms) && m.platforms.length > 0
                ? m.platforms
                : [];
            const hasSubscription = !!m?.sources?.subscription;
            const hasManual = !!m?.sources?.manual;

            return (
              <Flex
                key={m.key}
                align="center"
                justify="space-between"
                p={2}
                borderBottom="1px solid #eee">
                <Flex align="center">
                  <Avatar
                    src={getCombinedLogoUrl(m.thumbnail)}
                    name={m.fullname}
                    size="sm"
                    mr={2}
                  />
                  <Box>
                    <HStack spacing={2} flexWrap="wrap">
                      <Text fontSize="sm" fontWeight="medium">
                        {m.fullname || 'İsimsiz'}
                      </Text>
                      {hasManual && (
                        <Badge colorScheme="purple" variant="subtle">
                          Manuel
                        </Badge>
                      )}
                      {hasSubscription && (
                        <Badge colorScheme="blue" variant="subtle">
                          Abonelik
                        </Badge>
                      )}
                      {platforms.map(p => (
                        <Badge
                          key={`${m.key}-${p}`}
                          colorScheme={p === 'google' ? 'green' : p === 'apple' ? 'gray' : 'blue'}>
                          {p}
                        </Badge>
                      ))}
                      {hasSubscription && (
                        <Badge colorScheme={m.status === 'Aktif' ? 'green' : 'red'}>
                          {m.status || '-'}
                        </Badge>
                      )}
                    </HStack>
                    {!!m.email && (
                      <Text fontSize="xs" color="gray.500">
                        {m.email}
                      </Text>
                    )}
                    {(m.expiryTime || m.manualJoinDate) && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {m.expiryTime ? `Bitiş: ${formatJoinDate(m.expiryTime)}` : ''}
                        {m.expiryTime && m.manualJoinDate ? ' • ' : ''}
                        {m.manualJoinDate ? `Manuel: ${formatJoinDate(m.manualJoinDate)}` : ''}
                      </Text>
                    )}
                  </Box>
                </Flex>
                {canRevoke && (
                  <Button
                    size="xs"
                    colorScheme="red"
                    onClick={() => {
                      const warning = hasSubscription
                        ? `${m.fullname || 'Bu kullanıcı'} aktif bir abonelikle bu kanalda. Kaldırırsanız aboneliği de sona erdirilir (aksi halde bir sonraki senkronizasyonda otomatik geri eklenir). Devam edilsin mi?`
                        : `${m.fullname || 'Bu kullanıcı'} kanaldan kaldırılsın mı?`;
                      if (window.confirm(warning)) {
                        revokeMutation.mutate(m.userId);
                      }
                    }}
                    isLoading={revokeMutation.isPending}>
                    Kaldır
                  </Button>
                )}
              </Flex>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
};

const EditVipChannel = ({id}) => {
  const isNew = !id || id === 'new';
  const toast = useToast();
  const deleteModal = useDisclosure();
  const cancelRef = useRef();
  const navigate = useNavigate();
  const {
    input,
    open,
    objectUrl,
    reset: resetFile,
    upload,
    isUploading,
  } = useFileInput();
  const {
    register,
    handleSubmit,
    getValues,
    formState: {errors},
    reset,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {mutateAsync, isPending} = useMutation({
    mutationFn: values =>
      isNew ? api.createVipChannel(values) : api.updateChannel(id, values),
  });

  const {mutateAsync: deleteItem, isPending: isDeleting} = useMutation({
    mutationFn: () => api.deleteChannel(id),
  });

  const {data} = useQuery({
    enabled: !isNew,
    queryKey: ['channel', id],
    queryFn: () =>
      api
        .getChannel(id)
        .then(res => res.data)
        .then(values => {
          const data = pick(values, Object.keys(object));
          data.admins = values?.admins?.map(item => item?.id);
          data.hashtagAliases = Array.isArray(values?.hashtagAliases)
            ? values.hashtagAliases.join('\n')
            : '';
          reset(data);
          return values;
        }),
  });

  const onSubmit = async values => {
    try {
      const payload = {
        ...values,
        hashtagAliases: parseHashtagAliases(values?.hashtagAliases),
      };

      if (objectUrl) {
        const url = await upload();
        if (url) payload.thumbnail = url;
      }

      const {data} = await mutateAsync(payload);
      if (data) {
        toast({
          title: 'Bilgiler kaydedildi.',
          status: 'success',
          position: 'top',
        });
      }
      navigate(routes.vipChannels.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const onDelete = async () => {
    try {
      await deleteItem();
      toast({
        title: 'Başarıyla silindi.',
        status: 'success',
        position: 'top',
      });
      navigate(routes.vipChannels.path);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
      });
    }
  };

  const loadUsers = async query => {
    const {data} = await api.getUsers({query});
    return data?.results?.map(user => ({
      label: user?.fullname,
      value: user?.id,
    }));
  };

  return (
    <Layout>
      <Box
        bg={'white'}
        overflow={'scroll'}
        borderRadius={'md'}
        display={'flex'}
        flexDirection={'column'}
        boxShadow={'md'}
        p={'4'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex
            zIndex="2"
            direction="column"
            maxW="100%"
            background="transparent"
            borderRadius="md"
            me="auto">
            <Box
              display={'flex'}
              flexDirection="column"
              alignItems="center"
              mb="6">
              {/* Thumbnail Upload Area */}
              <Box
                onClick={() => open()}
                cursor="pointer"
                borderRadius="xl"
                border="2px dashed"
                borderColor={
                  objectUrl || getValues('thumbnail')?.length > 0
                    ? 'transparent'
                    : 'gray.300'
                }
                bg={
                  objectUrl || getValues('thumbnail')?.length > 0
                    ? 'transparent'
                    : 'gray.50'
                }
                p={objectUrl || getValues('thumbnail')?.length > 0 ? '0' : '8'}
                minH="150px"
                minW="150px"
                maxW="200px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
                _hover={{
                  borderColor: 'brand.400',
                  bg:
                    objectUrl || getValues('thumbnail')?.length > 0
                      ? 'transparent'
                      : 'brand.50',
                }}
                position="relative"
                overflow="hidden">
                {objectUrl || getValues('thumbnail')?.length > 0 ? (
                  <ChakraImage
                    src={
                      objectUrl || getCombinedLogoUrl(getValues('thumbnail'))
                    }
                    alt="Thumbnail"
                    maxH="150px"
                    objectFit="contain"
                    borderRadius="lg"
                  />
                ) : (
                  <VStack spacing="3">
                    <Box p="4" bg="gray.100" borderRadius="full">
                      <Icon as={FiImage} boxSize="8" color="gray.400" />
                    </Box>
                    <VStack spacing="1">
                      <Text fontSize="sm" fontWeight="medium" color="gray.600">
                        Görsel Yükle
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Tıklayarak görsel seçin
                      </Text>
                    </VStack>
                    <Icon as={FiUpload} boxSize="4" color="gray.400" />
                  </VStack>
                )}
              </Box>
              {input}
              <Input type={'hidden'} {...register('thumbnail')} />
              {(objectUrl || getValues('thumbnail')?.length > 0) && (
                <Button
                  mt="3"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={e => {
                    e.stopPropagation();
                    setValue('thumbnail', '');
                    trigger('thumbnail');
                    resetFile();
                  }}>
                  Kaldır
                </Button>
              )}
            </Box>
            <FormControl isInvalid={!!errors.name} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                İsim
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.name}
                {...register('name')}
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.category} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kategori
              </FormLabel>
              <Select
                fontSize="sm"
                fontWeight="500"
                size="md"
                placeholder="Kategori seçin"
                defaultValue={data?.category}
                {...register('category')}>
                {channelCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Kanalın kategorisi - mobil uygulamada filtreleme için
                kullanılır.
              </FormHelperText>
              <FormErrorMessage>{errors.category?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.about} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hakkında
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                defaultValue={data?.about}
                {...register('about')}
              />
              <FormHelperText>Kanal detay sayfasında görünür.</FormHelperText>
              <FormErrorMessage>{errors.about?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.admins} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Kanal Adminleri
              </FormLabel>
              <AsyncSelect
                {...register('admins')}
                key={(data?.admins || []).map(item => item?.id).join(',')}
                onChange={val =>
                  setValue(
                    'admins',
                    val?.map(item => item?.value),
                    {shouldDirty: true},
                  )
                }
                placeholder="Kullanıcı seçin (Filtrelemek için ismini yazın)"
                loadOptions={loadUsers}
                fontSize="sm"
                fontWeight="500"
                size="md"
                isMulti
                bg={'red'}
                colorScheme={'white'}
                defaultValue={data?.admins?.map(item => ({
                  label: item?.fullname,
                  value: item?.id,
                }))}
              />
              <FormErrorMessage>{errors.admins?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.marketCode} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Piyasa Kodu (Opsiyonel)
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.marketCode}
                {...register('marketCode')}
              />
              <FormErrorMessage>{errors.marketCode?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.hashtagAliases} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Hashtag Aliaslari
              </FormLabel>
              <Textarea
                fontSize="sm"
                fontWeight="500"
                size="md"
                rows={4}
                placeholder={'odas\nhissechat\n#gokhanbilik1'}
                defaultValue={Array.isArray(data?.hashtagAliases) ? data.hashtagAliases.join('\n') : ''}
                {...register('hashtagAliases')}
              />
              <FormHelperText>
                Her satira bir alias yazin. `#` ile ya da `#` olmadan girebilirsiniz.
              </FormHelperText>
              <FormErrorMessage>{errors.hashtagAliases?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.rank} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Sıra Katsayısı
              </FormLabel>
              <Input
                fontSize="sm"
                type="number"
                fontWeight="500"
                size="md"
                defaultValue={data?.rank || 0}
                {...register('rank')}
              />
              <FormHelperText>
                Sayı ne kadar yüksek olursa kanal listesinde o kadar üstte
                görünür.
              </FormHelperText>
              <FormErrorMessage>{errors.rank?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.subscribeText} mb="4">
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                mb="8px">
                Abone Ol Yazısı
              </FormLabel>
              <Input
                fontSize="sm"
                type="text"
                fontWeight="500"
                size="md"
                defaultValue={data?.subscribeText}
                {...register('subscribeText')}
              />
              <FormHelperText>
                Abonelik satın alma sayfasında görünür.
              </FormHelperText>
              <FormErrorMessage>
                {errors.subscribeText?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isActive}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isActive" mb={0}>
                  Aktiflik
                </FormLabel>
                <Switch
                  key={data?.isActive}
                  id="isActive"
                  defaultChecked={data?.isActive}
                  {...register('isActive')}
                />
              </Box>
              <FormHelperText>
                Aktif olmayan kanallar listelenmez.
              </FormHelperText>
              <FormErrorMessage>{errors.isActive?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.isFixed}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="isFixed" mb={0}>
                  Sabitlenmiş Kanal
                </FormLabel>
                <Switch
                  key={data?.isFixed}
                  id="isFixed"
                  defaultChecked={data?.isFixed}
                  {...register('isFixed')}
                />
              </Box>
              <FormHelperText>
                Sabitlenmiş kanallar her zaman en üstte görünür.
              </FormHelperText>
              <FormErrorMessage>{errors.isFixed?.message}</FormErrorMessage>
            </FormControl>
            <FormControl
              display="flex"
              alignItems="start"
              flexDirection={'column'}
              isInvalid={!!errors.onlyAdminCanPost}
              mb="4">
              <Box display={'flex'} alignItems={'center'}>
                <FormLabel htmlFor="onlyAdminCanPost" mb={0}>
                  Sadece Admin Mesaj Gönderebilir
                </FormLabel>
                <Switch
                  key={data?.onlyAdminCanPost}
                  id="onlyAdminCanPost"
                  defaultChecked={data?.onlyAdminCanPost}
                  {...register('onlyAdminCanPost')}
                />
              </Box>
              <FormErrorMessage>
                {errors.onlyAdminCanPost?.message}
              </FormErrorMessage>
            </FormControl>
            <Condition condition={!isNew}>
              <ReadOnlyInfo
                label={'Kayıt Tarihi'}
                value={formatDate(data?.createdAt)}
              />
              <ReadOnlyInfo
                label={'Son Güncellenme Tarihi'}
                value={formatDate(data?.updatedAt)}
              />
            </Condition>
            <Button
              isLoading={isPending || isUploading}
              colorScheme={'primary'}
              isDisabled={isPending || isUploading}
              type="submit"
              fontSize={'sm'}>
              Kaydet
            </Button>
          </Flex>
        </form>
      </Box>
      {!isNew && (
        <VipMemberManagement channelId={id} channelName={data?.name} />
      )}
      <Box display={'flex'} justifyContent={'end'}>
        <Button
          isLoading={isDeleting}
          colorScheme={'red'}
          isDisabled={isDeleting}
          type="button"
          my={'4'}
          onClick={deleteModal.open}
          fontSize={'sm'}>
          Sil
        </Button>
      </Box>
      <AlertDialog
        closeOnOverlayClick
        closeOnEsc
        leastDestructiveRef={cancelRef}
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Emin misiniz?
            </AlertDialogHeader>
            <AlertDialogBody>Silmek istediğinize emin misiniz?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteModal.close}>
                Vazgeç
              </Button>
              <Button
                colorScheme="red"
                onClick={onDelete}
                ml={3}
                isLoading={isDeleting}
                disabled={isDeleting}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
};

const Page = () => {
  const {id} = useParams();
  return <EditVipChannel key={id} id={id} />;
};

export default Page;
