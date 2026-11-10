# اوینا مارکت و محصولات بازی

این راهنما برای تعریف کاتالوگ محصول، آماده‌کردن فایل JSON و اتصال خریدهای بازی به
`@oyna360/game-sdk` است. کاتالوگ، قیمت و ثبت رسید را اوینا نگه می‌دارد؛ ساخت
مدل، تصویر و رفتار واقعی آیتم داخل بازی با توسعه‌دهنده است.

## پیش‌نیاز

1. بازی را در پنل توسعه‌دهنده ثبت کنید و SDK را با `clientId` و Credential وصل کنید.
2. از بخش **محصولات جم** برای بازی محصول بسازید یا فایل JSON را وارد کنید.
3. پس از آماده‌شدن بازی، آن را برای بازبینی بفرستید. ادمین می‌تواند آن را منتشر
   کند یا با نوشتن دلیل برای اصلاح برگرداند.

فایل‌های نمونهٔ آماده:

- [نمونهٔ JSON پنل توسعه‌دهنده](./examples/oyna-market-developer.json)
- [نمونهٔ JSON پنل ادمین](./examples/oyna-market-admin.json)

## دریافت کاتالوگ و خرید با جم

```ts
import { PlatformSDK } from '@oyna360/game-sdk';

await PlatformSDK.init(/* تنظیمات محیط بازی */);

const { products } = await PlatformSDK.getProducts();
const product = products.find((item) => item.developerItemId === 'magic_potion');

if (product?.purchaseHandler === 'PLATFORM') {
  // شناسهٔ درخواست را پیش از ارسال ذخیره کنید تا خرید پس از قطع اتصال قابل بازیابی باشد.
  const requestId = crypto.randomUUID();
  const receipt = await PlatformSDK.purchaseProduct(product.itemId, requestId);
  console.log(receipt.id, receipt.quantity, receipt.gemsRemaining);
}
```

در بازی توسعه‌دهنده، `developerItemId` همان SKU محلی داخل JSON است؛ `itemId` شناسهٔ
کامل و قطعی برای فراخوانی SDK است و معمولاً پیشوند شناسهٔ پروژه را هم دارد.
شناسهٔ محلی را به کد یا محتوای بازی وصل کنید، اما هنگام خرید از `product.itemId`
استفاده کنید. قیمت را از کلاینت به سرور نفرستید؛ قیمت از کاتالوگ سرور خوانده می‌شود.
پنل توسعه‌دهنده این پیشوند را خودکار اضافه می‌کند. اگر ادمین محصول بازی توسعه‌دهنده
را از پنل ادمین وارد می‌کند، `itemId` فایل باید به‌شکل
`<developerProjectId>:<localSKU>` باشد؛ نمونهٔ ادمین در این راهنما برای بازی
پلتفرمی است و شناسه‌های ساده دارد.

اگر پاسخ خرید به بازی نرسید، همان `requestId` را با
`PlatformSDK.getPurchaseStatus(requestId)` بررسی کنید. برای تکرار همان خرید نیز
همان شناسه را دوباره استفاده کنید. برای خرید جدید شناسهٔ تازه بسازید.

## معنی فیلدهای محصول

| فیلد | معنی |
|---|---|
| `itemId` | شناسهٔ محصول. در پنل توسعه‌دهنده SKU محلی است؛ در پنل ادمین شناسهٔ محصول در همان بازی است. |
| `title` | نامی که در فروشگاه بازی نمایش می‌دهید. |
| `priceGems` | قیمت به جم. اگر `currency` برابر `GEMS` است باید مثبت باشد؛ در غیر این صورت صفر. |
| `currency` | واحد پرداخت: `GEMS` یا `GAME_COINS`. |
| `priceCoins` | قیمت به سکهٔ بازی. اگر `currency` برابر `GAME_COINS` است باید مثبت باشد؛ در غیر این صورت صفر. |
| `grantType` | نوع نتیجهٔ ثبت‌شده: `ITEM` یا `GAME_COINS`. با واحد پرداخت یکی نیست. |
| `grantKey` | شناسهٔ آیتم داخل بازی برای `ITEM`؛ می‌تواند `null` باشد. |
| `quantity` | تعداد آیتم یا مقدار بسته‌ای که هر خرید می‌دهد. عدد صحیح مثبت باشد. |
| `consumable` | `true` برای محصول قابل خرید/مصرف مجدد؛ `false` برای مالکیت دائمی. محصول دائمی باید `quantity: 1` داشته باشد. |
| `active` | محصول فعال در کاتالوگ خرید باشد یا نه. محصول غیرفعال از فهرست عمومی SDK پنهان است. |
| `purchaseHandler` | در پاسخ کاتالوگ، `PLATFORM` یعنی خرید جم با SDK؛ `GAME_SERVER` یعنی خرید با سکهٔ بازی و سرور بازی. این فیلد را در JSON ننویسید. |

واحد پرداخت و نتیجهٔ خرید مستقل‌اند. برای نمونه، `currency: "GEMS"` و
`grantType: "GAME_COINS"` یعنی بازیکن با جم یک بستهٔ سکه می‌خرد. در مقابل،
`currency: "GAME_COINS"` یعنی خود بازی باید پرداخت را از دفترکل سکهٔ بازی انجام
دهد؛ برای چنین محصولی `purchaseProduct` را صدا نزنید. سرور بازی باید موجودی و
پرداخت را اتمیک بررسی کند.

## ورود فایل JSON

در صفحهٔ محصولات، **دانلود نمونه JSON** را بزنید، ردیف‌ها را ویرایش کنید و فایل
را با پسوند `.json` بارگذاری کنید. ساختار فایل باید یک آرایهٔ JSON باشد؛ هر خانه
یک محصول است. پیش‌نمایش و خطاها پیش از ثبت نشان داده می‌شوند.

قواعد فایل:

- حداکثر ۱ مگابایت و ۱۰۰ محصول در هر فایل.
- `itemId` در همان فایل تکراری نباشد؛ فقط حروف انگلیسی، عدد، `:`, `_` و `-`.
  حداکثر ۱۰۰ نویسه برای ادمین و ۷۴ نویسه برای SKU محلی توسعه‌دهنده.
- عنوان ۱ تا ۱۲۰ نویسه باشد. قیمت و تعداد عدد صحیح مثبت حداکثر `2147483647` باشند.
- قیمت واحد انتخاب‌شده مثبت و قیمت واحد دیگر صفر باشد.
- `consumable` و `active` مقدار `true` یا `false` داشته باشند.
- برای محصول دائمی `quantity` را ۱ بگذارید.
- `grantKey` در پنل ادمین، در صورت استفاده، حداکثر ۱۰۰ نویسه و فقط از حروف انگلیسی، عدد، `:`, `_` و `-` باشد.
- `grantType: "GAME_COINS"` فقط برای خرید با جم و محصول مصرفی قابل استفاده است.
- در پنل توسعه‌دهنده فقط محصول جم با `grantType: "ITEM"` ثبت می‌شود. برای تنظیم
  قیمت با سکهٔ بازی یا بستهٔ سکه از پنل ادمین استفاده کنید.

اگر شناسه‌ای از قبل در همان بازی وجود داشته باشد، پنل پیش از ثبت تأیید می‌گیرد و
مقادیر مجاز آن محصول را به‌روزرسانی می‌کند. محصولات حذف نمی‌شوند و ردیف‌هایی که
در فایل نیستند دست‌نخورده می‌مانند. خطاهای مربوط به هر محصول بعد از ورود گزارش
می‌شوند؛ مثلاً تغییر نوع مصرفی یا تغییر `grantType` یک شناسهٔ قبلی پذیرفته نمی‌شود.

### نمونهٔ توسعه‌دهنده

نمونهٔ کامل قابل ویرایش: [oyna-market-developer.json](./examples/oyna-market-developer.json)

```json
[
  {
    "itemId": "magic_potion",
    "title": "معجون جادویی",
    "priceGems": 20,
    "quantity": 1,
    "consumable": true,
    "active": true
  }
]
```

در این حالت `currency`، `priceCoins`، `grantType` و `grantKey` از مقادیر پیش‌فرض
محصول جم گرفته می‌شوند. برای اتصال به کد بازی، `magic_potion` را با
`developerItemId` پیدا کنید و `itemId` برگشتی را به خرید بدهید.

### نمونهٔ ادمین با دو نوع پرداخت

نمونهٔ کامل، شامل خرید جم، بستهٔ سکه و خرید با سکهٔ خود بازی:
[oyna-market-admin.json](./examples/oyna-market-admin.json)

```json
[
  {
    "itemId": "starter_outfit",
    "title": "لباس آغازین",
    "currency": "GEMS",
    "priceGems": 75,
    "priceCoins": 0,
    "grantType": "ITEM",
    "grantKey": "starter_outfit",
    "quantity": 1,
    "consumable": false,
    "active": true
  },
  {
    "itemId": "gold_pack_100",
    "title": "بستهٔ ۱۰۰ سکه",
    "currency": "GEMS",
    "priceGems": 10,
    "priceCoins": 0,
    "grantType": "GAME_COINS",
    "grantKey": null,
    "quantity": 100,
    "consumable": true,
    "active": true
  },
  {
    "itemId": "shield_coin",
    "title": "سپر",
    "currency": "GAME_COINS",
    "priceGems": 0,
    "priceCoins": 150,
    "grantType": "ITEM",
    "grantKey": "shield",
    "quantity": 1,
    "consumable": false,
    "active": true
  }
]
```

## مرز مسئولیت اوینا و بازی

- اوینا فهرست محصول، قیمت، کسر جم، رسید و موجودی پلتفرمی را نگه می‌دارد.
- `getProducts()` فقط محصولات فعال را برمی‌گرداند؛ قیمت و نوع پرداخت را از همین
  پاسخ بخوانید.
- برای `purchaseHandler: "PLATFORM"` خرید را با SDK انجام دهید. ثبت محصول به‌تنهایی
  مدل، لباس یا قابلیت بازی را نمی‌سازد.
- برای `purchaseHandler: "GAME_SERVER"` خرید و کم‌کردن سکه باید در سرور معتبر بازی
  انجام شود. موجودی مرورگر یا مقدار ارسالی کلاینت مدرک پرداخت نیست.
- اگر نتیجهٔ رسید باید به آیتم داخل بازی تبدیل شود، سرور بازی آن را با شناسهٔ
  یکتای رسید فقط یک‌بار اعمال کند.

## APIهای مرتبط

- کاتالوگ SDK: `PlatformSDK.getProducts()`
- خرید جم: `PlatformSDK.purchaseProduct(itemId, requestId)`
- بازیابی خرید: `PlatformSDK.getPurchaseStatus(requestId)`
- رسیدها: `PlatformSDK.getPurchaseReceipts(cursor?)`
- موجودی پلتفرمی: `PlatformSDK.getInventory()` و `PlatformSDK.consumeItem(itemId, quantity, requestId)`
- پنل توسعه‌دهنده: `/developer/projects/:id/products` و
  `POST /api/developer/projects/:id/products/import`
- پنل ادمین: `/admin/games/:gameId/products` و
  `POST /api/admin/games/:gameId/products/import`

جزئیات ایمنی تکرار خرید، رسید و مصرف در [راهنمای کیف پول و خرید](./08-wallet.md)
است.
