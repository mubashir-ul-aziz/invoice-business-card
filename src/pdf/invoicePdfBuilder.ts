/**
 * PDF architecture (Section 28): a pure function of
 * `(Invoice + InvoiceItems + Business + templateId) -> local PDF file`,
 * fully decoupled from the database/UI — every input arrives as a plain
 * domain object already resolved by the caller (Screen 19's store/screen),
 * never fetched from here. Rendering is fully offline via `expo-print`;
 * the resulting file is written to local storage via the new
 * `expo-file-system` File/Directory API (SDK 57) and handed back for
 * `expo-sharing` to share.
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { Directory, File, Paths } from 'expo-file-system';
import { Invoice } from '../features/invoice/domain/entities/Invoice';
import { Business } from '../features/business/domain/entities/Business';
import { Customer } from '../features/customer/domain/entities/Customer';
import { describeInvoiceLineQuantity } from '../core/utils/invoiceCalculations';
import { InvoiceTemplateId, PdfInvoiceData } from './types';
import { resolveInvoiceTemplate } from './templates';

/**
 * Maps saved domain records into the PDF layer's input model. Every value
 * copied here already lives on the Invoice/InvoiceItem (snapshots included)
 * or on Business/Customer — nothing is recalculated, so the PDF can never
 * disagree with the invoice record it renders (historical-integrity rule,
 * Section 7). Callers must not mutate the Invoice to "fix" the PDF; if the
 * PDF looks wrong, the invoice record itself is wrong.
 */
export function toPdfInvoiceData(invoice: Invoice, business: Business, customer: Customer, totalPaid: number): PdfInvoiceData {
  return {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    terms: invoice.terms,
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal,
    taxTotal: invoice.taxTotal,
    total: invoice.total,
    totalPaid,
    currencyCode: business.currencyCode,
    business: {
      name: business.name,
      logoInitial: business.logoInitial,
      logoColor: business.logoColor,
      address: business.address,
      phone: business.phone,
      email: business.email,
      website: business.website,
      taxNumber: business.taxNumber,
    },
    customer: {
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      email: customer.email,
    },
    lines: invoice.items.map((item) => ({
      itemNameSnapshot: item.itemNameSnapshot,
      descriptionSnapshot: item.descriptionSnapshot,
      quantityLabel: describeInvoiceLineQuantity(item),
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      lineTotal: item.lineTotal,
    })),
  };
}

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '-');
}

const INVOICE_PDF_DIRECTORY_NAME = 'invoices';

export interface GeneratedInvoicePdf {
  uri: string;
  fileName: string;
}

/**
 * Renders the given template to a PDF and copies it into a persistent
 * `invoices/` folder under the app's document directory (survives restarts,
 * unlike the cache directory `expo-print` itself writes to) under a
 * human-readable name, e.g. `INV-1042-classic.pdf`.
 */
export async function generateInvoicePdf(data: PdfInvoiceData, templateId: InvoiceTemplateId): Promise<GeneratedInvoicePdf> {
  // expo-print's web implementation opens the browser's print dialog instead
  // of returning a file (no `uri` to copy/share), so on web this would only
  // ever throw a confusing destructuring error. Fail with a clear message
  // instead — this is purely a web-preview limitation (Section 4: web is a
  // verification target, not where PDF/sharing has to work); native iOS/
  // Android builds return a real file and are unaffected.
  if (Platform.OS === 'web') {
    throw new Error('Generating a PDF file isn’t supported in this web preview — open the app on your phone to generate and share PDFs.');
  }
  const template = resolveInvoiceTemplate(templateId);
  const html = template.render(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const fileName = `${sanitizeFileNamePart(data.invoiceNumber)}-${template.id}.pdf`;
  const targetDir = new Directory(Paths.document, INVOICE_PDF_DIRECTORY_NAME);
  targetDir.create({ idempotent: true, intermediates: true });

  const sourceFile = new File(uri);
  const destFile = new File(targetDir, fileName);
  await sourceFile.copy(destFile, { overwrite: true });

  return { uri: destFile.uri, fileName };
}

/**
 * Opens the OS print/preview UI directly from HTML — no file needs to be
 * written first, so this is the cheapest way to satisfy "PDF preview" before
 * the user commits to generating/sharing a file.
 */
export async function previewInvoicePdf(data: PdfInvoiceData, templateId: InvoiceTemplateId): Promise<void> {
  // On web, `Print.printAsync` prints the current browser page rather than
  // the given HTML, which would silently preview the wrong content — fail
  // clearly instead (see the web note on `generateInvoicePdf` above).
  if (Platform.OS === 'web') {
    throw new Error('PDF preview isn’t supported in this web preview — open the app on your phone to preview PDFs.');
  }
  const template = resolveInvoiceTemplate(templateId);
  const html = template.render(data);
  await Print.printAsync({ html });
}
