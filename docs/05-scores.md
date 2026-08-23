# 05 — `submitScore()`

**نسخه SDK:** `0.2.0+`

## توضیح

امتیاز بازیکن را ثبت می‌کند. برای هر `(user, game)` فقط **بهترین امتیاز** نگه داشته می‌شود (high score).

## امضا

```typescript
function submitScore(score: number): Promise<SubmitScoreResponse>;
```

| پارامتر | نوع | توضیح |
|---------|-----|--------|
| `score` | `number` | عدد صحیح ≥ 0 |

## خروجی — `SubmitScoreResponse`

```typescript
interface SubmitScoreResponse {
  score: number;           // بهترین امتیاز فعلی
  previousBest: number | null;
  isNewBest: boolean;      // آیا این submit رکورد جدید زد؟
  rank: number;            // رتبه فعلی در leaderboard
}
```

## مثال — پایان بازی

```typescript
import { PlatformSDK } from '@platform/game-sdk';

async function onGameOver(points: number) {
  await PlatformSDK.init();

  try {
    const result = await PlatformSDK.submitScore(points);

    if (result.isNewBest) {
      showToast(`رکورد جدید! رتبه ${result.rank}`);
    } else {
      showToast(`بهترین شما: ${result.score} — رتبه ${result.rank}`);
    }
  } catch (err) {
    console.warn('Score submit failed', err);
  }
}
```

## مثال — امتیاز لحظه‌ای (checkpoint)

```typescript
// هر 60 ثانیه بهترین progress را بفرستید
setInterval(async () => {
  if (currentScore > lastSubmitted) {
    await PlatformSDK.submitScore(currentScore);
    lastSubmitted = currentScore;
  }
}, 60_000);
```

## API سمت سرور

```
POST /api/games/:slug/scores
Authorization: Bearer <sessionToken>
Body: { "score": 12500 }
```

SDK این را از طریق postMessage bridge انجام می‌دهد — **نیازی به فراخوانی مستقیم API از بازی نیست**.

## قوانین

- امتیاز **کمتر** از رکورد قبلی ذخیره نمی‌شود، ولی `rank` بر اساس best فعلی برمی‌گردد.
- امتیاز اعشاری به **integer** گرد می‌شود (`Math.floor`).
- سشن باید **فعال** باشد (همان tab play باز باشد).

## خطاها

| پیام | علت |
|------|-----|
| `Platform SDK request timeout` | parent پاسخ نداد — reload صفحه play |
| `Session does not match game` | slug بازی با سشن همخوان نیست |
| `Invalid or expired session` | سشن بسته شده — `init()` دوباره |

## بعدی

→ [06-leaderboard.md](./06-leaderboard.md)
