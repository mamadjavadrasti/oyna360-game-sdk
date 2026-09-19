# Direct Development Mode

بازی را روی **Host توسعه خودتان** اجرا کنید و به **سرور واقعی oyna360** وصل شوید — بدون iframe و بدون کلون پلتفرم.

هدف: سشن واقعی + Context کامل + لابی واقعی + امتیاز / لیدربورد / جِم / دستاورد از طریق REST مستقیم به API (بدون iframe).

Origin بازی باید در allowlist و CORS باشد (`DEV_GAME_ORIGINS` و/یا `allowedOrigins` بازی).

---

## جریان

```text
npm run dev
   → بازی روی مثلاً http://localhost:5180 یا هر origin دیگر
   → PlatformSDK.init({ platformUrl, platformWebUrl, gameSlug })
   → صفحه Authorize oyna360 (لاگین اکانت واقعی)
   → one-time code (کوتاه‌عمر، یک‌بارمصرف)
   → SdkInitPayload = همان شکل platform:init
   → PlatformLobby.create({ platformInit })
   → WebSocket لابی واقعی
```

رمز عبور یا `SESSION_TOKEN` دائمی داخل پروژهٔ بازی نگذارید.

---

## پیکربندی سمت بازی

### گزینه ۱ — آرگومان `init`

```ts
await PlatformSDK.init({
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
  timeout: 120_000,
});
```

### گزینه ۲ — `window.__OYNA360_DEV__`

```ts
window.__OYNA360_DEV__ = {
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
};
await PlatformSDK.init();
```

### گزینه ۳ — env باندلر (Vite)

```env
VITE_PLATFORM_API_URL=https://oyna360.ir/api
VITE_PLATFORM_WEB_URL=https://oyna360.ir
VITE_PLATFORM_GAME_SLUG=my-game
```

در boot قبل از `init` آن‌ها را روی `__OYNA360_DEV__` بگذارید.

**لوکال پلتفرم:** اگر API روی `:3001` و Web روی `:3000` است، هر دو URL را جدا بدهید؛ فقط `platformUrl` کافی نیست.

---

## پیکربندی سمت پلتفرم (ادمین / DevOps)

Origin بازی باید مجاز باشد. سرور اتحاد این‌ها را چک می‌کند:

1. env `DEV_GAME_ORIGINS` (لیست با ویرگول)
2. `allowedOrigins` همان بازی در ادمین
3. origin استخراج‌شده از `entryUrl`

مثال:

```env
DEV_GAME_ORIGINS=http://localhost:5180,http://127.0.0.1:5173,http://192.168.1.20:5180
```

همان originها برای **CORS** API هم باید دیده شوند (از طریق `DEV_GAME_ORIGINS` یا `CORS_ORIGINS`).  
`Access-Control-Allow-Origin: *` برای این مسیر استفاده نمی‌شود.

پورت خاصی فرض نشده؛ هر `scheme://host:port` معتبر که allowlist شده باشد کار می‌کند.

---

## اتصال به لابی

```ts
import { PlatformSDK } from '@oyna360/game-sdk';
import { PlatformLobby } from '@oyna360/lobby-sdk';

const init = await PlatformSDK.init({
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
});

const lobby = await PlatformLobby.create({
  canvas: document.getElementById('lobby') as HTMLCanvasElement,
  platformInit: init,
  roomId: init.lobby!.roomId,
  wsUrl: init.lobby!.wsUrl,
});

lobby.applyPlazaLayout({
  onRoomStart: (room) => {
    lobby.destroy();
    startMatch(room.id);
  },
});
```

`createDev()` لابی را برای این مسیر استفاده نکنید؛ آن Fake/Offline است.

---

## تفاوت با Production

| | Production | Direct Dev |
|--|------------|------------|
| باز شدن بازی | `/play/{slug}` + iframe | origin خودتان |
| Auth | لاگین پلتفرم قبل از play | Authorize هنگام `init` |
| Context | `platform:init` | همان شکل بعد از exchange |
| Score / wallet / achievement | ✅ postMessage | ✅ REST مستقیم |
| لابی واقعی | ✅ | ✅ |
| `endSession` | ✅ postMessage | ✅ REST `/sessions/end` |

کد بازی ترجیحاً `if (dev)` نداشته باشد؛ همان `init()` در هر دو حالت.

---

## عیب‌یابی سریع

| مشکل | کار |
|------|-----|
| Popup بسته می‌شود / بلاک | اجازه popup بدهید یا منتظر redirect با `?oyna_dev_code=` بمانید |
| `Development origin not allowed` | origin فعلی (`location.origin`) را به allowlist اضافه کنید |
| CORS error روی exchange / score / wallet | همان origin در `DEV_GAME_ORIGINS` یا `allowedOrigins` بازی |
| `Direct API calls require platformUrl` | `platformUrl` را در `init` یا `__OYNA360_DEV__` بگذارید |
| لابی وصل نمی‌شود | `init.lobby.wsUrl` را لاگ کنید؛ نباید localhost فرضی باشد مگر سرور لوکال |
| Avatar لود نمی‌شود | URLهای `/uploads` باید از origin API مطلق باشند (از Context سرور می‌آیند) |

بعدی: [10-achievements.md](./10-achievements.md) · [11-troubleshooting.md](./11-troubleshooting.md)
