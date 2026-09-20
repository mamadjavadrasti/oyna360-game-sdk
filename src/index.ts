import {
  SDK_VERSION,
  type PlatformInitMessage,
  type PlatformSdkInitOptions,
  type AchievementsResponse,
  type SdkInitPayload,
  type SdkLobbyAvatar,
  type SdkSession,
  type SdkUser,
  type LeaderboardResponse,
  type SubmitScoreResponse,
  type UnlockAchievementResponse,
  type WalletBalanceResponse,
  type ConvertGemsResponse,
} from './types';

export { SDK_VERSION };
export type {
  SdkInitPayload,
  SdkLobbyAvatar,
  SdkSession,
  SdkUser,
  SdkGameInfo,
  PlatformInitMessage,
  PlatformSdkInitOptions,
  LeaderboardEntry,
  LeaderboardResponse,
  SubmitScoreResponse,
  AchievementItem,
  AchievementsResponse,
  UnlockAchievementResponse,
  WalletBalanceResponse,
  ConvertGemsResponse,
} from './types';

const DEFAULT_INIT_TIMEOUT_MS = 10_000;
const IFRAME_PROBE_MS = 400;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEV_AUTH_MESSAGE = 'oyna360:dev-auth';
const DEV_CODE_QUERY = 'oyna_dev_code';

declare global {
  interface Window {
    __OYNA360_PLATFORM_INIT__?: PlatformInitMessage;
    /** True only when init was written by a trusted path (parent message or this SDK). */
    __OYNA360_PLATFORM_INIT_OK__?: boolean;
    __OYNA360_DEV__?: {
      platformUrl?: string;
      platformWebUrl?: string;
      gameSlug?: string;
    };
  }
}

let initPayload: SdkInitPayload | null = null;
/** Origin of the platform parent after the first trusted iframe message. */
let trustedPlatformOrigin: string | null = null;
/** API base including `/api` — set in Direct Development for score/wallet/etc. */
let directPlatformUrl: string | null = null;
const initWaiters: Array<{
  resolve: (payload: SdkInitPayload) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}> = [];

function isEmbeddedInPlatform(): boolean {
  try {
    return typeof window !== 'undefined' && window.parent !== window;
  } catch {
    return true;
  }
}

function rememberDirectPlatformUrl(url: string) {
  const trimmed = url.replace(/\/$/, '');
  if (trimmed) directPlatformUrl = trimmed;
}

function asInitPayload(message: PlatformInitMessage | SdkInitPayload): SdkInitPayload {
  return {
    session: message.session,
    user: message.user,
    game: message.game,
    avatar: message.avatar,
    avatarBases: message.avatarBases,
    lobby: message.lobby,
  };
}

function isCompleteInit(data: unknown): data is PlatformInitMessage {
  if (!data || typeof data !== 'object') return false;
  const m = data as Partial<PlatformInitMessage>;
  return (
    m.type === 'platform:init' &&
    !!m.session?.token &&
    !!m.user?.id &&
    !!m.game?.slug &&
    !!m.avatar?.presetKey
  );
}

function rememberTrustedOrigin(origin: string) {
  if (!trustedPlatformOrigin && origin && origin !== 'null') {
    trustedPlatformOrigin = origin;
  }
}

/**
 * Target origin for parent.postMessage — never stay on * after we know the platform.
 */
function getParentMessageTarget(): string {
  if (trustedPlatformOrigin) return trustedPlatformOrigin;
  if (typeof window !== 'undefined') {
    const raw = window.__OYNA360_DEV__?.platformWebUrl;
    if (raw) {
      try {
        return new URL(raw).origin;
      } catch {
        /* ignore */
      }
    }
    try {
      if (typeof document !== 'undefined' && document.referrer) {
        return new URL(document.referrer).origin;
      }
    } catch {
      /* ignore */
    }
  }
  return '*';
}

/**
 * Only accept postMessage traffic from the real platform parent.
 * Self-published MessageEvents (publishPlatformInit) have null `source` and must be ignored
 * here so settleInit → publish → onMessage cannot recurse.
 */
function isTrustedPlatformMessage(event: MessageEvent): boolean {
  if (typeof window === 'undefined') return false;
  if (!isEmbeddedInPlatform()) return false;
  if (event.source !== window.parent) return false;
  if (trustedPlatformOrigin && event.origin !== trustedPlatformOrigin) return false;
  return true;
}

/** Publish standard platform:init for lobby-sdk / game listeners (same-window). */
function publishPlatformInit(payload: SdkInitPayload) {
  if (typeof window === 'undefined') return;
  const message: PlatformInitMessage = {
    type: 'platform:init',
    version: SDK_VERSION,
    ...payload,
  };
  window.__OYNA360_PLATFORM_INIT__ = message;
  window.__OYNA360_PLATFORM_INIT_OK__ = true;
  window.dispatchEvent(
    new MessageEvent('message', {
      data: message,
      origin: window.location.origin,
    }),
  );
}

function settleInit(payload: SdkInitPayload) {
  // Idempotent: ignore re-entry from self-publish or duplicate parent init.
  if (initPayload) return;
  initPayload = payload;
  publishPlatformInit(payload);
  for (const waiter of initWaiters.splice(0)) {
    clearTimeout(waiter.timer);
    waiter.resolve(payload);
  }
}

function onMessage(event: MessageEvent) {
  if (initPayload) return;
  if (!isTrustedPlatformMessage(event)) return;

  const data = event.data;
  if (!isCompleteInit(data)) {
    // Production parent may send init; accept even if avatar missing for backward compat
    if (!data || typeof data !== 'object' || (data as { type?: string }).type !== 'platform:init') {
      return;
    }
    const message = data as PlatformInitMessage;
    if (!message.session?.token || !message.user?.id || !message.game?.slug) return;
    const avatar: SdkLobbyAvatar = message.avatar ?? {
      presetId: 'default',
      presetKey: 'default-1',
      presetKind: 'procedural',
      customConfig: {},
    };
    rememberTrustedOrigin(event.origin);
    settleInit(
      asInitPayload({
        ...message,
        avatar,
      }),
    );
    return;
  }
  rememberTrustedOrigin(event.origin);
  settleInit(asInitPayload(data));
}

function signalReady() {
  if (typeof window === 'undefined') return;
  if (!isEmbeddedInPlatform()) return;
  window.parent.postMessage({ type: 'platform:ready' }, getParentMessageTarget());
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', onMessage);
  signalReady();
}

function postToPlatform<T>(
  outboundType: string,
  payload: Record<string, unknown>,
  resultType: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isEmbeddedInPlatform()) {
      reject(new Error(`${outboundType} requires the platform iframe parent`));
      return;
    }

    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const timer = setTimeout(() => {
      window.removeEventListener('message', onResult);
      reject(new Error('Platform SDK request timeout'));
    }, timeoutMs);

    function onResult(event: MessageEvent) {
      if (!isTrustedPlatformMessage(event)) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || data.type !== resultType) return;
      if ((data as { requestId?: string }).requestId !== requestId) return;

      clearTimeout(timer);
      window.removeEventListener('message', onResult);
      rememberTrustedOrigin(event.origin);

      const error = (data as { error?: string }).error;
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve((data as { result: T }).result);
    }

    window.addEventListener('message', onResult);
    window.parent.postMessage({ type: outboundType, requestId, ...payload }, getParentMessageTarget());
  });
}

function nestErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join(', ');
  return fallback;
}

/** Direct Development / top-level: call platform REST with the game session token. */
async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    /** Default true — send `Authorization: Bearer <session.token>`. */
    auth?: boolean;
  } = {},
): Promise<T> {
  const base = directPlatformUrl;
  if (!base) {
    throw new Error(
      'Direct API calls require platformUrl. Pass PlatformSDK.init({ platformUrl, gameSlug }) or window.__OYNA360_DEV__.',
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false) {
    const token = initPayload?.session?.token;
    if (!token) {
      throw new Error('PlatformSDK.init() must complete before calling this API');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${base}${path}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestErrorMessage(data, `Platform API error (${response.status})`));
  }
  return data as T;
}

function callPlatformFeature<T>(
  outboundType: string,
  payload: Record<string, unknown>,
  resultType: string,
  directCall: () => Promise<T>,
): Promise<T> {
  if (isEmbeddedInPlatform()) {
    return postToPlatform<T>(outboundType, payload, resultType);
  }
  return directCall();
}

async function markDirectSessionReady() {
  if (!directPlatformUrl || !initPayload?.session?.token) return;
  try {
    await apiRequest('/sessions/ready', { method: 'POST' });
  } catch {
    // Non-fatal: presence analytics only
  }
}

function resolveDevConfig(options?: PlatformSdkInitOptions) {
  const fromWindow = typeof window !== 'undefined' ? window.__OYNA360_DEV__ : undefined;
  const platformUrl = (options?.platformUrl || fromWindow?.platformUrl || '').replace(/\/$/, '');
  const gameSlug = (options?.gameSlug || fromWindow?.gameSlug || '').trim();
  let platformWebUrl = (options?.platformWebUrl || fromWindow?.platformWebUrl || '').replace(/\/$/, '');
  if (!platformWebUrl && platformUrl) {
    try {
      // Same host as API by default (production reverse-proxy). Locally set platformWebUrl explicitly
      // when web (e.g. :3000) differs from API (e.g. :3001).
      platformWebUrl = new URL(platformUrl).origin;
    } catch {
      platformWebUrl = '';
    }
  }
  return { platformUrl, platformWebUrl, gameSlug };
}

function readCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get(DEV_CODE_QUERY);
    if (code) {
      url.searchParams.delete(DEV_CODE_QUERY);
      url.searchParams.delete('oyna_dev_slug');
      window.history.replaceState({}, '', url.toString());
    }
    return code;
  } catch {
    return null;
  }
}

async function exchangeDevCode(
  platformUrl: string,
  code: string,
  gameOrigin: string,
): Promise<SdkInitPayload> {
  const response = await fetch(`${platformUrl}/dev/game-auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, gameOrigin }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : 'Development authorization exchange failed';
    throw new Error(msg);
  }
  const payload = data as SdkInitPayload;
  if (!payload?.session?.token || !payload.avatar || !payload.lobby?.wsUrl) {
    throw new Error('Invalid SdkInitPayload from development exchange');
  }
  return payload;
}

function openDevAuthorizePopup(authUrl: string): Window | null {
  const width = 480;
  const height = 720;
  const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));
  return window.open(
    authUrl,
    'oyna360-dev-auth',
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

async function runDirectDevelopmentBootstrap(
  options?: PlatformSdkInitOptions,
): Promise<SdkInitPayload> {
  const { platformUrl, platformWebUrl, gameSlug } = resolveDevConfig(options);
  if (!platformUrl || !gameSlug || !platformWebUrl) {
    throw new Error(
      'Direct Development Mode requires platformUrl + gameSlug (and platformWebUrl). ' +
        'Set PlatformSDK.init({ platformUrl, gameSlug }) or window.__OYNA360_DEV__.',
    );
  }

  rememberDirectPlatformUrl(platformUrl);

  const gameOrigin = window.location.origin;
  const existingCode = readCodeFromUrl();
  if (existingCode) {
    return exchangeDevCode(platformUrl, existingCode, gameOrigin);
  }

  const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/';
  const authUrl = new URL('/dev/game-auth', platformWebUrl);
  authUrl.searchParams.set('slug', gameSlug);
  authUrl.searchParams.set('origin', gameOrigin);
  authUrl.searchParams.set('return', returnPath.startsWith('/') ? returnPath : '/');

  return new Promise<SdkInitPayload>((resolve, reject) => {
    const timeoutMs = options?.timeout ?? 120_000;
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', onAuthMessage);
    };

    const finish = (payload: SdkInitPayload) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(payload);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const timer = window.setTimeout(() => {
      fail(
        new Error(
          'Direct Development authorization timed out. Log in on the Oyna360 authorize page and allow popups.',
        ),
      );
    }, timeoutMs);

    const onAuthMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if ((data as { type?: string }).type !== DEV_AUTH_MESSAGE) return;
      let expectedOrigin = '';
      try {
        expectedOrigin = new URL(platformWebUrl).origin;
      } catch {
        return;
      }
      if (event.origin !== expectedOrigin) return;
      const code = (data as { code?: string }).code;
      if (!code) return;
      void exchangeDevCode(platformUrl, code, gameOrigin).then(finish, fail);
    };

    window.addEventListener('message', onAuthMessage);

    const popup = openDevAuthorizePopup(authUrl.toString());
    if (!popup) {
      // Popup blocked → full redirect; after login, game reloads with ?oyna_dev_code=
      window.location.assign(authUrl.toString());
      return;
    }
  });
}

function waitForIframeInit(timeoutMs: number): Promise<SdkInitPayload> {
  return new Promise((resolve, reject) => {
    if (initPayload) {
      resolve(initPayload);
      return;
    }

    const timer = setTimeout(() => {
      const index = initWaiters.findIndex((w) => w.timer === timer);
      if (index >= 0) initWaiters.splice(index, 1);
      reject(new Error('Platform SDK init timeout — is the game running inside the platform?'));
    }, timeoutMs);

    initWaiters.push({ resolve, reject, timer });
    signalReady();
  });
}

/**
 * Wait for platform init payload.
 * - Production iframe: receives `platform:init` from parent.
 * - Direct Development: Oyna360 authorize → one-time code → standard SdkInitPayload.
 */
export async function init(options?: PlatformSdkInitOptions): Promise<SdkInitPayload> {
  if (initPayload) {
    return initPayload;
  }

  if (typeof window === 'undefined') {
    throw new Error('PlatformSDK.init() requires a browser environment');
  }

  // Pin API base early so Direct Dev feature calls work after init.
  const earlyDev = resolveDevConfig(options);
  if (earlyDev.platformUrl) {
    rememberDirectPlatformUrl(earlyDev.platformUrl);
  }

  // Optional: pin expected parent origin early (iframe + Direct Dev).
  if (options?.platformWebUrl || earlyDev.platformWebUrl) {
    try {
      rememberTrustedOrigin(new URL(options?.platformWebUrl || earlyDev.platformWebUrl).origin);
    } catch {
      // ignore invalid URL; message source check still applies in iframe mode
    }
  }

  // Already delivered by a trusted writer (this SDK or lobby-sdk after origin check)
  if (window.__OYNA360_PLATFORM_INIT_OK__ && window.__OYNA360_PLATFORM_INIT__?.session?.token) {
    const cached = asInitPayload(window.__OYNA360_PLATFORM_INIT__);
    if (!cached.avatar) {
      cached.avatar = {
        presetId: 'default',
        presetKey: 'default-1',
        presetKind: 'procedural',
        customConfig: {},
      };
    }
    settleInit(cached);
    return cached;
  }

  if (isEmbeddedInPlatform()) {
    return waitForIframeInit(options?.timeout ?? DEFAULT_INIT_TIMEOUT_MS);
  }

  // Top-level: brief probe in case a parent/harness message races in, then bootstrap.
  // Synthetic self-publish is ignored (source !== parent); probe usually times out.
  try {
    return await waitForIframeInit(IFRAME_PROBE_MS);
  } catch {
    // expected when not in iframe
  }

  const payload = await runDirectDevelopmentBootstrap(options);
  settleInit(payload);
  void markDirectSessionReady();
  return payload;
}

export function getUser(): SdkUser | null {
  return initPayload?.user ?? null;
}

export function getSession(): SdkSession | null {
  return initPayload?.session ?? null;
}

export function getInitPayload(): SdkInitPayload | null {
  return initPayload;
}

export function isReady(): boolean {
  return initPayload !== null;
}

/** Submit score (keeps best score per player). Requires active session. */
export async function submitScore(score: number): Promise<SubmitScoreResponse> {
  const payload = await init();
  if (score < 0 || !Number.isFinite(score)) {
    throw new Error('Score must be a non-negative number');
  }

  const floorScore = Math.floor(score);
  return callPlatformFeature<SubmitScoreResponse>(
    'platform:score:submit',
    { sessionToken: payload.session.token, score: floorScore },
    'platform:score:result',
    () =>
      apiRequest<SubmitScoreResponse>(`/games/${payload.game.slug}/scores`, {
        method: 'POST',
        body: { score: floorScore },
      }),
  );
}

/** Fetch game leaderboard via platform bridge (iframe) or REST (Direct Dev). */
export async function getLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  const payload = await init();
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 20, 1), 100);
  return callPlatformFeature<LeaderboardResponse>(
    'platform:leaderboard:get',
    { limit: safeLimit },
    'platform:leaderboard:result',
    () =>
      apiRequest<LeaderboardResponse>(
        `/games/${payload.game.slug}/leaderboard?limit=${safeLimit}`,
        { auth: false },
      ),
  );
}

/** Unlock an achievement for the current player. Idempotent. */
export async function unlockAchievement(key: string): Promise<UnlockAchievementResponse> {
  const payload = await init();
  if (!key.trim()) {
    throw new Error('Achievement key is required');
  }

  const achievementKey = key.trim();
  return callPlatformFeature<UnlockAchievementResponse>(
    'platform:achievement:unlock',
    { sessionToken: payload.session.token, key: achievementKey },
    'platform:achievement:unlock:result',
    () =>
      apiRequest<UnlockAchievementResponse>(`/games/${payload.game.slug}/achievements/unlock`, {
        method: 'POST',
        body: { key: achievementKey },
      }),
  );
}

/** List achievements with unlock status for the current player. */
export async function getAchievements(): Promise<AchievementsResponse> {
  const payload = await init();
  return callPlatformFeature<AchievementsResponse>(
    'platform:achievements:get',
    {},
    'platform:achievements:result',
    () => apiRequest<AchievementsResponse>(`/games/${payload.game.slug}/achievements/me`),
  );
}

/** Platform gem balance + coins-per-gem rate for this game. */
export async function getWallet(): Promise<WalletBalanceResponse> {
  const payload = await init();
  return callPlatformFeature<WalletBalanceResponse>(
    'platform:wallet:get',
    {},
    'platform:wallet:result',
    () => apiRequest<WalletBalanceResponse>(`/games/${payload.game.slug}/wallet`),
  );
}

/**
 * Convert platform gems into in-game coins.
 * Platform deducts gems; the game must credit `coinsReceived` to its own economy.
 */
export async function convertGems(gems: number): Promise<ConvertGemsResponse> {
  const payload = await init();
  if (!Number.isInteger(gems) || gems < 1) {
    throw new Error('gems must be a positive integer');
  }

  return callPlatformFeature<ConvertGemsResponse>(
    'platform:gems:exchange',
    { sessionToken: payload.session.token, gems },
    'platform:gems:exchange:result',
    () =>
      apiRequest<ConvertGemsResponse>(`/games/${payload.game.slug}/wallet/exchange`, {
        method: 'POST',
        body: { gems },
      }),
  );
}

export async function endSession(): Promise<void> {
  const token = initPayload?.session.token;
  if (!token || typeof window === 'undefined') return;

  if (isEmbeddedInPlatform()) {
    const target = getParentMessageTarget();
    window.parent.postMessage(
      {
        type: 'platform:session:end',
        sessionToken: token,
      },
      target,
    );
    return;
  }

  if (directPlatformUrl) {
    try {
      await apiRequest('/sessions/end', {
        method: 'POST',
        body: { token },
        auth: false,
      });
    } catch {
      // Session may already be closed
    }
  }
}

export const PlatformSDK = {
  version: SDK_VERSION,
  init,
  getUser,
  getSession,
  getInitPayload,
  isReady,
  submitScore,
  getLeaderboard,
  unlockAchievement,
  getAchievements,
  getWallet,
  convertGems,
  endSession,
};

export default PlatformSDK;
