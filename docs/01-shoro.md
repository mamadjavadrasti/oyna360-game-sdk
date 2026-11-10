# نصب و پیش‌نیاز

## نصب

```bash
npm install @oyna360/game-sdk
# یا
pnpm add @oyna360/game-sdk
```

```json
{
  "dependencies": {
    "@oyna360/game-sdk": "^0.7.1"
  }
}
```

### به‌روزرسانی

```bash
npm install @oyna360/game-sdk@latest
# یا
pnpm update @oyna360/game-sdk
```

Import:

```ts
import { PlatformSDK } from '@oyna360/game-sdk';
// یا
import { init, getUser, submitScore } from '@oyna360/game-sdk';
```

---

## ثبت بازی در اوینا

بازی پلتفرمی را ادمین از پنل بازی‌ها ثبت و منتشر می‌کند. برای بازی توسعه‌دهنده،
ادمین ابتدا نقش «توسعه‌دهنده» را به یک حساب ثبت‌شده می‌دهد؛ توسعه‌دهنده بازی را
از `/developer` می‌سازد. این بازی در ابتدا «در حال توسعه» است و تا تأیید ادمین در
کاتالوگ عمومی یا `/play/:slug` نمایش داده نمی‌شود. بعد از تکمیل، درخواست بازبینی
ارسال می‌شود؛ ادمین می‌تواند بازی را منتشر کند یا با دلیل برای اصلاح برگرداند.
شناسه و slug بازی پس از انتشار حفظ می‌شوند.

## پیش‌نیاز اتصال بازی

| فیلد | توضیح |
|------|--------|
| `slug` | شناسه یکتای بازی در URL: `/play/{slug}` |
| `entryUrl` | آدرس باندل بازی (Production یا در Dev مثلاً `http://localhost:5180`) |
| `allowedOrigins` | لیست originهای مجاز بازی به‌صورت `scheme://host:port` |
| `minSdkVersion` | حداقل نسخهٔ سازگار runtime game-sdk (مثلاً `0.7.0`) |
| وضعیت | بازی پلتفرمی برای اجرا باید Published باشد؛ بازی توسعه‌دهنده با Developer Environment هم پیش از انتشار قابل تست است |

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

## Development — سه راه

### الف) Developer Environment (برای بازی توسعه‌دهنده)

از `clientId` و Credential بازی توسعه در `PlatformSDK.init()` استفاده کنید. راهنما:
[10-developer-environment.md](./10-developer-environment.md)

### ب) Direct Development قدیمی (slug + authorize)

بازی روی Vite؛ اتصال به سرور واقعی oyna360.  
راهنما: [09-direct-development.md](./09-direct-development.md)

### پ) iframe با entryUrl لوکال

1. در ادمین موقتاً `entryUrl` = `http://localhost:PORT`
2. `allowedOrigins` شامل همان origin
3. از `/play/{slug}` روی سرور (یا پلتفرم لوکال) وارد شوید

---

## امنیت برای بازی‌ساز

- `session.token` را در localStorage / Git نگذارید.
- USER/PASS پلتفرم را در `.env` بازی نگذارید.
- در Direct Mode از Authorize رسمی استفاده کنید؛ توکن یک‌بارمصرف است.
- Developer Credential را فقط در محیط توسعه/آزمایشی محدود به دامنه‌های مجاز استفاده کنید؛ مقدار `VITE_` داخل bundle عمومی مرورگر قرار می‌گیرد.

بعدی: [02-init.md](./02-init.md)
