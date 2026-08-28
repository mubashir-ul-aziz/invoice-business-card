/**
 * Sharing helpers for a generated invoice PDF (Screen 19, Section 16/28).
 * Kept separate from `invoicePdfBuilder.ts` so the PDF layer stays a pure
 * renderer with zero knowledge of how its output gets to the user.
 *
 * Two distinct paths, matching what each channel can actually carry:
 *  - `shareInvoicePdfFile` hands the real PDF to the OS share sheet
 *    (`expo-sharing`) — the only cross-platform way to attach a file without
 *    a native module per app (WhatsApp/Mail both accept files offered this
 *    way once the user picks them from the sheet).
 *  - `shareLinkToWhatsApp` / `shareLinkByEmail` open the named app directly
 *    via its URL scheme for a fast, no-attachment "here's the invoice link"
 *    message — no extra dependency needed (`Linking` is built into React
 *    Native), instant, and works even before a PDF has been generated.
 */
import { Linking, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

export async function isFileSharingAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return Sharing.isAvailableAsync();
}

export async function shareInvoicePdfFile(uri: string, dialogTitle: string): Promise<void> {
  const available = await isFileSharingAvailable();
  if (!available) {
    throw new Error('Sharing isn’t supported on this device.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
}

export async function shareLinkToWhatsApp(message: string): Promise<void> {
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('WhatsApp isn’t installed on this device.');
  }
  await Linking.openURL(url);
}

export async function shareLinkByEmail(subject: string, body: string): Promise<void> {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  await Linking.openURL(url);
}
