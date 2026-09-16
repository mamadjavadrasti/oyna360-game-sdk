# عیب‌یابی — game-sdk

## init timeout در Production

1. آیا صفحه از `/play/{slug}` باز شده؟
2. آیا `entryUrl` و origin iframe درست است؟
3. کنسول parent را برای خطای launch/session ببینید.
4. `PlatformSDK.version` با `minSdkVersion` بازی سازگار باشد.

## Direct: «requires platformUrl + gameSlug»

`init` را با گزینه‌ها صدا بزنید یا `window.__OYNA360_DEV__` را قبل از init ست کنید.

## Direct: origin not allowed

```js
console.log(location.origin);
```

همین مقدار را در `allowedOrigins` بازی یا `DEV_GAME_ORIGINS` سرور بگذارید.

## Direct: CORS

مرورگر درخواست `POST …/dev/game-auth/exchange` را بلاک می‌کند اگر origin در CORS نباشد. با DevOps پلتفرم هماهنگ کنید.

## Score / wallet در Direct خطا می‌دهد

عمدی است تا فاز B. برای تست امتیاز از مسیر Production iframe استفاده کنید.

## Context بدون avatar / lobby

از game-sdk **≥ 0.5.0** استفاده کنید. نسخهٔ قدیمی‌تر فیلدها را دور می‌ریخت.

## چندبار init

مشکلی نیست؛ idempotent است. اگر می‌خواهید از صفر شروع کنید صفحه را رفرش کنید (سشن جدید با authorize دوباره).

## تداخل با lobby-sdk

- اول `PlatformSDK.init()`، بعد `PlatformLobby.create({ platformInit })`.
- `createDev()` لابی ≠ Direct Development.
- `lobby.wsUrl` را دستی `localhost:3001` نگذارید.
