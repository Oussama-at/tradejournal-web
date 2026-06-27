import React from 'react';
import { exportToExcel } from '../utils/exportExcel';

/**
 * Reusable "Export to Excel" button.
 *
 * Props:
 *  - filename, title, subtitle : passed straight to exportToExcel
 *  - columns : [{ key, label, align?, format? }]
 *  - rows    : array of row objects (or a function returning a Promise<rows[]> for async fetch)
 *  - label   : button text (default "Excel")
 *  - className, style : styling overrides
 */
export default function ExportButton({
  filename = 'export.xls',
  title = '',
  subtitle = '',
  columns = [],
  rows = [],
  label = 'Excel',
  className = 'btn btn-ghost',
  style,
  disabled = false,
}) {
  const [busy, setBusy] = React.useState(false);
  const isFn = typeof rows === 'function';
  const count = isFn ? null : (Array.isArray(rows) ? rows.length : 0);
  const nothing = !isFn && count === 0;

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const data = isFn ? (await rows()) : rows;
      const list = Array.isArray(data) ? data : [];
      const sub = subtitle || `${list.length} row${list.length === 1 ? '' : 's'}   Generated: ${new Date().toLocaleString()}`;
      exportToExcel({ filename, title, subtitle: sub, columns, rows: list });
    } catch (e) {
      console.error('Excel export failed', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={disabled || busy || nothing}
      title={nothing ? 'Nothing to export' : 'Export to Excel'}
      onClick={handleClick}
    >
      {busy ? '… Exporting' : `\u2193 ${label}${count ? ` (${count})` : ''}`}
    </button>
  );
}
