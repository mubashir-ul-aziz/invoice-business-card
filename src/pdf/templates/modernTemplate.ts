import { colors, statusColors } from '../../app/theme/colors';
import { PdfInvoiceData } from '../types';
import { PDF_BASE_RESET, escapeHtml, escapeMultiline, money, niceDate, prepareLines, statusLabel } from './htmlHelpers';

/**
 * Modern — whitespace-forward layout with a soft accent strip and rounded
 * card sections, for a lighter, more contemporary feel than Classic.
 */
export function renderModernTemplate(data: PdfInvoiceData): string {
  const { business, customer } = data;
  const lines = prepareLines(data.lines, data.currencyCode);
  const status = statusColors[data.status];

  const lineRows = lines
    .map(
      (line, index) => `
        <tr class="${index % 2 === 1 ? 'alt' : ''}">
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
  body { color: ${colors.textPrimary}; font-size: 12px; background: ${colors.surface}; }
  .accent-bar { height: 10px; background: linear-gradient(90deg, ${colors.primary}, ${colors.secondary}); }
  .page { padding: 40px 44px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo { width: 46px; height: 46px; border-radius: 14px; background: ${escapeHtml(business.logoColor) || colors.primary}; color: ${colors.textOnPrimary}; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 700; }
  .brand-name { font-size: 19px; font-weight: 700; color: ${colors.textPrimary}; }
  .brand-meta { font-size: 10.5px; color: ${colors.textSecondary}; margin-top: 3px; line-height: 1.6; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 22px; font-weight: 700; color: ${colors.textPrimary}; }
  .invoice-number { font-size: 12px; color: ${colors.primary}; font-weight: 600; margin-top: 2px; }
  .status-pill { display: inline-block; margin-top: 10px; padding: 5px 14px; border-radius: 999px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${status.bg}; color: ${status.fg}; }

  .info-cards { display: flex; gap: 16px; margin-bottom: 24px; }
  .info-card { flex: 1; background: ${colors.surfaceAlt}; border-radius: 14px; padding: 16px 18px; }
  .info-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: ${colors.textTertiary}; margin-bottom: 6px; }
  .info-value-strong { font-size: 13.5px; font-weight: 700; color: ${colors.textPrimary}; }
  .info-detail { font-size: 10.5px; color: ${colors.textSecondary}; margin-top: 3px; line-height: 1.5; }
  .dates-inline { display: flex; gap: 20px; margin-top: 10px; }
  .date-label { font-size: 9.5px; color: ${colors.textTertiary}; text-transform: uppercase; }
  .date-value { font-size: 11.5px; font-weight: 600; color: ${colors.textPrimary}; margin-top: 1px; }

  table { border-radius: 14px; overflow: hidden; }
  thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textTertiary}; padding: 10px 12px; border-bottom: 2px solid ${colors.border}; }
  thead th.num-cell { text-align: right; }
  .cell { padding: 11px 12px; border-bottom: 1px solid ${colors.border}; font-size: 11.5px; vertical-align: top; }
  tr.alt .cell { background: ${colors.surfaceAlt}; }
  .num-cell { text-align: right; white-space: nowrap; }
  .item-name { font-weight: 600; color: ${colors.textPrimary}; }
  .item-desc { color: ${colors.textSecondary}; font-size: 10.5px; margin-top: 2px; }
  .total-cell { font-weight: 700; }

  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 18px; }
  .summary { width: 270px; background: ${colors.primaryLight}; border-radius: 14px; padding: 16px 18px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11.5px; color: ${colors.primaryDark}; }
  .summary-row.grand { border-top: 1px solid rgba(0,0,0,0.12); margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 700; color: ${colors.primaryDark}; }

  .notes-section { margin-top: 26px; }
  .notes-title { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textTertiary}; margin-bottom: 5px; }
  .notes-body { font-size: 11px; color: ${colors.textSecondary}; line-height: 1.6; }

  .footer { margin-top: 36px; text-align: center; font-size: 10px; color: ${colors.textTertiary}; }
</style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo">${escapeHtml(business.logoInitial)}</div>
        <div>
          <div class="brand-name">${escapeHtml(business.name)}</div>
          <div class="brand-meta">
            ${[business.phone, business.email, business.website].filter(Boolean).map(escapeHtml).join(' &nbsp;·&nbsp; ')}
          </div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-number">${escapeHtml(data.invoiceNumber)}</div>
        <div class="status-pill">${statusLabel(data.status)}</div>
      </div>
    </div>

    <div class="info-cards">
      <div class="info-card">
        <div class="info-label">Billed To</div>
        <div class="info-value-strong">${escapeHtml(customer.name)}</div>
        ${customer.address ? `<div class="info-detail">${escapeMultiline(customer.address)}</div>` : ''}
        ${[customer.phone, customer.email].filter(Boolean).length ? `<div class="info-detail">${[customer.phone, customer.email].filter(Boolean).map(escapeHtml).join(' · ')}</div>` : ''}
      </div>
      <div class="info-card">
        <div class="info-label">Invoice Details</div>
        <div class="dates-inline">
          <div>
            <div class="date-label">Issued</div>
            <div class="date-value">${niceDate(data.issueDate)}</div>
          </div>
          <div>
            <div class="date-label">Due</div>
            <div class="date-value">${niceDate(data.dueDate)}</div>
          </div>
        </div>
        ${data.terms ? `<div class="info-detail" style="margin-top:8px;">Terms: ${escapeHtml(data.terms)}</div>` : ''}
        ${business.taxNumber ? `<div class="info-detail">Tax No. ${escapeHtml(business.taxNumber)}</div>` : ''}
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
        <div class="summary-row" style="font-weight:700;"><span>Balance</span><span>${money(data.total - data.totalPaid, data.currencyCode)}</span></div>` : ''}
      </div>
    </div>

    ${data.notes
      ? `<div class="notes-section"><div class="notes-title">Notes</div><div class="notes-body">${escapeMultiline(data.notes)}</div></div>`
      : ''}

    <div class="footer">${escapeHtml(business.name)} &nbsp;·&nbsp; Thank you for your business</div>
  </div>
</body>
</html>`;
}
