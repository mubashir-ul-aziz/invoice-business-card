/**
 * Share-link architecture (Section 22/28).
 *
 * MVP has no server, so a share "link" is a stable, deterministic
 * placeholder built purely from the invoice id — good enough to copy/paste
 * into a message or drop into WhatsApp/email. `isHosted: false` marks that
 * nothing actually resolves this URL yet, so calling UI can be honest about
 * it (e.g. "copy invoice reference" rather than implying a live web page).
 *
 * This is the single place that constructs an invoice share link. When a
 * real link-resolution backend exists later, only this function's body
 * changes — e.g. to call a repository that registers/returns a hosted URL —
 * no caller elsewhere in the app needs to change (same swap-behind-an-
 * interface pattern used for repositories, Section 9).
 */
export interface InvoiceShareLink {
  url: string;
  /** false in MVP: the URL is a local placeholder, not backed by a live server. */
  isHosted: boolean;
}

const LOCAL_SHARE_LINK_BASE = 'https://invora.app/i';

export function buildInvoiceShareLink(invoiceId: string): InvoiceShareLink {
  return {
    url: `${LOCAL_SHARE_LINK_BASE}/${invoiceId}`,
    isHosted: false,
  };
}
