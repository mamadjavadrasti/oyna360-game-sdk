# کیف پول، خرید محصول و موجودی آیتم — نسخهٔ ۰٫۷٫۰

این نسخه علاوه بر `getWallet`، خرید مستقیم محصول، رسیدهای قابل بازیابی و موجودی/مصرف آیتم را در هر دو حالت iframe و Direct Development دارد.

> ابتدا بک‌اند و پل والدِ سازگار با Commerce 0.7 را منتشر کنید. اضافه‌کردن SDK به‌تنهایی سرور قدیمی را ارتقا نمی‌دهد. سرور قدیمی ممکن است 404 یا timeout بدهد؛ در این حالت هیچ آیتم یا سکه‌ای به کاربر اعطا نکنید.

## محصولات و خرید

```ts
const { products } = await PlatformSDK.getProducts();
// هر محصول: itemId, developerItemId?, title, currency, priceGems, priceCoins,
// grantType, grantKey, quantity, consumable, purchaseHandler
const potion = products.find((product) => product.developerItemId === 'magic_potion');
if (!potion || potion.purchaseHandler !== 'PLATFORM') throw new Error('محصول برای خرید جم در دسترس نیست');
const requestId = crypto.randomUUID();
// قبل از ارسال، شناسه را کنار خرید در ذخیره‌سازی پایدارِ بازی نگه دارید.
const receipt = await PlatformSDK.purchaseProduct(potion!.itemId, requestId);
// {id, requestId, itemId, gemsSpent, gemsRemaining, quantity, consumable, gameSlug, createdAt, ...}
```

تکرار **همان شناسه و محصول**، همان رسید را بدون کسر مجدد جم و بدون اعطای دوباره برمی‌گرداند. استفاده از همان شناسه برای محصول دیگر خطاست. برای خرید مستقل بعدی، شناسهٔ جدید بسازید. شناسه ۸ تا ۱۲۸ کاراکتر از حروف انگلیسی، عدد، `_` و `-` است.

برای محصولات دائمی، خرید مجدد با شناسهٔ متفاوت رد می‌شود. محصول مصرفی می‌تواند چند بار و با شناسه‌های مستقل خریده شود.

## بازیابی بعد از خطا، قطع اینترنت یا بسته‌شدن بازی

```ts
const status = await PlatformSDK.getPurchaseStatus(savedRequestId);
if (status.status === 'COMPLETED') applyReceiptOnce(status.receipt.id, status.receipt);
// NOT_FOUND یعنی هنوز رسید نهایی ثبت نشده؛ اثبات شکست پرداخت نیست.
// اگر خرید هنوز لازم است، با همان requestId دوباره purchaseProduct را صدا بزنید.
const page = await PlatformSDK.getPurchaseReceipts();
const nextPage = page.next ? await PlatformSDK.getPurchaseReceipts(page.next) : null;
```

رسیدها به همان **کاربر و بازی** محدودند و صفحه‌بندی ۱۰۰تایی دارند. `getPurchaseStatus` فقط ثبت نهایی (COMPLETED) یا نبود رسید نهایی (NOT_FOUND) را اعلام می‌کند؛ پرداخت بانکی یا صف خرید معلق نیست.

## موجودی و مصرف آیتم

```ts
const inventory = await PlatformSDK.getInventory();
// {gameSlug, items: [{itemId, quantity, consumable}]}
const product = (await PlatformSDK.getProducts()).products.find(
  (item) => item.developerItemId === 'magic_potion',
);
const ownedItem = inventory.items.find((item) => item.itemId === product?.itemId);
const useId = crypto.randomUUID(); // پیش از مصرف ذخیره شود
if (ownedItem) await PlatformSDK.consumeItem(ownedItem.itemId, 1, useId);
// {id, requestId, itemId, quantity, remaining, gameSlug}
```

مصرف در سرور اتمیک است؛ موجودی منفی نمی‌شود، آیتم دائمی مصرف نمی‌شود و تکرار یک مصرف با همان شناسه، دوباره کم نمی‌کند. برای بازیابی نتیجهٔ مصرف، همان `consumeItem` و همان شناسه را تکرار کنید. استفادهٔ مجدد شناسه با مقدار یا آیتم متفاوت خطاست.

## تبدیل جم به سکهٔ اقتصاد خود بازی

```ts
const wallet = await PlatformSDK.getWallet();
const id = crypto.randomUUID(); // پیش از ارسال نگه دارید
const result = await PlatformSDK.convertGems(5, id);
// {id, requestId, gemsSpent, coinsReceived, coinsPerGem, gemsRemaining, gameSlug}
const recovered = await PlatformSDK.getExchangeStatus(id);
```

بک‌اند سازگار با این نسخه، تبدیل و نتیجه را در یک تراکنش با `(userId, gameId, requestId)` ذخیره می‌کند. تلاش مجدد کسر جدید ندارد و مبلغ ناسازگار خطا می‌دهد. **اعطای سکه در اقتصاد مستقل بازی همچنان مسئولیت سرور بازی است**؛ `result.id` را فقط یک بار اعمال کنید. رسید را از کاربر دیگر یا فقط از پیام دلخواه کلاینت قبول نکنید.

اگر `requestId` را در خرید/مصرف/تبدیل ندهید، SDK برای همان فراخوانی یکی می‌سازد؛ برای بازیابی پس از بسته‌شدن بازی کافی نیست. در عملیات مهم همیشه شناسهٔ ذخیره‌شدهٔ خودتان را بدهید.

## پیکربندی محصولات

قیمت و مقدار در پلتفرم تعریف می‌شود؛ SDK قیمت دلخواه قبول نمی‌کند. توسعه‌دهنده از **پنل توسعه‌دهنده → بازی → محصولات جم** و ادمین از **مدیریت بازی → محصولات** کاتالوگ را مدیریت می‌کند. ورود گروهی فایل JSON هم در هر دو پنل پشتیبانی می‌شود؛ قالب و فایل نمونه در [راهنمای اوینا مارکت](./13-oyna-market.md) است. شناسهٔ قطعی محصول توسعه‌دهنده با پیشوند پروژه ساخته می‌شود؛ مثلاً `projectId:magic_potion`. کاتالوگ SDK هر دو مقدار را برمی‌گرداند: `developerItemId` برای اتصال به آیتم داخلی بازی و `itemId` کامل برای خرید، دریافت موجودی و مصرف. API مالک‌محور ثبت محصول `PUT /api/developer/projects/:id/products/:itemId` است؛ توکن حساب توسعه‌دهنده را داخل بازی نگذارید. مسیر ادمین `PUT /api/admin/games/:gameId/products/:itemId` نیز برای مدیریت کامل کاتالوگ در دسترس ادمین می‌ماند.

محصول دائمی باید `quantity: 1` داشته باشد. برای تغییر مصرفی/دائمی بودن یا نوع تحویل، شناسهٔ آیتم جدید تعریف کنید. `currency` واحد پرداخت را تعیین می‌کند؛ محصول `GAME_COINS` را سرور بازی می‌فروشد و نباید آن را با `purchaseProduct` خرید. `grantType: GAME_COINS` محصولی است که با جم خریده می‌شود و نتیجه‌اش بستهٔ سکه است. ثبت محصول در مارکت، مدل یا رفتار داخل بازی را ایجاد نمی‌کند. جزئیات فیلدها و مرز مسئولیت سرور بازی در [راهنمای اوینا مارکت](./13-oyna-market.md) آمده است.
