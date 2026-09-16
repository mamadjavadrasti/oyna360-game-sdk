"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSDK = exports.SDK_VERSION = void 0;
exports.init = init;
exports.getUser = getUser;
exports.getSession = getSession;
exports.getInitPayload = getInitPayload;
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
const IFRAME_PROBE_MS = 400;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DEV_AUTH_MESSAGE = 'oyna360:dev-auth';
const DEV_CODE_QUERY = 'oyna_dev_code';
let initPayload = null;
const initWaiters = [];
function isEmbeddedInPlatform() {
    try {
        return typeof window !== 'undefined' && window.parent !== window;
    }
    catch {
        return true;
    }
}
function asInitPayload(message) {
    return {
        session: message.session,
        user: message.user,
        game: message.game,
        avatar: message.avatar,
        avatarBases: message.avatarBases,
        lobby: message.lobby,
    };
}
function isCompleteInit(data) {
    if (!data || typeof data !== 'object')
        return false;
    const m = data;
    return (m.type === 'platform:init' &&
        !!m.session?.token &&
        !!m.user?.id &&
        !!m.game?.slug &&
        !!m.avatar?.presetKey);
}
/** Publish standard platform:init for lobby-sdk / game listeners (same-window). */
function publishPlatformInit(payload) {
    if (typeof window === 'undefined')
        return;
    const message = {
        type: 'platform:init',
        version: types_1.SDK_VERSION,
        ...payload,
    };
    window.__OYNA360_PLATFORM_INIT__ = message;
    window.dispatchEvent(new MessageEvent('message', {
        data: message,
        origin: window.location.origin,
    }));
}
function settleInit(payload) {
    initPayload = payload;
    publishPlatformInit(payload);
    for (const waiter of initWaiters.splice(0)) {
        clearTimeout(waiter.timer);
        waiter.resolve(payload);
    }
}
function onMessage(event) {
    const data = event.data;
    if (!isCompleteInit(data)) {
        // Production parent may send init; accept even if avatar missing for backward compat
        if (!data || typeof data !== 'object' || data.type !== 'platform:init') {
            return;
        }
        const message = data;
        if (!message.session?.token || !message.user?.id || !message.game?.slug)
            return;
        const avatar = message.avatar ?? {
            presetId: 'default',
            presetKey: 'default-1',
            presetKind: 'procedural',
            customConfig: {},
        };
        settleInit(asInitPayload({
            ...message,
            avatar,
        }));
        return;
    }
    settleInit(asInitPayload(data));
}
function signalReady() {
    if (typeof window === 'undefined')
        return;
    if (!isEmbeddedInPlatform())
        return;
    window.parent.postMessage({ type: 'platform:ready' }, '*');
}
if (typeof window !== 'undefined') {
    window.addEventListener('message', onMessage);
    signalReady();
}
function postToPlatform(outboundType, payload, resultType, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
        if (!isEmbeddedInPlatform()) {
            reject(new Error(`${outboundType} requires the platform iframe parent in this SDK version (Direct Mode Phase B not enabled yet)`));
            return;
        }
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
function resolveDevConfig(options) {
    const fromWindow = typeof window !== 'undefined' ? window.__OYNA360_DEV__ : undefined;
    const platformUrl = (options?.platformUrl || fromWindow?.platformUrl || '').replace(/\/$/, '');
    const gameSlug = (options?.gameSlug || fromWindow?.gameSlug || '').trim();
    let platformWebUrl = (options?.platformWebUrl || fromWindow?.platformWebUrl || '').replace(/\/$/, '');
    if (!platformWebUrl && platformUrl) {
        try {
            // Same host as API by default (production reverse-proxy). Locally set platformWebUrl explicitly
            // when web (e.g. :3000) differs from API (e.g. :3001).
            platformWebUrl = new URL(platformUrl).origin;
        }
        catch {
            platformWebUrl = '';
        }
    }
    return { platformUrl, platformWebUrl, gameSlug };
}
function readCodeFromUrl() {
    if (typeof window === 'undefined')
        return null;
    try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get(DEV_CODE_QUERY);
        if (code) {
            url.searchParams.delete(DEV_CODE_QUERY);
            url.searchParams.delete('oyna_dev_slug');
            window.history.replaceState({}, '', url.toString());
        }
        return code;
    }
    catch {
        return null;
    }
}
async function exchangeDevCode(platformUrl, code, gameOrigin) {
    const response = await fetch(`${platformUrl}/dev/game-auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, gameOrigin }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const msg = typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.message)
                ? data.message.join(', ')
                : 'Development authorization exchange failed';
        throw new Error(msg);
    }
    const payload = data;
    if (!payload?.session?.token || !payload.avatar || !payload.lobby?.wsUrl) {
        throw new Error('Invalid SdkInitPayload from development exchange');
    }
    return payload;
}
function openDevAuthorizePopup(authUrl) {
    const width = 480;
    const height = 720;
    const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));
    return window.open(authUrl, 'oyna360-dev-auth', `popup=yes,width=${width},height=${height},left=${left},top=${top}`);
}
async function runDirectDevelopmentBootstrap(options) {
    const { platformUrl, platformWebUrl, gameSlug } = resolveDevConfig(options);
    if (!platformUrl || !gameSlug || !platformWebUrl) {
        throw new Error('Direct Development Mode requires platformUrl + gameSlug (and platformWebUrl). ' +
            'Set PlatformSDK.init({ platformUrl, gameSlug }) or window.__OYNA360_DEV__.');
    }
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
    return new Promise((resolve, reject) => {
        const timeoutMs = options?.timeout ?? 120_000;
        let settled = false;
        const cleanup = () => {
            window.clearTimeout(timer);
            window.removeEventListener('message', onAuthMessage);
        };
        const finish = (payload) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            resolve(payload);
        };
        const fail = (err) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(err);
        };
        const timer = window.setTimeout(() => {
            fail(new Error('Direct Development authorization timed out. Log in on the Oyna360 authorize page and allow popups.'));
        }, timeoutMs);
        const onAuthMessage = (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object')
                return;
            if (data.type !== DEV_AUTH_MESSAGE)
                return;
            let expectedOrigin = '';
            try {
                expectedOrigin = new URL(platformWebUrl).origin;
            }
            catch {
                return;
            }
            if (event.origin !== expectedOrigin)
                return;
            const code = data.code;
            if (!code)
                return;
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
function waitForIframeInit(timeoutMs) {
    return new Promise((resolve, reject) => {
        if (initPayload) {
            resolve(initPayload);
            return;
        }
        const timer = setTimeout(() => {
            const index = initWaiters.findIndex((w) => w.timer === timer);
            if (index >= 0)
                initWaiters.splice(index, 1);
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
async function init(options) {
    if (initPayload) {
        return initPayload;
    }
    if (typeof window === 'undefined') {
        throw new Error('PlatformSDK.init() requires a browser environment');
    }
    // Already delivered (e.g. early parent message or prior publish)
    if (window.__OYNA360_PLATFORM_INIT__?.session?.token) {
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
    // Top-level: brief probe in case a synthetic/parent message races in, then bootstrap.
    try {
        return await waitForIframeInit(IFRAME_PROBE_MS);
    }
    catch {
        // expected when not in iframe
    }
    const payload = await runDirectDevelopmentBootstrap(options);
    settleInit(payload);
    return payload;
}
function getUser() {
    return initPayload?.user ?? null;
}
function getSession() {
    return initPayload?.session ?? null;
}
function getInitPayload() {
    return initPayload;
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
    if (isEmbeddedInPlatform()) {
        window.parent.postMessage({
            type: 'platform:session:end',
            sessionToken: token,
        }, '*');
    }
}
exports.PlatformSDK = {
    version: types_1.SDK_VERSION,
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
exports.default = exports.PlatformSDK;
//# sourceMappingURL=index.js.map