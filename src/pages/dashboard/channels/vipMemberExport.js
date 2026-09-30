// VIP kanal üyelerinin (Apple/Google abonelik + manuel) toplanması ve
// PDF/Excel export'u için ortak yardımcılar. Tek kanal (EditVipChannel) ve
// tüm kanallar (VipChannels) export'ları bu modülü kullanır.
import JSZip from 'jszip';
import {api} from '../../../api';

const EXPORT_PAGE_LIMIT = 100;

export const SOURCE_FILTER_OPTIONS = [
  {value: 'all', label: 'Tümü', fileSuffix: 'vip-uyeleri'},
  {value: 'subscription', label: 'Abonelik (Apple/Google)', fileSuffix: 'vip-abonelik-uyeleri'},
  {value: 'manual', label: 'Manuel', fileSuffix: 'vip-manuel-uyeleri'},
];

// Bu rollerdeki kullanıcılar "admin" sayılır ve istenirse listelerden çıkarılır.
const ADMIN_ROLES = ['admin', 'channel-admin'];

// channel.admins populate edilmiş ({id, ...}) ya da düz id dizisi olabilir.
export const getChannelAdminIds = admins =>
  new Set(
    (admins || [])
      .map(admin => (admin && typeof admin === 'object' ? admin.id || admin._id : admin))
      .filter(Boolean)
      .map(String),
  );

export const isAdminMember = (member, channelAdminIds) =>
  ADMIN_ROLES.includes(member?.role) ||
  (!!member?.userId && !!channelAdminIds && channelAdminIds.has(String(member.userId)));

export const getSourceFilterOption = value =>
  SOURCE_FILTER_OPTIONS.find(o => o.value === value) || SOURCE_FILTER_OPTIONS[0];

export const MEMBER_EXPORT_HEADERS = [
  '#',
  'Ad Soyad',
  'Email',
  'Kaynak',
  'Platform',
  'Durum',
  'Abonelik Bitiş',
  'Manuel Katılım',
];

export const escapeHtml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatJoinDate = value =>
  value ? new Date(value).toLocaleString('tr-TR') : '-';

export const toSafeFileName = value =>
  String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-');

const fetchAllPages = async fetchPage => {
  const first = await fetchPage(1);
  const all = [...(first?.results || [])];
  const totalPages = first?.totalPages || 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage(page);
    all.push(...(next?.results || []));
  }

  return all;
};

export const fetchAllVipChannels = () =>
  fetchAllPages(page =>
    api
      .getVipChannels({page, limit: EXPORT_PAGE_LIMIT, sortBy: 'name:asc'})
      .then(res => res.data),
  );

const fetchChannelSubscriptions = channelId =>
  fetchAllPages(page =>
    api
      .getPurchases({
        hasChannel: true,
        distinctUser: true,
        activeOnly: true,
        channel: channelId,
        page,
        limit: EXPORT_PAGE_LIMIT,
      })
      .then(res => res.data),
  );

const fetchChannelManualMembers = channelId =>
  fetchAllPages(page =>
    api
      .getVipChannelMembers(channelId, {page, limit: EXPORT_PAGE_LIMIT})
      .then(res => res.data),
  );

// Abonelik ve manuel listeleri kullanıcı bazında tekilleştirir.
export const mergeUnifiedVipMembers = ({subscriptionRows, manualUsers}) => {
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
        role: null,
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
    entry.role = entry.role || user?.role || null;

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
    entry.role = entry.role || user?.role || null;
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

export const fetchUnifiedVipMembers = async channelId => {
  const [subscriptionRows, manualUsers] = await Promise.all([
    fetchChannelSubscriptions(channelId),
    fetchChannelManualMembers(channelId),
  ]);
  return mergeUnifiedVipMembers({subscriptionRows, manualUsers});
};

export const filterUnifiedMembers = (
  members,
  {sourceFilter = 'all', search = '', excludeAdmins = false, channelAdminIds = null} = {},
) => {
  const normalizedSearch = String(search || '').trim().toLowerCase();
  return (members || []).filter(m => {
    if (excludeAdmins && isAdminMember(m, channelAdminIds)) return false;
    if (sourceFilter === 'subscription' && !m?.sources?.subscription) return false;
    if (sourceFilter === 'manual' && !m?.sources?.manual) return false;
    if (!normalizedSearch) return true;
    return `${m?.fullname || ''} ${m?.email || ''}`
      .toLowerCase()
      .includes(normalizedSearch);
  });
};

export const mapUnifiedMemberExportRow = (member, index) => {
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

  return [
    index + 1,
    member.fullname || 'İsimsiz',
    member.email || '-',
    source,
    platform,
    member.status || '-',
    member.expiryTime ? formatJoinDate(member.expiryTime) : '-',
    member.manualJoinDate ? formatJoinDate(member.manualJoinDate) : '-',
  ];
};

// ---- PDF (yazdırma penceresi) ----

export const PDF_TABLE_STYLES = `
  * { box-sizing: border-box; }
  html, body { padding: 0; margin: 0; }
  body { font-family: Arial, sans-serif; color: #111827; padding: 10mm; }
  h1 { font-size: 18px; margin: 0 0 6px 0; }
  h2 { font-size: 14px; margin: 18px 0 6px 0; }
  .meta { margin-bottom: 12px; color: #4b5563; font-size: 11px; line-height: 1.5; }
  .empty { font-size: 11px; color: #6b7280; margin: 0 0 8px 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
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
  h2 { page-break-after: avoid; }
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
  th { background: #f3f4f6; font-weight: 700; }
  @page { size: A4 landscape; margin: 10mm; }
`;

export const renderMembersTableHtml = members => {
  const rows = members
    .map(
      (member, index) =>
        `<tr>${mapUnifiedMemberExportRow(member, index)
          .map(cell => `<td>${escapeHtml(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `
    <table>
      <colgroup>
        <col class="col-index" /><col class="col-name" /><col class="col-email" />
        <col class="col-source" /><col class="col-platform" /><col class="col-status" />
        <col class="col-expiry" /><col class="col-manual" />
      </colgroup>
      <thead>
        <tr>${MEMBER_EXPORT_HEADERS.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

export const writePrintDocument = (exportWindow, {title, bodyHtml}) => {
  exportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>${PDF_TABLE_STYLES}</style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  exportWindow.document.close();
  exportWindow.focus();
  setTimeout(() => {
    exportWindow.print();
  }, 400);
};

// ---- Excel (.xlsx) ----

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

// rows: hücre dizileri. {bold: true, cells: [...]} verilirse satır kalın yazılır.
const createWorksheetXml = rows => {
  const columnWidths = [8, 26, 34, 22, 14, 16, 22, 22];
  const colsXml = columnWidths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join('');

  const normalizedRows = rows.map(row =>
    Array.isArray(row) ? {bold: false, cells: row} : row,
  );
  const maxColumns = Math.max(1, ...normalizedRows.map(r => r.cells.length));

  const rowsXml = normalizedRows
    .map(({bold, cells}, rowIndex) => {
      const style = bold ? ' s="1"' : '';
      const cellsXml = cells
        .map((cell, cellIndex) => {
          const cellRef = `${getExcelColumnName(cellIndex)}${rowIndex + 1}`;
          if (typeof cell === 'number') {
            return `<c r="${cellRef}"${style}><v>${cell}</v></c>`;
          }

          return `<c r="${cellRef}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
            cell,
          )}</t></is></c>`;
        })
        .join('');

      return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
    })
    .join('');

  const lastCellRef = `${getExcelColumnName(maxColumns - 1)}${Math.max(1, rows.length)}`;

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

export const buildXlsxBlob = async (rows, sheetName = 'VIP Uyeleri') => {
  const safeSheetName = escapeXml(String(sheetName).slice(0, 31));
  const now = new Date().toISOString();
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
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
      <vt:lpstr>${safeSheetName}</vt:lpstr>
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
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
  );
  zip.folder('xl').file(
    'workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
  );
  // s="0" normal, s="1" kalın (kanal başlıkları ve tablo başlıkları için)
  zip.folder('xl').file(
    'styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`,
  );
  zip.folder('xl').folder('_rels').file(
    'workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.folder('xl').folder('worksheets').file('sheet1.xml', createWorksheetXml(rows));

  return zip.generateAsync({type: 'blob'});
};
