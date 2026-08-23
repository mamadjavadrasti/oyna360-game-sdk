# 04 — `endSession()`

## توضیح

به پلتفرم اعلام می‌کند بازیکن بازی را ترک کرده. سشن در سرور بسته می‌شود و **مدت بازی** (`durationSec`) ثبت می‌گردد.

## امضا

```typescript
function endSession(): Promise<void>;
```

## مثال

```typescript
// وقتی بازیکن دکمه خروج را زد
async function onQuit() {
  await PlatformSDK.submitScore(finalScore); // اختیاری — قبل از end
  await PlatformSDK.endSession();
  window.location.href = '/'; // یا پیام «بازگشت به پلتفرم»
}

// قبل از بستن تب (اختیاری)
window.addEventListener('pagehide', () => {
  void PlatformSDK.endSession();
});
```

## رفتار

1. SDK پیام `platform:session:end` با `sessionToken` به parent می‌فرستد.
2. Parent درخواست `POST /api/sessions/end` می‌زند.
3. اگر کاربر صفحه play را ببندد، parent خودش سشن را می‌بندد — فراخوانی دستی `endSession()` اختیاری ولی توصیه می‌شود.

## نکات

- بعد از `endSession()`، submitScore ممکن است fail شود (سشن بسته شده).
- در **preview ادمین** سشن واقعی ثبت نمی‌شود.
- چند بار صدا زدن بی‌ضرر است — API idempotent است.

## بعدی

→ [05-scores.md](./05-scores.md)
