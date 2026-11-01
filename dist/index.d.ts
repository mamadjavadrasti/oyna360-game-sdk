import type { ProductsResponse, PurchaseReceipt, PurchaseStatus, PurchaseReceipts, InventoryResponse, ConsumeItemResponse, ExchangeStatus } from "./types";
export type { GameProduct, ProductsResponse, PurchaseReceipt, PurchaseStatus, PurchaseReceipts, InventoryResponse, ConsumeItemResponse, ExchangeStatus, } from "./types";
import { SDK_VERSION, type PlatformInitMessage, type PlatformSdkInitOptions, type AchievementsResponse, type SdkInitPayload, type SdkSession, type SdkUser, type LeaderboardResponse, type SubmitScoreResponse, type UnlockAchievementResponse, type WalletBalanceResponse, type ConvertGemsResponse } from "./types";
export { SDK_VERSION };
export type { SdkInitPayload, SdkLobbyAvatar, SdkSession, SdkUser, SdkGameInfo, PlatformInitMessage, PlatformSdkInitOptions, LeaderboardEntry, LeaderboardResponse, SubmitScoreResponse, AchievementItem, AchievementsResponse, UnlockAchievementResponse, WalletBalanceResponse, ConvertGemsResponse, } from "./types";
declare global {
    interface Window {
        __OYNA360_PLATFORM_INIT__?: PlatformInitMessage;
        /** True only when init was written by a trusted path (parent message or this SDK). */
        __OYNA360_PLATFORM_INIT_OK__?: boolean;
        __OYNA360_DEV__?: {
            platformUrl?: string;
            platformWebUrl?: string;
            gameSlug?: string;
            clientId?: string;
            credential?: string;
        };
    }
}
/**
 * Wait for platform init payload.
 * - Production iframe: receives `platform:init` from parent.
 * - Developer Environment: credential → POST /dev/gateway/session (no popup).
 * - Legacy Direct Development: authorize popup → one-time code → SdkInitPayload.
 */
export declare function init(options?: PlatformSdkInitOptions): Promise<SdkInitPayload>;
export declare function getUser(): SdkUser | null;
export declare function getSession(): SdkSession | null;
export declare function getInitPayload(): SdkInitPayload | null;
export declare function isReady(): boolean;
/** Submit score (keeps best score per player). Requires active session. */
export declare function submitScore(score: number): Promise<SubmitScoreResponse>;
/** Fetch game leaderboard via platform bridge (iframe) or REST (Direct Dev). */
export declare function getLeaderboard(limit?: number): Promise<LeaderboardResponse>;
/** Unlock an achievement for the current player. Idempotent. */
export declare function unlockAchievement(key: string): Promise<UnlockAchievementResponse>;
/** List achievements with unlock status for the current player. */
export declare function getAchievements(): Promise<AchievementsResponse>;
/** Platform gem balance + coins-per-gem rate for this game. */
export declare function getWallet(): Promise<WalletBalanceResponse>;
export declare function convertGems(gems: number, requestId?: string): Promise<ConvertGemsResponse>;
export declare function getProducts(): Promise<ProductsResponse>;
/** Persist requestId before sending and reuse it when recovering/retrying the same purchase. */
export declare function purchaseProduct(itemId: string, requestId?: string): Promise<PurchaseReceipt>;
export declare function getPurchaseStatus(requestId: string): Promise<PurchaseStatus>;
export declare function getPurchaseReceipts(cursor?: string): Promise<PurchaseReceipts>;
export declare function getInventory(): Promise<InventoryResponse>;
export declare function consumeItem(itemId: string, quantity: number, requestId?: string): Promise<ConsumeItemResponse>;
export declare function getExchangeStatus(requestId: string): Promise<ExchangeStatus>;
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
    getProducts: typeof getProducts;
    purchaseProduct: typeof purchaseProduct;
    getPurchaseStatus: typeof getPurchaseStatus;
    getPurchaseReceipts: typeof getPurchaseReceipts;
    getInventory: typeof getInventory;
    consumeItem: typeof consumeItem;
    getExchangeStatus: typeof getExchangeStatus;
    endSession: typeof endSession;
};
export default PlatformSDK;
//# sourceMappingURL=index.d.ts.map