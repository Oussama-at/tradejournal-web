// Zero-dependency styled Excel export.
// Builds an HTML table with inline styles and saves it as a .xls file, which
// Excel / Google Sheets open with the formatting preserved.

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * exportToExcel({ filename, title, subtitle, columns, rows })
 *  - columns: [{ key, label, align?, format? }]
 *  - rows: array of objects keyed by column.key
 */
export function exportToExcel({ filename = 'export.xls', title = '', subtitle = '', columns = [], rows = [] }) {
  const headBg = '#0b8a4b';
  const headColor = '#ffffff';
  const zebra = '#f3f7f4';
  const border = '#cfd8d2';
  const colCount = columns.length || 1;

  const titleRow = title
    ? `<tr><td colspan="${colCount}" style="background:#06210f;color:#00e676;font-size:20px;font-weight:bold;padding:14px 12px;border:1px solid ${border};">${esc(title)}</td></tr>`
    : '';
  const subRow = subtitle
    ? `<tr><td colspan="${colCount}" style="background:#0d1117;color:#9fb3a8;font-size:12px;padding:8px 12px;border:1px solid ${border};">${esc(subtitle)}</td></tr>`
    : '';

  const headerCells = columns.map(c =>
    `<th style="background:${headBg};color:${headColor};font-weight:bold;font-size:12px;text-align:${c.align || 'left'};padding:10px 12px;border:1px solid ${border};">${esc(c.label)}</th>`
  ).join('');

  const bodyRows = rows.map((row, i) => {
    const bg = i % 2 ? zebra : '#ffffff';
    const cells = columns.map(c => {
      const raw = typeof c.format === 'function' ? c.format(row[c.key], row) : row[c.key];
      return `<td style="background:${bg};color:#1c2b24;font-size:12px;text-align:${c.align || 'left'};padding:8px 12px;border:1px solid ${border};">${esc(raw)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="UTF-8"></head><body>` +
    `<table style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">` +
    titleRow + subRow +
    `<thead><tr>${headerCells}</tr></thead>` +
    `<tbody>${bodyRows}</tbody>` +
    `</table></body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : filename + '.xls';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Helper: standard column set for a list of trades.
export function tradeColumns() {
  return [
    { key: 'date_trade', label: 'Date' },
    { key: 'marcher', label: 'Market' },
    { key: 'type_trd', label: 'Type' },
    { key: 'type_close', label: 'Close' },
    { key: 'point_entree', label: 'Entry', align: 'right' },
    { key: 'point_sortie', label: 'Exit', align: 'right' },
    { key: 'nbr_contrat', label: 'Qty', align: 'right' },
    { key: 'montant', label: 'Amount', align: 'right', format: v => (v === null || v === undefined ? '' : Number(v).toFixed(2)) },
    { key: 'status', label: 'Result' },
    { key: 'sessions', label: 'Session' },
    { key: 'signal', label: 'Signal' },
  ];
}
