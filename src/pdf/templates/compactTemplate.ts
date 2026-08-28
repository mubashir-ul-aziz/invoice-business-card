import { colors, statusColors } from '../../app/theme/colors';
import { PdfInvoiceData } from '../types';
import { PDF_BASE_RESET, escapeHtml, escapeMultiline, money, niceDate, prepareLines, statusLabel } from './htmlHelpers';

/**
 * Compact — dense, small-type layout that favors fitting more line items on
 * a single page over decorative spacing. Same data as Classic/Modern, just
 * tighter.
 */
export function renderCompactTemplate(data: PdfInvoiceData): string {
  const { business, customer } = data;
  const lines = prepareLines(data.lines, data.currencyCode);
  const status = statusColors[data.status];

  const lineRows = lines
    .map(
      (line) => `
        <tr>
          <td class="cell name-cell">${line.name}${line.description ? `<span class="item-desc"> — ${line.description}</span>` : ''}</td>
          <td class="cell num-cell">${line.quantityLabel}</td>
          <td class="cell num-cell">${line.unitPriceLabel}</td>
          <td class="cell num-cell">${line.discountLabel}</td>
          <td class="cell num-cell">${line.taxLabel}</td>
          <td class="cell num-cell total-cell">${line.totalLabel}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${PDF_BASE_RESET}
  body { color: ${colors.textPrimary}; font-size: 10.5px; }
  .page { padding: 26px 30px; }

  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${colors.borderStrong}; margin-bottom: 14px; }
  .brand { display: flex; align-items: center; gap: 9px; }
  .logo { width: 30px; height: 30px; border-radius: 6px; background: ${escapeHtml(business.logoColor) || colors.primary}; color: ${colors.textOnPrimary}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .brand-name { font-size: 13.5px; font-weight: 700; color: ${colors.textPrimary}; }
  .brand-meta { font-size: 9px; color: ${colors.textSecondary}; margin-top: 1px; }
  .invoice-meta { text-align: right; }
  .invoice-title-row { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .invoice-title { font-size: 15px; font-weight: 700; color: ${colors.primary}; }
  .invoice-number { font-size: 11px; color: ${colors.textSecondary}; }
  .status-pill { display: inline-block; margin-top: 4px; padding: 2px 9px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; background: ${status.bg}; color: ${status.fg}; }

  .meta-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10px; }
  .meta-block .meta-label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.4px; color: ${colors.textTertiary}; }
  .meta-block .meta-value { font-weight: 600; color: ${colors.textPrimary}; margin-top: 1px; }
  .meta-block .meta-sub { color: ${colors.textSecondary}; margin-top: 1px; }

  thead th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.3px; color: ${colors.textOnPrimary}; background: ${colors.textPrimary}; padding: 6px 8px; }
  thead th.num-cell { text-align: right; }
  .cell { padding: 5px 8px; border-bottom: 1px solid ${colors.border}; font-size: 10px; }
  .num-cell { text-align: right; white-space: nowrap; }
  .name-cell { font-weight: 600; }
  .item-desc { font-weight: 400; color: ${colors.textSecondary}; font-size: 9px; }
  .total-cell { font-weight: 700; }

  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
  .summary { width: 220px; }
  .summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; color: ${colors.textSecondary}; }
  .summary-row.grand { border-top: 1.5px solid ${colors.textPrimary}; margin-top: 4px; padding-top: 5px; font-size: 13px; font-weight: 700; color: ${colors.textPrimary}; }

  .notes-section { margin-top: 14px; font-size: 9.5px; color: ${colors.textSecondary}; line-height: 1.4; }
  .notes-title { font-weight: 700; color: ${colors.textTertiary}; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.3px; margin-bottom: 2px; }

  .footer { margin-top: 20px; text-align: center; font-size: 8.5px; color: ${colors.textTertiary}; }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo">${escapeHtml(business.logoInitial)}</div>
        <div>
          <div class="brand-name">${escapeHtml(business.name)}</div>
          <div class="brand-meta">${[business.phone, business.email].filter(Boolean).map(escapeHtml).join(' · ')}</div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title-row">
          <span class="invoice-title">INVOICE</span>
          <span class="invoice-number">${escapeHtml(data.invoiceNumber)}</span>
        </div>
        <div class="status-pill">${statusLabel(data.status)}</div>
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-block">
        <div class="meta-label">Billed To</div>
        <div class="meta-value">${escapeHtml(customer.name)}</div>
        ${customer.address ? `<div class="meta-sub">${escapeMultiline(customer.address)}</div>` : ''}
      </div>
      <div class="meta-block" style="text-align:right;">
        <div class="meta-label">Issued / Due</div>
        <div class="meta-value">${niceDate(data.issueDate)} → ${niceDate(data.dueDate)}</div>
        ${data.terms ? `<div class="meta-sub">${escapeHtml(data.terms)}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num-cell">Qty</th>
          <th class="num-cell">Price</th>
          <th class="num-cell">Disc.</th>
          <th class="num-cell">Tax</th>
          <th class="num-cell">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <div class="summary-wrap">
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${money(data.subtotal, data.currencyCode)}</span></div>
        <div class="summary-row"><span>Discount</span><span>-${money(data.discountTotal, data.currencyCode)}</span></div>
        <div class="summary-row"><span>Tax</span><span>${money(data.taxTotal, data.currencyCode)}</span></div>
        <div class="summary-row grand"><span>Total Due</span><span>${money(data.total, data.currencyCode)}</span></div>
        ${data.totalPaid > 0 ? `<div class="summary-row"><span>Paid</span><span>-${money(data.totalPaid, data.currencyCode)}</span></div>
        <div class="summary-row" style="font-weight:700;color:${colors.textPrimary};"><span>Balance</span><span>${money(data.total - data.totalPaid, data.currencyCode)}</span></div>` : ''}
      </div>
    </div>

    ${data.notes ? `<div class="notes-section"><div class="notes-title">Notes</div>${escapeMultiline(data.notes)}</div>` : ''}

    <div class="footer">${escapeHtml(business.name)}${business.taxNumber ? ` · Tax No. ${escapeHtml(business.taxNumber)}` : ''}</div>
  </div>
</body>
</html>`;
}
