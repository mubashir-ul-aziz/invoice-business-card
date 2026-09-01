/**
 * Thin wrapper over the Google Drive v3 REST API (Section 13) — plain
 * `fetch`, no Drive SDK, since only 4 operations are ever needed. Every
 * method throws a plain `Error` with a Drive-API-derived message on
 * failure; `googleDriveBackupRepository.ts` is the only caller and is
 * responsible for turning that into a typed `Failure` (Section 31).
 *
 * Uploads use Drive's single-request multipart upload, not the resumable
 * upload protocol — for a JSON snapshot well under the multipart size
 * limit, that means a backup either lands as one complete file or Drive
 * never creates it at all, which is exactly the "no partial backup"
 * guarantee Section 33 asks for (a resumable upload could otherwise leave a
 * half-written file registered in the folder after a dropped connection).
 */
import { BACKUP_DRIVE_FOLDER_NAME } from '../../../domain/entities/GoogleDriveBackup';

const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export interface DriveFileMetadata {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
}

/** Injectable, narrow surface `googleDriveBackupRepository.ts` depends on — lets repository tests fake Drive entirely without a network call (Section 35). */
export interface GoogleDriveFileClient {
  ensureBackupFolder(accessToken: string): Promise<string>;
  uploadBackupFile(accessToken: string, folderId: string, fileName: string, contentJson: string): Promise<DriveFileMetadata>;
  listBackupFiles(accessToken: string, folderId: string): Promise<DriveFileMetadata[]>;
  downloadBackupFile(accessToken: string, fileId: string): Promise<string>;
}

async function driveErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // Response body wasn't JSON — fall through to the generic status-based message.
  }
  return `Google Drive request failed (HTTP ${response.status}).`;
}

export class GoogleDriveRestFileClient implements GoogleDriveFileClient {
  async ensureBackupFolder(accessToken: string): Promise<string> {
    const query = `mimeType='${FOLDER_MIME_TYPE}' and name='${BACKUP_DRIVE_FOLDER_NAME}' and trashed=false and 'root' in parents`;
    const searchUrl = `${FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;
    const searchResponse = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!searchResponse.ok) throw new Error(await driveErrorMessage(searchResponse));
    const searchBody = (await searchResponse.json()) as { files?: { id: string }[] };
    const existing = searchBody.files?.[0];
    if (existing) return existing.id;

    const createResponse = await fetch(FILES_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: BACKUP_DRIVE_FOLDER_NAME, mimeType: FOLDER_MIME_TYPE }),
    });
    if (!createResponse.ok) throw new Error(await driveErrorMessage(createResponse));
    const created = (await createResponse.json()) as { id: string };
    return created.id;
  }

  async uploadBackupFile(accessToken: string, folderId: string, fileName: string, contentJson: string): Promise<DriveFileMetadata> {
    const boundary = `invora-backup-${Date.now()}`;
    const metadata = { name: fileName, parents: [folderId], mimeType: 'application/json' };
    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n${contentJson}\r\n` +
      `--${boundary}--`;

    const response = await fetch(`${UPLOAD_ENDPOINT}?uploadType=multipart&fields=id,name,createdTime,size`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    if (!response.ok) throw new Error(await driveErrorMessage(response));
    const file = (await response.json()) as { id: string; name: string; createdTime?: string; size?: string };
    return {
      id: file.id,
      name: file.name,
      createdAt: file.createdTime ?? new Date().toISOString(),
      sizeBytes: file.size ? Number(file.size) : contentJson.length,
    };
  }

  async listBackupFiles(accessToken: string, folderId: string): Promise<DriveFileMetadata[]> {
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `${FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc&pageSize=100`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error(await driveErrorMessage(response));
    const body = (await response.json()) as { files?: { id: string; name: string; createdTime?: string; size?: string }[] };
    return (body.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      createdAt: file.createdTime ?? '',
      sizeBytes: file.size ? Number(file.size) : 0,
    }));
  }

  async downloadBackupFile(accessToken: string, fileId: string): Promise<string> {
    const response = await fetch(`${FILES_ENDPOINT}/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(await driveErrorMessage(response));
    return response.text();
  }
}
