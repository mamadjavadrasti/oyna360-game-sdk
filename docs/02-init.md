# `init()` و Platform Context

اولین فراخوانی تقریباً همیشه `PlatformSDK.init()` است.

## امضا

```ts
function init(options?: PlatformSdkInitOptions): Promise<SdkInitPayload>;

interface PlatformSdkInitOptions {
  /** حداکثر انتظار (ms). در iframe پیش‌فرض ~10s؛ در Direct برای authorize می‌توانید بیشتر بدهید. */
  timeout?: number;
  /** پایه API با `/api` — الزامی در Direct Development */
  platformUrl?: string;
  /** origin وب پلتفرم برای صفحه Authorize — در Direct اگر API و Web جدا باشند الزامی */
  platformWebUrl?: string;
  /** slug بازی published — الزامی در Direct Development */
  gameSlug?: string;
}
```

جایگزین تنظیمات Direct:

```ts
window.__OYNA360_DEV__ = {
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
};
```

---

## خروجی — `SdkInitPayload`

همان Context استاندارد Production (`platform:init`):

```ts
interface SdkInitPayload {
  user: SdkUser;
  session: SdkSession;
  game: SdkGameInfo;
  avatar: SdkLobbyAvatar;
  avatarBases?: Array<{ id: string; glbUrl: string }>;
  lobby?: {
    wsUrl: string;      // مثلاً https://oyna360.ir/lobby
    roomId: string;     // مثلاً game:my-game
    strictRoom?: boolean;
  };
}
```

| فیلد | کاربرد |
|------|--------|
| `user` | نمایش نام، id |
| `session` | `{ id, token }` — سشن بازی ephemeral |
| `game` | `slug` / `name` |
| `avatar` | ظاهر لابی برای lobby-sdk |
| `avatarBases` | کاتالوگ GLB مشترک (اختیاری) |
| `lobby` | آدرس WebSocket و اتاق — **هاردکد نکنید** |

---

## رفتار بر اساس محیط

### 1) داخل iframe پلتفرم (Production)

1. SDK در صورت embed بودن، `platform:ready` به parent می‌فرستد.
2. منتظر `platform:init` می‌ماند.
3. Context را ذخیره می‌کند و همان را روی `window` هم برای lobby-sdk منتشر می‌کند.

```ts
const ctx = await PlatformSDK.init({ timeout: 15_000 });
```

### 2) تب مستقیم / بدون parent (Direct Development)

1. اگر `platformUrl` + `gameSlug` نباشد → خطای واضح.
2. صفحه `/dev/game-auth` (popup یا redirect) باز می‌شود.
3. با اکانت واقعی لاگین می‌کنید.
4. code یک‌بارمصرف → `exchange` → همان `SdkInitPayload`.

```ts
const ctx = await PlatformSDK.init({
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
  timeout: 120_000,
});
```

### 3) Idempotent

اگر قبلاً init شده باشد، فراخوانی بعدی همان Promise/payload را می‌دهد.

---

## بعد از init

```ts
PlatformSDK.isReady();           // true
PlatformSDK.getUser();           // SdkUser | null
PlatformSDK.getSession();        // SdkSession | null
PlatformSDK.getInitPayload();    // SdkInitPayload | null  (کامل)
```

---

## تحویل به lobby-sdk

روش توصیه‌شده:

```ts
const init = await PlatformSDK.init({ /* … */ });
await PlatformLobby.create({
  canvas,
  platformInit: init,
  roomId: init.lobby!.roomId,
  wsUrl: init.lobby!.wsUrl,
});
```

یا بعد از `init()` می‌توانید `PlatformLobby.createFromPlatform(canvas)` را بزنید (SDK لابی از Context منتشرشده روی window استفاده می‌کند).

---

## خطاهای رایج

| پیام / وضعیت | معنی |
|--------------|------|
| `init timeout — is the game running inside the platform?` | iframe هستید ولی parent `platform:init` نفرستاده (یا دیر) |
| `requires platformUrl + gameSlug` | Direct Mode بدون تنظیم |
| `Development origin not allowed` | origin بازی در allowlist سرور نیست |
| Authorize timeout | لاگین تمام نشد / popup بلاک شد |

بعدی: [03-user-session.md](./03-user-session.md) · Direct: [09-direct-development.md](./09-direct-development.md)
