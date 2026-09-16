# نصب و پیش‌نیاز

## نصب

```bash
npm install github:mamadjavadrasti/playhub-game-sdk#v0.5.0
```

Import:

```ts
import { PlatformSDK } from '@platform/game-sdk';
// یا
import { init, getUser, submitScore } from '@platform/game-sdk';
```

---

## پیش‌نیاز ثبت بازی در ادمین oyna360

| فیلد | توضیح |
|------|--------|
| `slug` | شناسه یکتای بازی در URL: `/play/{slug}` |
| `entryUrl` | آدرس باندل بازی (Production یا در Dev مثلاً `http://localhost:5180`) |
| `allowedOrigins` | لیست originهای مجاز بازی به‌صورت `scheme://host:port` |
| `minSdkVersion` | حداقل نسخه game-sdk (مثلاً `0.5.0`) |
| وضعیت | بازی باید Published باشد |

### مثال Origin

درست:

- `https://games.example.com`
- `http://localhost:5180`
- `http://127.0.0.1:5173`
- `http://192.168.1.20:5180`

غلط:

- فقط `localhost` بدون scheme
- `*`
- path مثل `http://localhost:5180/game/` به‌جای origin (origin همان `http://localhost:5180` است)

---

## Production — جریان بازیکن

1. بازیکن در oyna360 لاگین می‌کند.
2. به `/play/{slug}` می‌رود.
3. پلتفرم سشن بازی می‌سازد و بازی را در iframe از `entryUrl` لود می‌کند.
4. game-sdk با `platform:ready` اعلام آمادگی می‌کند.
5. پلتفرم `platform:init` می‌فرستد.
6. `PlatformSDK.init()` resolve می‌شود.

بازی را **مستقیم** با باز کردن `entryUrl` در تب خالی تست Production نکنید؛ بدون parent، مسیر iframe کار نمی‌کند (مگر Direct Development را پیکربندی کرده باشید).

---

## Development — دو راه

### الف) Direct Development (پیشنهادی اگر پلتفرم لوکال ندارید)

بازی روی Vite؛ اتصال به سرور واقعی oyna360.  
راهنما: [09-direct-development.md](./09-direct-development.md)

### ب) iframe با entryUrl لوکال

1. در ادمین موقتاً `entryUrl` = `http://localhost:PORT`
2. `allowedOrigins` شامل همان origin
3. از `/play/{slug}` روی سرور (یا پلتفرم لوکال) وارد شوید

---

## امنیت برای بازی‌ساز

- `session.token` را در localStorage / Git نگذارید.
- USER/PASS پلتفرم را در `.env` بازی نگذارید.
- در Direct Mode از Authorize رسمی استفاده کنید؛ توکن یک‌بارمصرف است.

بعدی: [02-init.md](./02-init.md)
