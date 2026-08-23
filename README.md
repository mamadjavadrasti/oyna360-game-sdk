# @platform/game-sdk

SDK رسمی PlayHub برای بازی‌های iframe — ارتباط با پلتفرم از طریق `postMessage`.

**نسخه فعلی:** `0.4.0`  
**بدون وابستگی runtime** — فقط کپی `dist` یا نصب از GitHub کافی است.

---

## نصب (پروژه بازی جدا)

`mamadjavadrasti/playhub-game-sdk` را با آدرس واقعی ریپوی GitHub عوض کنید.

### npm

```bash
npm install github:mamadjavadrasti/playhub-game-sdk
```

یا با تگ نسخه:

```bash
npm install github:mamadjavadrasti/playhub-game-sdk#v0.4.0
```

### pnpm

```bash
pnpm add github:mamadjavadrasti/playhub-game-sdk
# یا
pnpm add github:mamadjavadrasti/playhub-game-sdk#v0.4.0
```

### yarn

```bash
yarn add mamadjavadrasti/playhub-game-sdk#v0.4.0
```

### package.json

```json
{
  "dependencies": {
    "@platform/game-sdk": "github:mamadjavadrasti/playhub-game-sdk#v0.4.0"
  }
}
```

### نصب از همین monorepo (توسعه‌دهندگان پلتفرم)

```json
{
  "dependencies": {
    "@platform/game-sdk": "workspace:*"
  }
}
```

---

## انتشار روی GitHub (یک‌بار)

این پوشه (`packages/game-sdk`) به‌صورت **standalone** طراحی شده و می‌تواند ریپوی جدا باشد.

```bash
cd packages/game-sdk
npm run build

# ریپوی خالی روی GitHub بسازید، بعد:
git init
git add .
git commit -m "chore: release game-sdk 0.4.0"
git branch -M main
git remote add origin https://github.com/mamadjavadrasti/playhub-game-sdk.git
git push -u origin main
git tag v0.4.0
git push origin v0.4.0
```

قبل از push، در `package.json` فیلدهای `repository` / `bugs` / `homepage` را با آدرس واقعی عوض کنید.

**مهم:** همیشه قبل از تگ زدن `npm run build` بزنید تا `dist/` به‌روز باشد (نصب از Git بدون build سمت مصرف‌کننده کار می‌کند).

---

## شروع سریع

```typescript
import { PlatformSDK } from '@platform/game-sdk';

async function main() {
  const { user, game } = await PlatformSDK.init();
  console.log(`سلام ${user.displayName}! بازی: ${game.name}`);

  await PlatformSDK.submitScore(4200);

  const board = await PlatformSDK.getLeaderboard(10);
  console.log(board.entries);

  await PlatformSDK.endSession();
}

main();
```

بازی باید **داخل iframe پلتفرم** (`/play/:slug`) اجرا شود. باز کردن مستقیم URL بازی بدون پلتفرم، `init` را timeout می‌دهد.

---

## مستندات بخش‌به‌بخش

| بخش | فایل |
|-----|------|
| نصب و پیش‌نیاز | [docs/01-shoro.md](./docs/01-shoro.md) |
| `init()` | [docs/02-init.md](./docs/02-init.md) |
| user / session | [docs/03-user-session.md](./docs/03-user-session.md) |
| `endSession()` | [docs/04-end-session.md](./docs/04-end-session.md) |
| `submitScore()` | [docs/05-scores.md](./docs/05-scores.md) |
| `getLeaderboard()` | [docs/06-leaderboard.md](./docs/06-leaderboard.md) |
| پروتکل postMessage | [docs/07-postmessage-protocol.md](./docs/07-postmessage-protocol.md) |
| جِم → سکه | [docs/08-wallet.md](./docs/08-wallet.md) |

---

## API خلاصه

| متد | نسخه | توضیح |
|-----|------|--------|
| `init(options?)` | 0.1 | دریافت user + session از پلتفرم |
| `getUser()` | 0.1 | کاربر فعلی (sync) |
| `getSession()` | 0.1 | سشن فعلی (sync) |
| `isReady()` | 0.1 | آیا init انجام شده؟ |
| `endSession()` | 0.1 | بستن سشن |
| `submitScore(score)` | 0.2 | ثبت بهترین امتیاز |
| `getLeaderboard(limit?)` | 0.2 | دریافت leaderboard |
| `unlockAchievement(key)` | 0.3 | باز کردن دستاورد |
| `getAchievements()` | 0.3 | لیست دستاوردها + وضعیت بازیکن |
| `getWallet()` | 0.4 | موجودی جِم + نرخ تبدیل |
| `convertGems(gems)` | 0.4 | تبدیل جِم به سکه بازی |

---

## نسخه‌گذاری

- **`minSdkVersion`** هر بازی در پنل ادمین تنظیم می‌شود.
- SDK از [Semantic Versioning](https://semver.org/) پیروی می‌کند.
- `PlatformSDK.version` مقدار فعلی را برمی‌گرداند.

---

## پشتیبانی

- TypeScript types داخل خود پکیج هستند (بدون وابستگی به `@platform/types`).
- توسعه محلی در monorepo: `pnpm --filter @platform/game-sdk build`
