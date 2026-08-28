import { BusinessCardPayload } from '../entities/BusinessCardPayload';

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/**
 * Encodes a `BusinessCardPayload` as a vCard 3.0 text blob — the QR payload
 * per Section 30 option (a): a scannable contact card that requires no
 * server or share-link, so the QR screen works fully offline.
 */
export function encodeBusinessCardVCard(payload: BusinessCardPayload): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(payload.name)}`,
    `ORG:${escapeVCardValue(payload.name)}`,
  ];

  if (payload.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardValue(payload.phone)}`);
  if (payload.email) lines.push(`EMAIL:${escapeVCardValue(payload.email)}`);
  if (payload.website) lines.push(`URL:${escapeVCardValue(payload.website)}`);
  if (payload.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(payload.address)};;;;`);

  payload.socialLinks.forEach((link) => {
    lines.push(`URL;TYPE=${escapeVCardValue(link.platform.toUpperCase())}:${escapeVCardValue(link.url)}`);
  });

  lines.push('END:VCARD');
  return lines.join('\n');
}
