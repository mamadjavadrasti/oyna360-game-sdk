/** Public SDK contract — keep in sync with platform `@platform/types` when protocol changes. */
export declare const SDK_VERSION = "0.4.0";
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
export interface SdkInitPayload {
    session: SdkSession;
    user: SdkUser;
    game: SdkGameInfo;
}
export interface PlatformInitMessage {
    type: 'platform:init';
    version: string;
    session: SdkSession;
    user: SdkUser;
    game: SdkGameInfo;
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