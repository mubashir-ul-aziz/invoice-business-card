/**
 * Lightweight RFC4122-ish v4 UUID generator for local entity primary keys
 * (Section 7 uses `text (uuid) PK` throughout). Not cryptographically
 * secure — that's not required for locally-generated record IDs.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
