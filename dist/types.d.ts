/** Public SDK contract — keep in sync with platform `@platform/types` when protocol changes. */
export declare const SDK_VERSION = "0.6.0";
export type AvatarPresetKind = 'procedural' | 'glb';
export interface SdkLobbyAvatar {
    presetId: string;
    presetKey: string;
    presetKind: AvatarPresetKind;
    customConfig: Record<string, unknown>;
}
export interface SdkUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}
export interface SdkSession {
    id: string;
    token: string;
}
export interface SdkGameInfo {
    slug: string;
    name: string;
}
/** Same shape as platform `platform:init` / lobby SdkInitPayload. */
export interface SdkInitPayload {
    session: SdkSession;
    user: SdkUser;
    game: SdkGameInfo;
    avatar: SdkLobbyAvatar;
    avatarBases?: Array<{
        id: string;
        glbUrl: string;
    }>;
    lobby?: {
        wsUrl: string;
        roomId: string;
        strictRoom?: boolean;
    };
}
export interface PlatformInitMessage extends SdkInitPayload {
    type: 'platform:init';
    version: string;
}
export interface PlatformSdkInitOptions {
    /** Iframe wait timeout (ms). Direct mode uses a short probe then bootstrap. */
    timeout?: number;
    /**
     * Platform API base including `/api`, e.g. `https://oyna360.ir/api`.
     * Required for Direct Development Mode.
     */
    platformUrl?: string;
    /**
     * Platform web origin for the authorize page, e.g. `https://oyna360.ir`.
     * Defaults to origin of `platformUrl` without `/api`.
     */
    platformWebUrl?: string;
    /**
     * Published game slug — legacy Direct Dev (authorize popup).
     * Prefer `dev: { clientId, credential }` for Developer Environment.
     */
    gameSlug?: string;
    /**
     * Developer Environment credentials from /developer portal.
     * Creates a temporary session via POST /dev/gateway/session — no popup.
     */
    dev?: {
        clientId: string;
        credential: string;
    };
}
export interface LeaderboardEntry {
    rank: number;
    score: number;
    achievedAt: string;
    user: {
        displayName: string;
        username: string;
        avatarUrl: string | null;
    };
}
export interface LeaderboardResponse {
    gameSlug: string;
    entries: LeaderboardEntry[];
}
export interface SubmitScoreResponse {
    score: number;
    previousBest: number | null;
    isNewBest: boolean;
    rank: number;
}
export interface AchievementItem {
    key: string;
    title: string;
    description: string | null;
    iconUrl: string | null;
    sortOrder: number;
    unlocked: boolean;
    unlockedAt: string | null;
}
export interface AchievementsResponse {
    gameSlug: string;
    achievements: AchievementItem[];
}
export interface UnlockAchievementResponse {
    key: string;
    title: string;
    unlocked: boolean;
    unlockedAt: string;
    alreadyUnlocked: boolean;
}
export interface WalletBalanceResponse {
    gems: number;
    coinsPerGem: number;
    gameSlug: string;
}
export interface ConvertGemsResponse {
    gemsSpent: number;
    coinsReceived: number;
    coinsPerGem: number;
    gemsRemaining: number;
    gameSlug: string;
}
//# sourceMappingURL=types.d.ts.map