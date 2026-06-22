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
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
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

const sanitizeFileName = value =>
  String(value || 'vip-uye-listesi')
    .split('')
    .filter(char => char.charCodeAt(0) >= 32)
    .join('')
    .replace(/[<>:"/\\|?*]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const formatJoinDate = value =>
  value ? new Date(value).toLocaleString('tr-TR') : '-';

const VipMemberManagement = ({channelId, channelName}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [exportingType, setExportingType] = useState(null);
  const memberLimit = 20;
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [isExportingSubscribersPdf, setIsExportingSubscribersPdf] = useState(false);
  const subscriberLimit = 20;
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [unifiedMembers, setUnifiedMembers] = useState([]);
  const [isUnifiedLoading, setIsUnifiedLoading] = useState(false);
  const [isExportingUnifiedPdf, setIsExportingUnifiedPdf] = useState(false);

  const loadUsers = async query => {
    const {data} = await api.getUsers({query});
    return (data?.results || []).map(user => ({
      label: `${user?.fullname || 'İsimsiz'}${
        user?.email ? ` (${user.email})` : ''
      }`,
      value: user?.id,
    }));
  };

  const {data: members, isFetching: isMembersLoading} = useQuery({
    queryKey: ['vipMembers', channelId, memberSearch, memberPage],
    queryFn: () =>
      api
        .getVipChannelMembers(channelId, {
          search: memberSearch,
          page: memberPage,
          limit: memberLimit,
        })
        .then(res => res.data),
    enabled: false,
  });

  const {data: subscribers, isFetching: isSubscribersLoading} = useQuery({
    queryKey: ['vipSubscribers', channelId, subscriberSearch, subscriberPage],
    queryFn: () =>
      api
        .getPurchases({
          hasChannel: true,
          distinctUser: true,
          activeOnly: true,
          channel: channelId,
          ...(subscriberSearch ? {search: subscriberSearch} : {}),
          page: subscriberPage,
          limit: subscriberLimit,
        })
        .then(res => res.data),
    enabled: false,
  });

  const grantMutation = useMutation({
    mutationFn: userId => api.grantVipMemberAccess(channelId, userId),
    onSuccess: () => {
      setSelectedUser(null);
      setMemberPage(1);
      queryClient.invalidateQueries({queryKey: ['vipMembers', channelId]});
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
      queryClient.invalidateQueries({queryKey: ['vipMembers', channelId]});
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

  const memberResults = members?.results || [];
  const totalResults = members?.totalResults || 0;
  const totalPages = members?.totalPages || 1;
  const subscriberResults = subscribers?.results || [];
  const totalSubscriberResults = subscribers?.totalResults || 0;
  const totalSubscriberPages = subscribers?.totalPages || 1;
  const normalizedUnifiedSearch = String(unifiedSearch || '').trim().toLowerCase();
  const visibleUnifiedMembers = normalizedUnifiedSearch
    ? (unifiedMembers || []).filter(m =>
        `${m?.fullname || ''} ${m?.email || ''}`.toLowerCase().includes(normalizedUnifiedSearch),
      )
    : unifiedMembers || [];

  React.useEffect(() => {
    setMemberPage(1);
  }, [memberSearch, channelId]);

  React.useEffect(() => {
    setSubscriberPage(1);
  }, [subscriberSearch, channelId]);

  const fetchAllSubscribersForExport = async () => {
    const exportLimit = 100;
    const firstResponse = await api
      .getPurchases({
        hasChannel: true,
        distinctUser: true,
        activeOnly: true,
        channel: channelId,
        ...(subscriberSearch ? {search: subscriberSearch} : {}),
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
          ...(subscriberSearch ? {search: subscriberSearch} : {}),
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

  const downloadBlob = (content, mimeType, fileName) => {
    const blob = new Blob([content], {type: mimeType});
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
      const [subscriptionRows, manualUsers] = await Promise.all([
        fetchAllSubscribersForExport(),
        fetchAllMembersForExport(),
      ]);
      const merged = mergeUnifiedVipMembers({subscriptionRows, manualUsers});

      const exportedAt = new Date().toLocaleString('tr-TR');
      const safeChannelName = escapeHtml(channelName || 'VIP Kanal');
      const search = String(unifiedSearch || '').trim().toLowerCase();
      const filtered = search
        ? merged.filter(m =>
            `${m.fullname || ''} ${m.email || ''}`.toLowerCase().includes(search),
          )
        : merged;

      const rows = filtered
        .map((m, index) => {
          const source =
            m.sources.subscription && m.sources.manual
              ? 'Abonelik + Manuel'
              : m.sources.subscription
                ? 'Abonelik'
                : 'Manuel';
          const platform =
            Array.isArray(m.platforms) && m.platforms.length > 0
              ? m.platforms.join(', ')
              : '-';
          const status = m.status || '-';
          const expiry = m.expiryTime ? formatJoinDate(m.expiryTime) : '-';
          const manualJoin = m.manualJoinDate ? formatJoinDate(m.manualJoinDate) : '-';

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(m.fullname || 'İsimsiz')}</td>
              <td>${escapeHtml(m.email || '-')}</td>
              <td>${escapeHtml(source)}</td>
              <td>${escapeHtml(platform)}</td>
              <td>${escapeHtml(status)}</td>
              <td>${escapeHtml(expiry)}</td>
              <td>${escapeHtml(manualJoin)}</td>
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
              body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
              h1 { font-size: 22px; margin: 0 0 8px 0; }
              .meta { margin-bottom: 18px; color: #4b5563; font-size: 13px; }
              table { width: 100%; border-collapse: collapse; table-layout: fixed; }
              th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 12px; word-break: break-word; }
              th { background: #f3f4f6; }
              @page { size: A4 portrait; margin: 14mm; }
            </style>
          </head>
          <body>
            <h1>${safeChannelName} - VIP Üyeleri</h1>
            <div class="meta">
              Toplam uye: ${filtered.length}<br />
              Export tarihi: ${escapeHtml(exportedAt)}<br />
              Arama: ${escapeHtml(unifiedSearch || '') || '-'}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Ad Soyad</th>
                  <th>Email</th>
                  <th style="width: 120px;">Kaynak</th>
                  <th style="width: 90px;">Platform</th>
                  <th style="width: 90px;">Durum</th>
                  <th style="width: 160px;">Abonelik Bitiş</th>
                  <th style="width: 160px;">Manuel Katılım</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
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

  const exportSubscribersAsPdf = async () => {
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

    setIsExportingSubscribersPdf(true);

    try {
      const rows = await fetchAllSubscribersForExport();

      const exportedAt = new Date().toLocaleString('tr-TR');
      const safeChannelName = escapeHtml(channelName || 'VIP Kanal');
      const safeSearch = escapeHtml(subscriberSearch || '');
      const tableRows = rows
        .map((item, index) => {
          const user = item?.user || {};
          const userName = user?.fullname || 'İsimsiz';
          const email = user?.email || '-';
          const platform = item?.platform || '-';
          const start = item?.createdAt || item?.purchaseTime || null;
          const end = item?.expiryTime || null;
          const expiryTime = end ? new Date(end).getTime() : 0;
          const expired =
            Boolean(item?.isExpired) || (expiryTime ? expiryTime < Date.now() : false);
          const status = expired ? 'Süresi Dolmuş' : 'Aktif';

          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(userName)}</td>
              <td>${escapeHtml(email)}</td>
              <td>${escapeHtml(platform)}</td>
              <td>${escapeHtml(formatJoinDate(start))}</td>
              <td>${escapeHtml(formatJoinDate(end))}</td>
              <td>${escapeHtml(status)}</td>
            </tr>
          `;
        })
        .join('');

      exportWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${safeChannelName} - Abonelik Üyeleri</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #111827;
                margin: 24px;
              }
              h1 {
                font-size: 22px;
                margin: 0 0 8px 0;
              }
              .meta {
                margin-bottom: 18px;
                color: #4b5563;
                font-size: 13px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }
              th, td {
                border: 1px solid #d1d5db;
                padding: 8px 10px;
                text-align: left;
                font-size: 12px;
                word-break: break-word;
              }
              th {
                background: #f3f4f6;
              }
              @page {
                size: A4 portrait;
                margin: 14mm;
              }
            </style>
          </head>
          <body>
            <h1>${safeChannelName} - Abonelik Üyeleri</h1>
            <div class="meta">
              Toplam uye: ${rows.length}<br />
              Export tarihi: ${escapeHtml(exportedAt)}<br />
              Arama: ${safeSearch ? safeSearch : '-'}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Ad Soyad</th>
                  <th>Email</th>
                  <th style="width: 90px;">Platform</th>
                  <th style="width: 160px;">Başlangıç</th>
                  <th style="width: 160px;">Bitiş</th>
                  <th style="width: 110px;">Durum</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
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
      setIsExportingSubscribersPdf(false);
    }
  };

  const exportMembersAsPdf = async () => {
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

    setExportingType('pdf');

    try {
      const allMembers = await fetchAllMembersForExport();

      const exportedAt = new Date().toLocaleString('tr-TR');
      const safeChannelName = escapeHtml(channelName || 'VIP Kanal');
      const rows = allMembers
        .map(
          (user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(user.fullname || '-')}</td>
              <td>${escapeHtml(user.email || '-')}</td>
              <td>${escapeHtml(formatJoinDate(user.joinDate))}</td>
            </tr>
          `,
        )
        .join('');

      exportWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${safeChannelName} - VIP Uye Listesi</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #111827;
                margin: 24px;
              }
              h1 {
                font-size: 22px;
                margin: 0 0 8px 0;
              }
              .meta {
                margin-bottom: 18px;
                color: #4b5563;
                font-size: 13px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }
              th, td {
                border: 1px solid #d1d5db;
                padding: 8px 10px;
                text-align: left;
                font-size: 12px;
                word-break: break-word;
              }
              th {
                background: #f3f4f6;
              }
              @page {
                size: A4 portrait;
                margin: 14mm;
              }
            </style>
          </head>
          <body>
            <h1>${safeChannelName} - VIP Uye Listesi</h1>
            <div class="meta">
              Toplam uye: ${allMembers.length}<br />
              Export tarihi: ${escapeHtml(exportedAt)}
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Ad Soyad</th>
                  <th>Email</th>
                  <th style="width: 180px;">Katilma Tarihi</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
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
      setExportingType(null);
    }
  };

  const exportMembersAsCsv = async () => {
    setExportingType('csv');

    try {
      const allMembers = await fetchAllMembersForExport();
      const fileBaseName = sanitizeFileName(
        `${channelName || 'vip-kanal'}-uye-listesi`,
      );
      const csvRows = allMembers.map((user, index) =>
        [
          index + 1,
          user.fullname || '-',
          user.email || '-',
          formatJoinDate(user.joinDate),
        ]
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(';'),
      );

      const csvContent = `\uFEFF"Sira";"Ad Soyad";"Email";"Katilma Tarihi"\n${csvRows.join(
        '\n',
      )}`;

      downloadBlob(
        csvContent,
        'text/csv;charset=utf-8;',
        `${fileBaseName}.csv`,
      );
    } catch (error) {
      handleExportError(error);
    } finally {
      setExportingType(null);
    }
  };

  const exportMembersAsExcel = async () => {
    setExportingType('excel');

    try {
      const allMembers = await fetchAllMembersForExport();
      const fileBaseName = sanitizeFileName(
        `${channelName || 'vip-kanal'}-uye-listesi`,
      );
      const safeChannelName = escapeHtml(channelName || 'VIP Kanal');
      const exportedAt = escapeHtml(new Date().toLocaleString('tr-TR'));
      const rows = allMembers
        .map(
          (user, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(user.fullname || '-')}</td>
              <td>${escapeHtml(user.email || '-')}</td>
              <td>${escapeHtml(formatJoinDate(user.joinDate))}</td>
            </tr>
          `,
        )
        .join('');

      const excelContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8" />
          </head>
          <body>
            <table border="1">
              <tr><th colspan="4">${safeChannelName} - VIP Uye Listesi</th></tr>
              <tr><td colspan="4">Export Tarihi: ${exportedAt}</td></tr>
              <tr>
                <th>Sira</th>
                <th>Ad Soyad</th>
                <th>Email</th>
                <th>Katilma Tarihi</th>
              </tr>
              ${rows}
            </table>
          </body>
        </html>
      `;

      downloadBlob(
        `\uFEFF${excelContent}`,
        'application/vnd.ms-excel;charset=utf-8;',
        `${fileBaseName}.xls`,
      );
    } catch (error) {
      handleExportError(error);
    } finally {
      setExportingType(null);
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
        Apple veya Google dışındaki kullanıcıları bu kanala manuel olarak
        ekleyebilir ya da kaldırabilirsiniz.
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
              isDisabled={isExportingUnifiedPdf || isUnifiedLoading}>
              PDF Export
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
            const canRevoke = !!(m?.sources?.manual && m?.userId);
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
                    onClick={() => revokeMutation.mutate(m.userId)}
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
