# `endSession()`

سشن بازی را می‌بندد تا در آمار/idle پلتفرم باز نماند.

```ts
await PlatformSDK.endSession();
```

## رفتار

- **Production (iframe):** پیام `platform:session:end` به parent فرستاده می‌شود؛ پلتفرم سشن را می‌بندد.
- **Direct Development:** `POST {platformUrl}/sessions/end` با همان session token.

## کی صدا بزنید؟

- وقتی بازیکن از بازی خارج می‌شود
- قبل از unload صفحه (در iframe)
- بعد از اتمام مسابقه اگر سشن دیگری نمی‌سازید

چندبار صدا زدن نباید بازی را خراب کند؛ اگر سشن از قبل بسته شده باشد parent نادیده می‌گیرد.

بعدی: [05-scores.md](./05-scores.md)
