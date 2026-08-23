# 01 — شروع و نصب

## این SDK چیست؟

`@platform/game-sdk` پل ارتباطی بین **بازی شما** (در iframe) و **پلتفرم PlayHub** (صفحه parent) است.  
همهٔ درخواست‌ها از طریق **`window.postMessage`** انجام می‌شود — بازی مستقیماً به API پلتفرم وصل نمی‌شود و نیازی به تنظیم CORS روی سرور بازی نیست.

## پیش‌نیازها

1. بازی روی URL خارجی (`entryUrl`) host شده باشد.
2. `allowedOrigins` بازی در پنل ادمین شامل origin سرور بازی باشد.
3. بازیکن از مسیر **`/play/:slug`** وارد شده و لاگین کرده باشد.
4. `minSdkVersion` بازی ≤ نسخه SDK شما (پیش‌فرض `0.1.0`).

## نصب

> آدرس `mamadjavadrasti/playhub-game-sdk` را با ریپوی واقعی GitHub عوض کنید.

### از GitHub (پیشنهادی برای بازی‌سازان)

**npm**

```bash
npm install github:mamadjavadrasti/playhub-game-sdk#v0.4.0
```

**pnpm**

```bash
pnpm add github:mamadjavadrasti/playhub-game-sdk#v0.4.0
```

**yarn**

```bash
yarn add mamadjavadrasti/playhub-game-sdk#v0.4.0
```

**در `package.json`**

```json
{
  "dependencies": {
    "@platform/game-sdk": "github:mamadjavadrasti/playhub-game-sdk#v0.4.0"
  }
}
```

### Monorepo پلتفرم (توسعه داخلی)

```json
{
  "dependencies": {
    "@platform/game-sdk": "workspace:*"
  }
}
```

```bash
pnpm --filter @platform/game-sdk build
```

### کپی دستی `dist` (بدون package manager)

1. از ریپو `dist/index.js` و در صورت نیاز `dist/index.d.ts` را بردارید.
2. در بازی import کنید یا با bundler به باندل اضافه کنید.

## Import

```typescript
// همه متدها
import { PlatformSDK } from '@platform/game-sdk';

// یا tree-shake
import {
  init,
  getUser,
  submitScore,
  getLeaderboard,
  unlockAchievement,
  getAchievements,
  getWallet,
  convertGems,
  endSession,
} from '@platform/game-sdk';
```

## جریان کلی

```
بازی (iframe)                    پلتفرم (parent)
     │                                  │
     │──── platform:ready ─────────────►│
     │◄─── platform:init ──────────────│  (user, session, game)
     │                                  │
     │──── platform:score:submit ──────►│──► API
     │◄─── platform:score:result ───────│
     │                                  │
     │──── platform:session:end ───────►│──► بستن سشن
```

## خطاهای رایج

| خطا | علت | راه‌حل |
|-----|-----|--------|
| `init timeout` | بازی خارج از iframe پلتفرم باز شده | فقط از `/play/:slug` تست کنید |
| `Session token missing` | سشن منقضی یا بسته شده | `init()` دوباره یا reload صفحه play |
| `Score must be a non-negative number` | امتیاز منفی یا NaN | عدد صحیح ≥ 0 بفرستید |
| پکیج resolve نمی‌شود | آدرس GitHub اشتباه / تگ نیست | `YOUR_ORG` و `#v0.4.0` را چک کنید؛ `dist/` در ریپو باشد |

## بعدی

→ [02-init.md](./02-init.md)
