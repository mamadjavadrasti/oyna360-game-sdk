# User و Session

بعد از `init()` موفق.

## خواندن sync

```ts
const user = PlatformSDK.getUser();
// { id, username, displayName, avatarUrl }

const session = PlatformSDK.getSession();
// { id, token }
```

قبل از init هر دو `null` هستند.

## نکات session

- `token` برای هویت سشن بازی است (با JWT لاگین کاربر فرق دارد).
- عمر سشن محدود است و با activity تمدید می‌شود؛ آن را دائمی فرض نکنید.
- در Git / `.env` / localStorage ذخیره نکنید.
- برای lobby-sdk همان `session.token` از Context کافی است؛ خودتان به سوکت وصل نشوید مگر عمداً کلاینت سفارشی بنویسید.

## نمایش در UI

```ts
const { user, game } = await PlatformSDK.init();
title.textContent = `${user.displayName} — ${game.name}`;
```

`avatarUrl` ممکن است `null` باشد؛ آواتار ۳D لابی از فیلد `avatar` در `getInitPayload()` می‌آید نه لزوماً از `avatarUrl`.

بعدی: [04-end-session.md](./04-end-session.md)
