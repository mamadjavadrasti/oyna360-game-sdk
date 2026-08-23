# 07 — پروتکل postMessage (مرجع)

مرجع پیام‌های ردوبدل شده بین **iframe (بازی)** و **parent (پلتفرم)**.

## جهت: Parent → Game

### `platform:init`

ارسال context اولیه بعد از load یا `platform:ready`.

```typescript
{
  type: 'platform:init';
  version: string;       // e.g. "0.2.0"
  session: { id: string; token: string };
  user: { id, username, displayName, avatarUrl };
  game: { slug, name };
}
```

---

### `platform:score:result`

پاسخ به `platform:score:submit`.

```typescript
{
  type: 'platform:score:result';
  requestId: string;
  result?: SubmitScoreResponse;
  error?: string;
}
```

---

### `platform:leaderboard:result`

پاسخ به `platform:leaderboard:get`.

```typescript
{
  type: 'platform:leaderboard:result';
  requestId: string;
  result?: LeaderboardResponse;
  error?: string;
}
```

---

## جهت: Game → Parent

### `platform:ready`

SDK بلافاصله بعد از load می‌فرستد — «آماده دریافت init هستم».

```typescript
{ type: 'platform:ready' }
```

---

### `platform:session:end`

```typescript
{
  type: 'platform:session:end';
  sessionToken: string;
}
```

---

### `platform:score:submit`

```typescript
{
  type: 'platform:score:submit';
  requestId: string;
  sessionToken: string;
  score: number;
}
```

---

### `platform:leaderboard:get`

```typescript
{
  type: 'platform:leaderboard:get';
  requestId: string;
  limit?: number;
}
```

---

## امنیت

| موضوع | رفتار |
|-------|--------|
| **Origin check** | Parent فقط پیام‌های origin مطابق `entryUrl` را می‌پذیرد |
| **Session token** | submitScore فقط با token سشن خود بازیکن |
| **targetOrigin** | Parent init را به origin بازی می‌فرستد (نه `*`) |

## پیاده‌سازی بدون SDK

اگر نمی‌خواهید از `@platform/game-sdk` استفاده کنید:

```javascript
window.parent.postMessage({ type: 'platform:ready' }, '*');

window.addEventListener('message', (e) => {
  if (e.data?.type === 'platform:init') {
    window.__platform = e.data;
  }
});
```

استفاده از SDK رسمی توصیه می‌شود — timeout، requestId و type safety را handle می‌کند.

---

## نسخه‌های SDK

| نسخه | قابلیت‌ها |
|------|-----------|
| **0.1.0** | init, getUser, getSession, isReady, endSession |
| **0.2.0** | + submitScore, getLeaderboard |

Types کامل در `@platform/types` — `SDK_VERSION`, `PlatformInboundMessage`, ...
