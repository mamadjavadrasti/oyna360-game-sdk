import {
  SDK_VERSION,
  type PlatformInitMessage,
  type AchievementsResponse,
  type SdkInitPayload,
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
  SdkSession,
  SdkUser,
  SdkGameInfo,
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
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

let initPayload: SdkInitPayload | null = null;
const initWaiters: Array<{
  resolve: (payload: SdkInitPayload) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}> = [];

function settleInit(payload: SdkInitPayload) {
  initPayload = payload;
  for (const waiter of initWaiters.splice(0)) {
    clearTimeout(waiter.timer);
    waiter.resolve(payload);
  }
}

function onMessage(event: MessageEvent) {
  const data = event.data;
  if (!data || typeof data !== 'object' || data.type !== 'platform:init') {
    return;
  }

  const message = data as PlatformInitMessage;
  settleInit({
    session: message.session,
    user: message.user,
    game: message.game,
  });
}

function signalReady() {
  if (typeof window === 'undefined') return;
  window.parent.postMessage({ type: 'platform:ready' }, '*');
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
    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const timer = setTimeout(() => {
      window.removeEventListener('message', onResult);
      reject(new Error('Platform SDK request timeout'));
    }, timeoutMs);

    function onResult(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== 'object' || data.type !== resultType) return;
      if ((data as { requestId?: string }).requestId !== requestId) return;

      clearTimeout(timer);
      window.removeEventListener('message', onResult);

      const error = (data as { error?: string }).error;
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve((data as { result: T }).result);
    }

    window.addEventListener('message', onResult);
    window.parent.postMessage({ type: outboundType, requestId, ...payload }, '*');
  });
}

/** Wait for platform init payload (auto-resolves if already initialized). */
export function init(options?: { timeout?: number }): Promise<SdkInitPayload> {
  if (initPayload) {
    return Promise.resolve(initPayload);
  }

  const timeout = options?.timeout ?? DEFAULT_INIT_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const index = initWaiters.findIndex((w) => w.timer === timer);
      if (index >= 0) initWaiters.splice(index, 1);
      reject(new Error('Platform SDK init timeout — is the game running inside the platform?'));
    }, timeout);

    initWaiters.push({ resolve, reject, timer });
    signalReady();
  });
}

export function getUser(): SdkUser | null {
  return initPayload?.user ?? null;
}

export function getSession(): SdkSession | null {
  return initPayload?.session ?? null;
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

  return postToPlatform<SubmitScoreResponse>(
    'platform:score:submit',
    { sessionToken: payload.session.token, score: Math.floor(score) },
    'platform:score:result',
  );
}

/** Fetch game leaderboard via platform bridge. */
export async function getLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  await init();
  return postToPlatform<LeaderboardResponse>(
    'platform:leaderboard:get',
    { limit },
    'platform:leaderboard:result',
  );
}

/** Unlock an achievement for the current player. Idempotent. */
export async function unlockAchievement(key: string): Promise<UnlockAchievementResponse> {
  const payload = await init();
  if (!key.trim()) {
    throw new Error('Achievement key is required');
  }

  return postToPlatform<UnlockAchievementResponse>(
    'platform:achievement:unlock',
    { sessionToken: payload.session.token, key: key.trim() },
    'platform:achievement:unlock:result',
  );
}

/** List achievements with unlock status for the current player. */
export async function getAchievements(): Promise<AchievementsResponse> {
  await init();
  return postToPlatform<AchievementsResponse>(
    'platform:achievements:get',
    {},
    'platform:achievements:result',
  );
}

/** Platform gem balance + coins-per-gem rate for this game. */
export async function getWallet(): Promise<WalletBalanceResponse> {
  await init();
  return postToPlatform<WalletBalanceResponse>(
    'platform:wallet:get',
    {},
    'platform:wallet:result',
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

  return postToPlatform<ConvertGemsResponse>(
    'platform:gems:exchange',
    { sessionToken: payload.session.token, gems },
    'platform:gems:exchange:result',
  );
}

export async function endSession(): Promise<void> {
  const token = initPayload?.session.token;
  if (!token || typeof window === 'undefined') return;

  window.parent.postMessage(
    {
      type: 'platform:session:end',
      sessionToken: token,
    },
    '*',
  );
}

export const PlatformSDK = {
  version: SDK_VERSION,
  init,
  getUser,
  getSession,
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
