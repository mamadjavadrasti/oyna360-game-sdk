# امتیاز — `submitScore`

بهترین امتیاز بازیکن برای این بازی را ثبت می‌کند (keep-best).

```ts
const result = await PlatformSDK.submitScore(4200);
// { score, previousBest, isNewBest, rank }
```

## پیش‌نیاز

- `init()` موفق
- سشن فعال
- **فعلاً فقط Production iframe** — در Direct Development این متد خطا می‌دهد تا فاز B

## قوانین

- `score` باید عدد نامنفی و finite باشد؛ اعشار truncate می‌شود.
- امتیاز بدتر از بهترین قبلی، best را عوض نمی‌کند (`isNewBest: false`).

## مثال

```ts
await PlatformSDK.init();
// … پایان مسابقه
const { isNewBest, rank } = await PlatformSDK.submitScore(finalScore);
if (isNewBest) showToast(`رکورد جدید! رتبه ${rank}`);
```

بعدی: [06-leaderboard.md](./06-leaderboard.md)
