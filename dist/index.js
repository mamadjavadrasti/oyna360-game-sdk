"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSDK = exports.SDK_VERSION = void 0;
exports.init = init;
exports.getUser = getUser;
exports.getSession = getSession;
exports.isReady = isReady;
exports.submitScore = submitScore;
exports.getLeaderboard = getLeaderboard;
exports.unlockAchievement = unlockAchievement;
exports.getAchievements = getAchievements;
exports.getWallet = getWallet;
exports.convertGems = convertGems;
exports.endSession = endSession;
const types_1 = require("./types");
Object.defineProperty(exports, "SDK_VERSION", { enumerable: true, get: function () { return types_1.SDK_VERSION; } });
const DEFAULT_INIT_TIMEOUT_MS = 10_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
let initPayload = null;
const initWaiters = [];
function settleInit(payload) {
    initPayload = payload;
    for (const waiter of initWaiters.splice(0)) {
        clearTimeout(waiter.timer);
        waiter.resolve(payload);
    }
}
function onMessage(event) {
    const data = event.data;
    if (!data || typeof data !== 'object' || data.type !== 'platform:init') {
        return;
    }
    const message = data;
    settleInit({
        session: message.session,
        user: message.user,
        game: message.game,
    });
}
function signalReady() {
    if (typeof window === 'undefined')
        return;
    window.parent.postMessage({ type: 'platform:ready' }, '*');
}
if (typeof window !== 'undefined') {
    window.addEventListener('message', onMessage);
    signalReady();
}
function postToPlatform(outboundType, payload, resultType, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
        const timer = setTimeout(() => {
            window.removeEventListener('message', onResult);
            reject(new Error('Platform SDK request timeout'));
        }, timeoutMs);
        function onResult(event) {
            const data = event.data;
            if (!data || typeof data !== 'object' || data.type !== resultType)
                return;
            if (data.requestId !== requestId)
                return;
            clearTimeout(timer);
            window.removeEventListener('message', onResult);
            const error = data.error;
            if (error) {
                reject(new Error(error));
                return;
            }
            resolve(data.result);
        }
        window.addEventListener('message', onResult);
        window.parent.postMessage({ type: outboundType, requestId, ...payload }, '*');
    });
}
/** Wait for platform init payload (auto-resolves if already initialized). */
function init(options) {
    if (initPayload) {
        return Promise.resolve(initPayload);
    }
    const timeout = options?.timeout ?? DEFAULT_INIT_TIMEOUT_MS;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            const index = initWaiters.findIndex((w) => w.timer === timer);
            if (index >= 0)
                initWaiters.splice(index, 1);
            reject(new Error('Platform SDK init timeout — is the game running inside the platform?'));
        }, timeout);
        initWaiters.push({ resolve, reject, timer });
        signalReady();
    });
}
function getUser() {
    return initPayload?.user ?? null;
}
function getSession() {
    return initPayload?.session ?? null;
}
function isReady() {
    return initPayload !== null;
}
/** Submit score (keeps best score per player). Requires active session. */
async function submitScore(score) {
    const payload = await init();
    if (score < 0 || !Number.isFinite(score)) {
        throw new Error('Score must be a non-negative number');
    }
    return postToPlatform('platform:score:submit', { sessionToken: payload.session.token, score: Math.floor(score) }, 'platform:score:result');
}
/** Fetch game leaderboard via platform bridge. */
async function getLeaderboard(limit = 20) {
    await init();
    return postToPlatform('platform:leaderboard:get', { limit }, 'platform:leaderboard:result');
}
/** Unlock an achievement for the current player. Idempotent. */
async function unlockAchievement(key) {
    const payload = await init();
    if (!key.trim()) {
        throw new Error('Achievement key is required');
    }
    return postToPlatform('platform:achievement:unlock', { sessionToken: payload.session.token, key: key.trim() }, 'platform:achievement:unlock:result');
}
/** List achievements with unlock status for the current player. */
async function getAchievements() {
    await init();
    return postToPlatform('platform:achievements:get', {}, 'platform:achievements:result');
}
/** Platform gem balance + coins-per-gem rate for this game. */
async function getWallet() {
    await init();
    return postToPlatform('platform:wallet:get', {}, 'platform:wallet:result');
}
/**
 * Convert platform gems into in-game coins.
 * Platform deducts gems; the game must credit `coinsReceived` to its own economy.
 */
async function convertGems(gems) {
    const payload = await init();
    if (!Number.isInteger(gems) || gems < 1) {
        throw new Error('gems must be a positive integer');
    }
    return postToPlatform('platform:gems:exchange', { sessionToken: payload.session.token, gems }, 'platform:gems:exchange:result');
}
async function endSession() {
    const token = initPayload?.session.token;
    if (!token || typeof window === 'undefined')
        return;
    window.parent.postMessage({
        type: 'platform:session:end',
        sessionToken: token,
    }, '*');
}
exports.PlatformSDK = {
    version: types_1.SDK_VERSION,
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
exports.default = exports.PlatformSDK;
//# sourceMappingURL=index.js.map