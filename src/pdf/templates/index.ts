import { InvoiceTemplateDefinition, InvoiceTemplateId } from '../types';
import { renderClassicTemplate } from './classicTemplate';
import { renderModernTemplate } from './modernTemplate';
import { renderCompactTemplate } from './compactTemplate';

/**
 * `templateId -> render function` map (Section 28): adding a template means
 * adding one entry here plus one new file under `templates/` — nothing else
 * in the PDF/sharing layer needs to change.
 */
export const invoiceTemplates: Record<InvoiceTemplateId, InvoiceTemplateDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional letterhead layout with a bold header band.',
    render: renderClassicTemplate,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Whitespace-forward layout with soft rounded sections.',
    render: renderModernTemplate,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Dense, small-type layout that fits more on one page.',
    render: renderCompactTemplate,
  },
};

export const INVOICE_TEMPLATE_LIST: InvoiceTemplateDefinition[] = [
  invoiceTemplates.classic,
  invoiceTemplates.modern,
  invoiceTemplates.compact,
];

export const DEFAULT_INVOICE_TEMPLATE_ID: InvoiceTemplateId = 'classic';

export function resolveInvoiceTemplate(templateId: InvoiceTemplateId | undefined): InvoiceTemplateDefinition {
  return invoiceTemplates[templateId ?? DEFAULT_INVOICE_TEMPLATE_ID] ?? invoiceTemplates[DEFAULT_INVOICE_TEMPLATE_ID];
}

export type { InvoiceTemplateId, InvoiceTemplateDefinition } from '../types';
