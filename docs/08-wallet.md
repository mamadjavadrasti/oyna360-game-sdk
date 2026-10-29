# کیف‌پول جِم — `getWallet` / `convertGems`

جِم ارز پلتفرم است. تبدیل به «سکه داخل بازی» با نرخ `coinsPerGem` همان بازی انجام می‌شود.

```ts
const wallet = await PlatformSDK.getWallet();
// { gems, coinsPerGem, gameSlug }

// Generate once, persist with your pending purchase, and reuse on retry.
const requestId = crypto.randomUUID();
const result = await PlatformSDK.convertGems(5, requestId);
// { gemsSpent, coinsReceived, coinsPerGem, gemsRemaining, gameSlug }
```

## مسئولیت بازی

پلتفرم جِم را کم می‌کند و `coinsReceived` را برمی‌گرداند.  
**اعتبار سکه داخل اقتصاد خودتان** با شماست (در سرور/کلاینت بازی اعمال کنید).

## درخواست پایدار و بازیابی

پارامتر دوم `convertGems(gems, requestId?)` شناسهٔ عملیات اقتصادی است. آن را **قبل از ارسال** در ذخیره‌سازی پایدار ثبت کنید و در تلاش مجدد همان عملیات از همان شناسه استفاده کنید. شناسه باید ۸ تا ۱۲۸ کاراکتر از حروف لاتین، عدد، `_` یا `-` باشد (UUID مناسب است).

**توجه: این تغییر SDK به‌تنهایی idempotency را تضمین نمی‌کند.** بک‌اند پلتفرم باید `requestId` را همراه هویت کاربر، بازی، مبلغ و نتیجهٔ تبدیل در تراکنش دیتابیس ذخیره کند، تکرار همان درخواست را بدون کسر مجدد پاسخ دهد و برای شناسه‌ای با پارامترهای ناسازگار خطا برگرداند. مسیر postMessage والد نیز باید شناسه را به بک‌اند منتقل کند. بازی باید اعطای سکه را با شناسهٔ همان تبدیل فقط یک بار اعمال کند. برای بازیابی پس از بسته‌شدن بازی، API استعلام وضعیت همان شناسه هم لازم است.

## نکات

- `gems` باید عدد صحیح مثبت باشد.
- در **Production** و **Direct Dev** هر دو کار می‌کند (iframe یا REST با session token).

```ts
try {
  const { coinsReceived } = await PlatformSDK.convertGems(amount);
  await creditLocalCoins(coinsReceived);
} catch (e) {
  showError(e);
}
```

بعدی: [09-direct-development.md](./09-direct-development.md) · [10-achievements.md](./10-achievements.md)
