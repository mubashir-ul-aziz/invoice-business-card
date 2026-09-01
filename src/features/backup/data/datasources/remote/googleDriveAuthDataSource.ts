/**
 * Google OAuth connection for Drive backup (Section 13, 34; Phase 22).
 * Uses `expo-auth-session`/`expo-web-browser` (Section 4's first-listed
 * option) against Google's standard OAuth 2.0 endpoints with PKCE — no
 * client secret is embedded in the app, and it works inside Expo Go/managed
 * builds without a custom native module, unlike
 * `@react-native-google-signin/google-signin` (Section 4's alternative).
 *
 * Requested scope is the drive.file scope (access only to files/folders
 * this app creates), not full Drive access — least privilege for a backup
 * feature that only ever touches its own "Invora Backups" folder.
 *
 * Tokens are the one piece of this feature that's actually sensitive
 * (Section 34: "no plaintext storage of OAuth tokens") — they're the only
 * thing persisted here, via `expo-secure-store`, never AsyncStorage/SQLite.
 */
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// drive.file: only files/folders this app itself creates — never broader Drive access.
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'openid', 'email'];

const TOKENS_KEY = 'invora_google_drive_tokens_v1';
/** 1-minute safety margin before an access token's real expiry (Google issues short-lived, refreshable tokens). */
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  /** Epoch ms. */
  expiresAt: number;
  accountEmail?: string;
}

/** Thrown (never leaked past `googleDriveBackupRepository.ts`, which turns this into a typed `Failure`) when Drive backup has no OAuth client id configured for this build. */
export class DriveNotConfiguredError extends Error {
  constructor() {
    super('Google Drive backup isn’t set up for this build yet. Add a Google OAuth client ID in app config.');
  }
}

/** User closed/cancelled the sign-in prompt — not a real error, just "still disconnected". */
export class DriveSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled.');
  }
}

function getClientId(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    googleDriveOAuthClientId?: { web?: string; ios?: string; android?: string };
  };
  const ids = extra.googleDriveOAuthClientId ?? {};
  const platformId = Platform.OS === 'ios' ? ids.ios : Platform.OS === 'android' ? ids.android : ids.web;
  return platformId || ids.web || '';
}

async function readStoredTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    // Corrupted token blob — treat as disconnected rather than throwing during a routine status check.
    return null;
  }
}

async function writeStoredTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
}

async function refreshAccessToken(clientId: string, tokens: StoredTokens): Promise<StoredTokens> {
  if (!tokens.refreshToken) {
    throw new Error('Your Google Drive connection expired. Reconnect to continue backing up.');
  }
  const refreshed = await AuthSession.refreshAsync(
    { clientId, refreshToken: tokens.refreshToken },
    DISCOVERY,
  );
  const next: StoredTokens = {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
    expiresAt: Date.now() + (refreshed.expiresIn ?? 3600) * 1000,
    accountEmail: tokens.accountEmail,
  };
  await writeStoredTokens(next);
  return next;
}

/** Injectable, narrow surface `googleDriveBackupRepository.ts` depends on — lets repository tests fake auth entirely (Section 35). */
export interface GoogleDriveAuthClient {
  getStatus(): Promise<{ connected: boolean; accountEmail?: string }>;
  connect(): Promise<{ accountEmail?: string }>;
  disconnect(): Promise<void>;
  /** Returns a currently-valid access token, transparently refreshing it first if it's expired. Throws if there's no usable connection. */
  getValidAccessToken(): Promise<string>;
}

export class ExpoGoogleDriveAuthClient implements GoogleDriveAuthClient {
  async getStatus(): Promise<{ connected: boolean; accountEmail?: string }> {
    const tokens = await readStoredTokens();
    if (!tokens) return { connected: false };
    return { connected: true, accountEmail: tokens.accountEmail };
  }

  async connect(): Promise<{ accountEmail?: string }> {
    const clientId = getClientId();
    if (!clientId) throw new DriveNotConfiguredError();

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'invora', path: 'google-drive-auth' });
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    const result = await request.promptAsync(DISCOVERY);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new DriveSignInCancelledError();
    }
    if (result.type !== 'success' || !result.params.code) {
      throw new Error('Could not connect to Google Drive. Please try again.');
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code: result.params.code,
        redirectUri,
        extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      DISCOVERY,
    );

    const accountEmail = await fetchAccountEmail(tokenResponse.accessToken);

    const tokens: StoredTokens = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
      accountEmail,
    };
    await writeStoredTokens(tokens);
    return { accountEmail };
  }

  async disconnect(): Promise<void> {
    const tokens = await readStoredTokens();
    await clearStoredTokens();
    if (tokens?.refreshToken) {
      const clientId = getClientId();
      try {
        await AuthSession.revokeAsync({ clientId, token: tokens.refreshToken }, DISCOVERY);
      } catch {
        // Best-effort — the local connection is already cleared either way, which is what matters to the user.
      }
    }
  }

  async getValidAccessToken(): Promise<string> {
    const clientId = getClientId();
    if (!clientId) throw new DriveNotConfiguredError();

    let tokens = await readStoredTokens();
    if (!tokens) {
      throw new Error('Connect Google Drive before backing up.');
    }
    if (tokens.expiresAt - EXPIRY_SAFETY_MARGIN_MS <= Date.now()) {
      tokens = await refreshAccessToken(clientId, tokens);
    }
    return tokens.accessToken;
  }
}

/** Best-effort account email for display only (Screen 22's "connected as…") — never required for backup/restore to work, so any failure here is swallowed. */
async function fetchAccountEmail(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return undefined;
    const body = (await response.json()) as { email?: string };
    return typeof body.email === 'string' ? body.email : undefined;
  } catch {
    return undefined;
  }
}
