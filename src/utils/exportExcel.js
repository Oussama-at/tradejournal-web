// Real .xlsx export (no "format and extension don't match" warning in Excel).
//
// Uses `xlsx-js-style` — a drop-in styled fork of SheetJS — so we get a genuine
// .xlsx file AND keep cell colors / borders. Install it once:
//
//     npm install xlsx-js-style
//
// The public API is unchanged (exportToExcel + tradeColumns), so every existing
// caller keeps working without edits.

import * as XLSX from 'xlsx-js-style';

const BORDER_COLOR = 'CFD8D2';
const thin = { style: 'thin', color: { rgb: BORDER_COLOR } };
const allBorders = { top: thin, bottom: thin, left: thin, right: thin };

const fill = (rgb) => ({ patternType: 'solid', fgColor: { rgb } });

/**
 * exportToExcel({ filename, title, subtitle, columns, rows })
 *  - columns: [{ key, label, align?, format? }]
 *  - rows: array of objects keyed by column.key
 */
export function exportToExcel({ filename = 'export.xlsx', title = '', subtitle = '', columns = [], rows = [] }) {
  const colCount = columns.length || 1;

  const cellValue = (col, row) => {
    const raw = typeof col.format === 'function' ? col.format(row[col.key], row) : row[col.key];
    return raw === null || raw === undefined ? '' : raw;
  };

  // ── Build the sheet data (array of arrays) ──
  const aoa = [];
  const merges = [];
  let cursor = 0;

  const titleRowIdx = title ? cursor++ : -1;
  if (title) {
    aoa.push([title, ...Array(colCount - 1).fill('')]);
    merges.push({ s: { r: titleRowIdx, c: 0 }, e: { r: titleRowIdx, c: colCount - 1 } });
  }

  const subRowIdx = subtitle ? cursor++ : -1;
  if (subtitle) {
    aoa.push([subtitle, ...Array(colCount - 1).fill('')]);
    merges.push({ s: { r: subRowIdx, c: 0 }, e: { r: subRowIdx, c: colCount - 1 } });
  }

  const headerRowIdx = cursor++;
  aoa.push(columns.map(c => c.label));

  const firstDataRow = cursor;
  rows.forEach(row => aoa.push(columns.map(c => cellValue(c, row))));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;

  // Column widths sized to content.
  ws['!cols'] = columns.map(c => {
    const headerLen = String(c.label || '').length;
    const dataLen = rows.reduce((m, row) => Math.max(m, String(cellValue(c, row)).length), 0);
    return { wch: Math.min(45, Math.max(10, headerLen, dataLen) + 2) };
  });
  ws['!rows'] = [];

  const setStyle = (r, c, style) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = style;
  };

  // ── Styling ──
  if (titleRowIdx >= 0) {
    for (let c = 0; c < colCount; c++) {
      setStyle(titleRowIdx, c, {
        fill: fill('06210F'),
        font: { color: { rgb: '00E676' }, bold: true, sz: 16 },
        alignment: { vertical: 'center' },
        border: allBorders,
      });
    }
    ws['!rows'][titleRowIdx] = { hpt: 26 };
  }

  if (subRowIdx >= 0) {
    for (let c = 0; c < colCount; c++) {
      setStyle(subRowIdx, c, {
        fill: fill('0D1117'),
        font: { color: { rgb: '9FB3A8' }, sz: 11 },
        alignment: { vertical: 'center' },
        border: allBorders,
      });
    }
    ws['!rows'][subRowIdx] = { hpt: 18 };
  }

  columns.forEach((col, c) => {
    setStyle(headerRowIdx, c, {
      fill: fill('0B8A4B'),
      font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11 },
      alignment: { horizontal: col.align || 'left', vertical: 'center' },
      border: allBorders,
    });
  });
  ws['!rows'][headerRowIdx] = { hpt: 20 };

  rows.forEach((_, i) => {
    const r = firstDataRow + i;
    const bg = i % 2 ? 'F3F7F4' : 'FFFFFF';
    columns.forEach((col, c) => {
      setStyle(r, c, {
        fill: fill(bg),
        font: { color: { rgb: '1C2B24' }, sz: 11 },
        alignment: { horizontal: col.align || 'left', vertical: 'center' },
        border: allBorders,
      });
    });
  });

  // ── Write a genuine .xlsx (triggers a browser download) ──
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const safeName = String(filename).replace(/\.(xls|xlsx)$/i, '') + '.xlsx';
  XLSX.writeFile(wb, safeName);
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
