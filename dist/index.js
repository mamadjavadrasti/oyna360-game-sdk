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
/** Origin of the platform parent after the first trusted iframe message. */
let trustedPlatformOrigin = null;
/** API base including `/api` — set in Direct Development for score/wallet/etc. */
let directPlatformUrl = null;
const initWaiters = [];
function isEmbeddedInPlatform() {
    try {
        return typeof window !== 'undefined' && window.parent !== window;
    }
    catch {
        return true;
    }
}
function rememberDirectPlatformUrl(url) {
    const trimmed = url.replace(/\/$/, '');
    if (trimmed)
        directPlatformUrl = trimmed;
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
function rememberTrustedOrigin(origin) {
    if (!trustedPlatformOrigin && origin && origin !== 'null') {
        trustedPlatformOrigin = origin;
    }
}
/**
 * Only accept postMessage traffic from the real platform parent.
 * Self-published MessageEvents (publishPlatformInit) have null `source` and must be ignored
 * here so settleInit → publish → onMessage cannot recurse.
 */
function isTrustedPlatformMessage(event) {
    if (typeof window === 'undefined')
        return false;
    if (!isEmbeddedInPlatform())
        return false;
    if (event.source !== window.parent)
        return false;
    if (trustedPlatformOrigin && event.origin !== trustedPlatformOrigin)
        return false;
    return true;
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
    // Idempotent: ignore re-entry from self-publish or duplicate parent init.
    if (initPayload)
        return;
    initPayload = payload;
    publishPlatformInit(payload);
    for (const waiter of initWaiters.splice(0)) {
        clearTimeout(waiter.timer);
        waiter.resolve(payload);
    }
}
function onMessage(event) {
    if (initPayload)
        return;
    if (!isTrustedPlatformMessage(event))
        return;
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
        rememberTrustedOrigin(event.origin);
        settleInit(asInitPayload({
            ...message,
            avatar,
        }));
        return;
    }
    rememberTrustedOrigin(event.origin);
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
            reject(new Error(`${outboundType} requires the platform iframe parent`));
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
            if (!isTrustedPlatformMessage(event))
                return;
            const data = event.data;
            if (!data || typeof data !== 'object' || data.type !== resultType)
                return;
            if (data.requestId !== requestId)
                return;
            clearTimeout(timer);
            window.removeEventListener('message', onResult);
            rememberTrustedOrigin(event.origin);
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
function nestErrorMessage(data, fallback) {
    if (!data || typeof data !== 'object')
        return fallback;
    const message = data.message;
    if (typeof message === 'string')
        return message;
    if (Array.isArray(message))
        return message.join(', ');
    return fallback;
}
/** Direct Development / top-level: call platform REST with the game session token. */
async function apiRequest(path, options = {}) {
    const base = directPlatformUrl;
    if (!base) {
        throw new Error('Direct API calls require platformUrl. Pass PlatformSDK.init({ platformUrl, gameSlug }) or window.__OYNA360_DEV__.');
    }
    const headers = {
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
    return data;
}
function callPlatformFeature(outboundType, payload, resultType, directCall) {
    if (isEmbeddedInPlatform()) {
        return postToPlatform(outboundType, payload, resultType);
    }
    return directCall();
}
async function markDirectSessionReady() {
    if (!directPlatformUrl || !initPayload?.session?.token)
        return;
    try {
        await apiRequest('/sessions/ready', { method: 'POST' });
    }
    catch {
        // Non-fatal: presence analytics only
    }
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
    // Pin API base early so Direct Dev feature calls work after init.
    const earlyDev = resolveDevConfig(options);
    if (earlyDev.platformUrl) {
        rememberDirectPlatformUrl(earlyDev.platformUrl);
    }
    // Optional: pin expected parent origin early (iframe + Direct Dev).
    if (options?.platformWebUrl || earlyDev.platformWebUrl) {
        try {
            rememberTrustedOrigin(new URL(options?.platformWebUrl || earlyDev.platformWebUrl).origin);
        }
        catch {
            // ignore invalid URL; message source check still applies in iframe mode
        }
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
    // Top-level: brief probe in case a parent/harness message races in, then bootstrap.
    // Synthetic self-publish is ignored (source !== parent); probe usually times out.
    try {
        return await waitForIframeInit(IFRAME_PROBE_MS);
    }
    catch {
        // expected when not in iframe
    }
    const payload = await runDirectDevelopmentBootstrap(options);
    settleInit(payload);
    void markDirectSessionReady();
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
    const floorScore = Math.floor(score);
    return callPlatformFeature('platform:score:submit', { sessionToken: payload.session.token, score: floorScore }, 'platform:score:result', () => apiRequest(`/games/${payload.game.slug}/scores`, {
        method: 'POST',
        body: { score: floorScore },
    }));
}
/** Fetch game leaderboard via platform bridge (iframe) or REST (Direct Dev). */
async function getLeaderboard(limit = 20) {
    const payload = await init();
    const safeLimit = Math.min(Math.max(Math.floor(limit) || 20, 1), 100);
    return callPlatformFeature('platform:leaderboard:get', { limit: safeLimit }, 'platform:leaderboard:result', () => apiRequest(`/games/${payload.game.slug}/leaderboard?limit=${safeLimit}`, { auth: false }));
}
/** Unlock an achievement for the current player. Idempotent. */
async function unlockAchievement(key) {
    const payload = await init();
    if (!key.trim()) {
        throw new Error('Achievement key is required');
    }
    const achievementKey = key.trim();
    return callPlatformFeature('platform:achievement:unlock', { sessionToken: payload.session.token, key: achievementKey }, 'platform:achievement:unlock:result', () => apiRequest(`/games/${payload.game.slug}/achievements/unlock`, {
        method: 'POST',
        body: { key: achievementKey },
    }));
}
/** List achievements with unlock status for the current player. */
async function getAchievements() {
    const payload = await init();
    return callPlatformFeature('platform:achievements:get', {}, 'platform:achievements:result', () => apiRequest(`/games/${payload.game.slug}/achievements/me`));
}
/** Platform gem balance + coins-per-gem rate for this game. */
async function getWallet() {
    const payload = await init();
    return callPlatformFeature('platform:wallet:get', {}, 'platform:wallet:result', () => apiRequest(`/games/${payload.game.slug}/wallet`));
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
    return callPlatformFeature('platform:gems:exchange', { sessionToken: payload.session.token, gems }, 'platform:gems:exchange:result', () => apiRequest(`/games/${payload.game.slug}/wallet/exchange`, {
        method: 'POST',
        body: { gems },
    }));
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
        return;
    }
    if (directPlatformUrl) {
        try {
            await apiRequest('/sessions/end', {
                method: 'POST',
                body: { token },
                auth: false,
            });
        }
        catch {
            // Session may already be closed
        }
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