# Developer Environment

بازی را روی ماشین خودتان با `npm run dev` اجرا کنید و بدون ساختن بازی در Catalog، به زیرساخت واقعی Oyna360 وصل شوید.

این مسیر **جدا از** Direct Development قدیمی (slug + authorize popup) است.

---

## جریان

```text
1. ثبت‌نام / ورود در oyna360.ir
2. /developer → Create Dev Project → Allowed Origins
3. صدور Dev Credential (یک‌بار نمایش)
4. در بازی:

   PlatformSDK.init({
     platformUrl: 'https://oyna360.ir/api',
     platformWebUrl: 'https://oyna360.ir',
     dev: { clientId, credential },
   })

5. SDK → POST /api/dev/gateway/session
6. SdkInitPayload استاندارد → Lobby SDK / امتیاز / …
```

هر `npm run dev` یک **Session موقت جدید** می‌سازد. Credential همان می‌ماند — بدون popup لاگین هر بار.

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

Origin صفحه (مثلاً `http://localhost:5173`) فقط وقتی اجباری است که در Dev Project → Allowed Origins چیزی ثبت کرده باشید.

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

## چه چیزی ساخته نمی‌شود

- Game در Catalog عمومی
- slug قابل `/play/:slug`
- entryUrl روی سایت

Dev Project فقط برای توسعه است. انتشار بازی مسیر جدا (ادمین / Catalog) دارد.

---

## Legacy Direct Dev (slug)

اگر هنوز `gameSlug` بدهید و credential ندهید، همان authorize popup قبلی کار می‌کند و نیاز به بازی **منتشرشده** دارد. برای پروژهٔ جدید از Credential استفاده کنید.

همچنین: [09-direct-development.md](./09-direct-development.md)
