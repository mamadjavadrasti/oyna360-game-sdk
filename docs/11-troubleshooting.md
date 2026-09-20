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

مرورگر درخواست‌های Direct (`/dev/game-auth/exchange`، score، wallet، …) را بلاک می‌کند اگر origin در CORS / `DEV_GAME_ORIGINS` / `allowedOrigins` نباشد.

## Score / wallet در Direct خطا می‌دهد

1. `platformUrl` در `init` / `__OYNA360_DEV__` ست شده باشد (game-sdk ≥ 0.5.1).
2. Origin بازی در allowlist و CORS باشد.
3. سشن هنوز فعال باشد (`endSession` نزده باشید).

## Context بدون avatar / lobby

از game-sdk **≥ 0.5.0** استفاده کنید. نسخهٔ قدیمی‌تر فیلدها را دور می‌ریخت.

## چندبار init

مشکلی نیست؛ idempotent است. اگر می‌خواهید از صفر شروع کنید صفحه را رفرش کنید (سشن جدید با authorize دوباره).

## تداخل با lobby-sdk

- اول `PlatformSDK.init()`، بعد `PlatformLobby.create({ platformInit })`.
- `createDev()` لابی ≠ Direct Development.
- `lobby.wsUrl` را دستی `localhost:3001` نگذارید.
