# Developer Environment

بازی را روی ماشین خودتان با `npm run dev` اجرا کنید و پیش از انتشار عمومی به زیرساخت واقعی Oyna360 وصل شوید.

این مسیر **جدا از** Direct Development قدیمی (slug + authorize popup) است.

---

## جریان

```text
1. ادمین در پنل کاربران نقش «توسعه‌دهنده» را به یک حساب ثبت‌شده می‌دهد.
2. توسعه‌دهنده در oyna360.ir وارد `/developer` می‌شود و بازی را ثبت می‌کند.
3. اطلاعات بازی و دامنه‌های مجاز را تنظیم می‌کند و Dev Credential می‌سازد.
4. در بازی:

   PlatformSDK.init({
     platformUrl: 'https://oyna360.ir/api',
     platformWebUrl: 'https://oyna360.ir',
     dev: { clientId, credential },
   })

5. SDK → POST /api/dev/gateway/session
6. SdkInitPayload استاندارد → Lobby SDK / امتیاز / اوینا مارکت / …
```

هر `npm run dev` یک **Session موقت جدید** می‌سازد. Credential همان می‌ماند — بدون popup لاگین هر بار. بازی ابتدا در وضعیت «در حال توسعه» است و تا تأیید ادمین وارد کاتالوگ عمومی نمی‌شود.

---

## پیکربندی بازی

### `init`

```ts
import { PlatformSDK } from '@oyna360/game-sdk';

await PlatformSDK.init({
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  dev: {
    clientId: process.env.VITE_OYNA_DEV_CLIENT_ID!,
    credential: process.env.VITE_OYNA_DEV_CREDENTIAL!,
  },
});
```

### `window.__OYNA360_DEV__`

```ts
window.__OYNA360_DEV__ = {
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  clientId: '...',
  credential: '...',
};
await PlatformSDK.init();
```

### env نمونه

```env
VITE_PLATFORM_API_URL=https://oyna360.ir/api
VITE_PLATFORM_WEB_URL=https://oyna360.ir
VITE_OYNA_DEV_CLIENT_ID=oy_dev_...
VITE_OYNA_DEV_CREDENTIAL=oy_sec_...
```

> مقدارهایی که در Vite با پیشوند `VITE_` تعریف می‌شوند داخل فایل جاوااسکریپت
> مرورگر قرار می‌گیرند. این Credential فقط برای توسعهٔ محلی یا محیط آزمایشی با
> دامنهٔ مجاز محدود است؛ آن را در build عمومی/Production استفاده نکنید. برای اجرای
> عمومی از مسیر `/play/:slug` و اتصال Production استفاده کنید. اگر Credential
> آزمایشی افشا شد، آن را از پنل revoke یا rotate کنید.

Origin صفحه (مثلاً `http://localhost:5173`) فقط وقتی اجباری است که در بخش دامنه‌های مجاز چیزی ثبت کرده باشید.

اگر **Allowed Origins خالی** باشد، فقط Credential کافی است — روی لوکال، بیلد استیجینگ، یا هر دامنه‌ای کار می‌کند.

---

## تسترها — چند بازیکن با یک پروژه

`clientId` برای هر Dev Project **ثابت** است. هر Credential که با گزینهٔ «کاربر تست جدید» صادر شود یک **کاربر تست جدا** دارد، پس هر دستگاه `user.id` متفاوتی می‌گیرد. برای تست چندنفره لازم نیست روی چند اکانت Oyna360 پروژه بسازید.

```env
# دستگاه ۱
OYNA_DEV_CLIENT_ID=oy_dev_<project>
OYNA_DEV_CREDENTIAL=oy_sec_<tester-1>

# دستگاه ۲ — همان clientId، credential دیگر
OYNA_DEV_CLIENT_ID=oy_dev_<project>
OYNA_DEV_CREDENTIAL=oy_sec_<tester-2>
```

- همهٔ تسترهای یک پروژه **همان `game.slug`** را دارند (shell همان پروژه).
- گزینهٔ «هویت خودم» یعنی نشست با حساب صاحب پروژه ساخته می‌شود.
- حداکثر ۱۰ تستر فعال در هر پروژه. Rotate همان تستر را روی secret جدید نگه می‌دارد؛ Revoke تستر را از کار می‌اندازد.
- کاربر تست در سایت لاگین نمی‌کند و در لیست کاربران و کاتالوگ دیده نمی‌شود.
- Credentialهایی که قبل از این قابلیت ساخته شده‌اند با همان `clientId` قبلی‌شان مثل قبل کار می‌کنند و هویت صاحب پروژه را دارند.

---

## از توسعه تا انتشار

بازی توسعه‌دهنده یک رکورد بازی و slug پایدار دارد، اما در زمان توسعه از کاتالوگ
عمومی و مسیر `/play/:slug` پنهان است. همان شناسهٔ بازی برای SDK، سشن‌ها و محصولات
مارکت استفاده می‌شود و بعد از تأیید، بازی بدون ساخت رکورد یا شناسهٔ تازه منتشر
می‌شود.

پس از آماده‌شدن، از نمای کلی بازی **ارسال برای بررسی و انتشار** را انتخاب کنید.
ادمین بازی را در صف بررسی می‌بیند و یا آن را منتشر می‌کند یا همراه دلیل برای اصلاح
برمی‌گرداند. دلیل در پنل توسعه‌دهنده دیده می‌شود؛ بازی را اصلاح و دوباره ارسال
کنید. هنگام انتظار بررسی، مشخصات اصلی بازی قفل است؛ تنظیمات اتصال، Credentialها
و کاتالوگ محصولات همچنان از بخش‌های مربوط قابل مدیریت هستند.

راهنمای خرید و آماده‌کردن JSON محصولات: [اوینا مارکت](./13-oyna-market.md).

---

## Legacy Direct Dev (slug)

اگر هنوز `gameSlug` بدهید و credential ندهید، همان authorize popup قبلی کار می‌کند و نیاز به بازی **منتشرشده** دارد. برای پروژهٔ جدید از Credential استفاده کنید.

همچنین: [09-direct-development.md](./09-direct-development.md)
