import { colors, statusColors } from '../../app/theme/colors';
import { PdfInvoiceData } from '../types';
import { PDF_BASE_RESET, escapeHtml, escapeMultiline, money, niceDate, prepareLines, statusLabel } from './htmlHelpers';

/**
 * Classic — a traditional letterhead layout: bold header band, business
 * details on the left, invoice meta on the right, single-column line-item
 * table. Closest to a conventional printed invoice.
 */
export function renderClassicTemplate(data: PdfInvoiceData): string {
  const { business, customer } = data;
  const lines = prepareLines(data.lines, data.currencyCode);
  const status = statusColors[data.status];

  const lineRows = lines
    .map(
      (line) => `
        <tr>
          <td class="cell name-cell">
            <div class="item-name">${line.name}</div>
            ${line.description ? `<div class="item-desc">${line.description}</div>` : ''}
          </td>
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
  body { color: ${colors.textPrimary}; font-size: 12px; }
  .page { padding: 40px 44px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${colors.primary}; padding-bottom: 20px; margin-bottom: 24px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo { width: 48px; height: 48px; border-radius: 8px; background: ${escapeHtml(business.logoColor) || colors.primary}; color: ${colors.textOnPrimary}; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
  .brand-name { font-size: 20px; font-weight: 700; color: ${colors.textPrimary}; }
  .brand-meta { font-size: 11px; color: ${colors.textSecondary}; margin-top: 2px; line-height: 1.5; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 26px; font-weight: 700; color: ${colors.primary}; letter-spacing: 1px; text-transform: uppercase; }
  .invoice-number { font-size: 13px; color: ${colors.textSecondary}; margin-top: 4px; }
  .status-pill { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; background: ${status.bg}; color: ${status.fg}; }

  .parties { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .party-block { width: 48%; }
  .party-label { font-size: 10px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: ${colors.textTertiary}; margin-bottom: 6px; }
  .party-name { font-size: 14px; font-weight: 700; color: ${colors.textPrimary}; }
  .party-detail { font-size: 11px; color: ${colors.textSecondary}; margin-top: 2px; line-height: 1.5; }
  .dates-row { display: flex; gap: 32px; margin-top: 10px; }
  .date-item .date-label { font-size: 10px; color: ${colors.textTertiary}; text-transform: uppercase; letter-spacing: 0.4px; }
  .date-item .date-value { font-size: 12px; font-weight: 600; color: ${colors.textPrimary}; margin-top: 2px; }

  table { margin-bottom: 4px; }
  thead th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: ${colors.textOnPrimary}; background: ${colors.primaryDark}; padding: 9px 10px; }
  thead th.num-cell { text-align: right; }
  .cell { padding: 9px 10px; border-bottom: 1px solid ${colors.border}; font-size: 11.5px; vertical-align: top; }
  .num-cell { text-align: right; white-space: nowrap; }
  .item-name { font-weight: 600; color: ${colors.textPrimary}; }
  .item-desc { color: ${colors.textSecondary}; font-size: 10.5px; margin-top: 2px; }
  .total-cell { font-weight: 700; }

  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 14px; }
  .summary { width: 260px; }
  .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: ${colors.textSecondary}; }
  .summary-row.grand { border-top: 2px solid ${colors.primary}; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: ${colors.textPrimary}; }

  .notes-section { margin-top: 28px; display: flex; gap: 24px; }
  .notes-block { flex: 1; }
  .notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: ${colors.textTertiary}; margin-bottom: 4px; }
  .notes-body { font-size: 11px; color: ${colors.textSecondary}; line-height: 1.5; }

  .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid ${colors.border}; text-align: center; font-size: 10px; color: ${colors.textTertiary}; }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo">${escapeHtml(business.logoInitial)}</div>
        <div>
          <div class="brand-name">${escapeHtml(business.name)}</div>
          <div class="brand-meta">
            ${escapeMultiline(business.address)}${business.address ? '<br/>' : ''}
            ${[business.phone, business.email].filter(Boolean).map(escapeHtml).join(' &nbsp;·&nbsp; ')}
            ${business.taxNumber ? `<br/>Tax No. ${escapeHtml(business.taxNumber)}` : ''}
          </div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-number">${escapeHtml(data.invoiceNumber)}</div>
        <div class="status-pill">${statusLabel(data.status)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party-block">
        <div class="party-label">Billed To</div>
        <div class="party-name">${escapeHtml(customer.name)}</div>
        ${customer.address ? `<div class="party-detail">${escapeMultiline(customer.address)}</div>` : ''}
        ${[customer.phone, customer.email].filter(Boolean).length ? `<div class="party-detail">${[customer.phone, customer.email].filter(Boolean).map(escapeHtml).join(' &nbsp;·&nbsp; ')}</div>` : ''}
      </div>
      <div class="party-block" style="text-align:right;">
        <div class="dates-row" style="justify-content:flex-end;">
          <div class="date-item">
            <div class="date-label">Issue Date</div>
            <div class="date-value">${niceDate(data.issueDate)}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Due Date</div>
            <div class="date-value">${niceDate(data.dueDate)}</div>
          </div>
        </div>
        ${data.terms ? `<div class="party-detail" style="margin-top:10px;">Terms: ${escapeHtml(data.terms)}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num-cell">Qty</th>
          <th class="num-cell">Unit Price</th>
          <th class="num-cell">Discount</th>
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

    ${data.notes || data.terms
      ? `<div class="notes-section">
          ${data.notes ? `<div class="notes-block"><div class="notes-title">Notes</div><div class="notes-body">${escapeMultiline(data.notes)}</div></div>` : ''}
        </div>`
      : ''}

    <div class="footer">Thank you for your business — ${escapeHtml(business.name)}</div>
  </div>
</body>
</html>`;
}
