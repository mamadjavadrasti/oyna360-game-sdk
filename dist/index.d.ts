import { SDK_VERSION, type PlatformInitMessage, type PlatformSdkInitOptions, type AchievementsResponse, type SdkInitPayload, type SdkSession, type SdkUser, type LeaderboardResponse, type SubmitScoreResponse, type UnlockAchievementResponse, type WalletBalanceResponse, type ConvertGemsResponse } from './types';
export { SDK_VERSION };
export type { SdkInitPayload, SdkLobbyAvatar, SdkSession, SdkUser, SdkGameInfo, PlatformInitMessage, PlatformSdkInitOptions, LeaderboardEntry, LeaderboardResponse, SubmitScoreResponse, AchievementItem, AchievementsResponse, UnlockAchievementResponse, WalletBalanceResponse, ConvertGemsResponse, } from './types';
declare global {
    interface Window {
        __OYNA360_PLATFORM_INIT__?: PlatformInitMessage;
        __OYNA360_DEV__?: {
            platformUrl?: string;
            platformWebUrl?: string;
            gameSlug?: string;
        };
    }
}
/**
 * Wait for platform init payload.
 * - Production iframe: receives `platform:init` from parent.
 * - Direct Development: Oyna360 authorize → one-time code → standard SdkInitPayload.
 */
export declare function init(options?: PlatformSdkInitOptions): Promise<SdkInitPayload>;
export declare function getUser(): SdkUser | null;
export declare function getSession(): SdkSession | null;
export declare function getInitPayload(): SdkInitPayload | null;
export declare function isReady(): boolean;
/** Submit score (keeps best score per player). Requires active session. */
export declare function submitScore(score: number): Promise<SubmitScoreResponse>;
/** Fetch game leaderboard via platform bridge. */
export declare function getLeaderboard(limit?: number): Promise<LeaderboardResponse>;
/** Unlock an achievement for the current player. Idempotent. */
export declare function unlockAchievement(key: string): Promise<UnlockAchievementResponse>;
/** List achievements with unlock status for the current player. */
export declare function getAchievements(): Promise<AchievementsResponse>;
/** Platform gem balance + coins-per-gem rate for this game. */
export declare function getWallet(): Promise<WalletBalanceResponse>;
/**
 * Convert platform gems into in-game coins.
 * Platform deducts gems; the game must credit `coinsReceived` to its own economy.
 */
export declare function convertGems(gems: number): Promise<ConvertGemsResponse>;
export declare function endSession(): Promise<void>;
export declare const PlatformSDK: {
    version: string;
    init: typeof init;
    getUser: typeof getUser;
    getSession: typeof getSession;
    getInitPayload: typeof getInitPayload;
    isReady: typeof isReady;
    submitScore: typeof submitScore;
    getLeaderboard: typeof getLeaderboard;
    unlockAchievement: typeof unlockAchievement;
    getAchievements: typeof getAchievements;
    getWallet: typeof getWallet;
    convertGems: typeof convertGems;
    endSession: typeof endSession;
};
export default PlatformSDK;
//# sourceMappingURL=index.d.ts.map