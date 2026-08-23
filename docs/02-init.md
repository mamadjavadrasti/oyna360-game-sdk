# 02 — `init()`

## توضیح

اولین متدی که باید صدا بزنید. منتظر می‌ماند تا پلتفرم اطلاعات **کاربر**، **سشن** و **بازی** را بفرستد.

## امضا

```typescript
function init(options?: { timeout?: number }): Promise<SdkInitPayload>;
```

| پارامتر | پیش‌فرض | توضیح |
|---------|---------|--------|
| `options.timeout` | `10000` (ms) | حداکثر انتظار برای init |

## خروجی — `SdkInitPayload`

```typescript
interface SdkInitPayload {
  user: SdkUser;
  session: SdkSession;
  game: SdkGameInfo;
}

interface SdkUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface SdkSession {
  id: string;
  token: string;   // برای API سمت سرور — SDK خودش استفاده می‌کند
}

interface SdkGameInfo {
  slug: string;
  name: string;
}
```

## مثال

```typescript
import { PlatformSDK } from '@platform/game-sdk';

try {
  const { user, session, game } = await PlatformSDK.init({ timeout: 15_000 });

  document.getElementById('player')!.textContent = user.displayName;
  console.log('Session:', session.id);
  console.log('Game:', game.slug);
} catch (err) {
  console.error('SDK init failed:', err);
  // بازی را در حالت مهمان یا offline ادامه دهید
}
```

## رفتار داخلی

1. SDK بلافاصله بعد از load، `platform:ready` به parent می‌فرستد.
2. Parent (GameLauncher) با `platform:init` پاسخ می‌دهد.
3. اگر init قبلاً انجام شده باشد، `init()` فوراً resolve می‌شود (idempotent).

## نکات

- **همیشه** قبل از `submitScore` / `getLeaderboard` یک بار `init()` صدا بزنید (یا از متدهایی استفاده کنید که خودشان init می‌کنند).
- `getUser()` قبل از init مقدار `null` برمی‌گرداند.
- token سشن را در localStorage بازی ذخیره **نکنید** — فقط در حافظه SDK معتبر است.

## بعدی

→ [03-user-session.md](./03-user-session.md)
