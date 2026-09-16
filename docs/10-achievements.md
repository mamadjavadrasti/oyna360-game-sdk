# دستاوردها — Achievements

```ts
const list = await PlatformSDK.getAchievements();
// { gameSlug, achievements: [{ key, title, description, iconUrl, sortOrder, unlocked, unlockedAt }] }

const unlocked = await PlatformSDK.unlockAchievement('first_win');
// { key, title, unlocked, unlockedAt, alreadyUnlocked }
```

## نکات

- `key` باید در ادمین برای همان بازی تعریف شده باشد.
- `unlockAchievement` idempotent است؛ تکرار همان کلید `alreadyUnlocked: true` می‌دهد.
- نیاز به سشن فعال و `init()` دارد.
- **Production iframe**؛ Direct Mode در فاز B.

```ts
await PlatformSDK.init();
if (playerWon) {
  await PlatformSDK.unlockAchievement('first_win');
}
```

کلید خالی خطا می‌دهد.

بعدی: [11-troubleshooting.md](./11-troubleshooting.md)
