# @oyna360/game-sdk

SDK رسمی اتصال **بازی شما** به **پلتفرم oyna360**.

با این پکیج بازی می‌تواند:

- هویت بازیکن و سشن را بگیرد
- امتیاز، لیدربورد، دستاورد و کیف‌پول جِم را صدا بزند
- در **Production** داخل iframe پلتفرم کار کند
- در **Development** بدون iframe، مستقیم به سرور oyna360 وصل شود

**نسخه:** `0.5.2` · بدون وابستگی runtime · TypeScript داخل پکیج

> این SDK مسئول لابی ۳D نیست. برای لابی از [`@oyna360/lobby-sdk`](https://www.npmjs.com/package/@oyna360/lobby-sdk) استفاده کنید. این دو پکیج را ادغام نکنید.

---

## نصب

```bash
npm install @oyna360/game-sdk
# یا
pnpm add @oyna360/game-sdk
```

```json
{
  "dependencies": {
    "@oyna360/game-sdk": "^0.5.2"
  }
}
```

نسخه را در [npm](https://www.npmjs.com/package/@oyna360/game-sdk) ببینید و با `^` یا نسخهٔ دقیق پین کنید.

### به‌روزرسانی

```bash
npm install @oyna360/game-sdk@latest
# یا
pnpm update @oyna360/game-sdk
```

---

## دو حالت اجرا

| حالت | چطور بازی باز می‌شود | `init()` از کجا Context می‌گیرد |
|------|----------------------|----------------------------------|
| **Production** | بازیکن از `https://oyna360.ir/play/{slug}` وارد می‌شود؛ بازی داخل iframe است | `postMessage` → `platform:init` از parent |
| **Direct Development** | شما `npm run dev` می‌زنید و بازی را مستقیم روی origin خودتان باز می‌کنید | Authorize با اکانت واقعی → سشن موقت → همان `SdkInitPayload` |

در هر دو حالت API بازی یکسان است:

```ts
import { PlatformSDK } from '@oyna360/game-sdk';

const { user, game, session, avatar, lobby } = await PlatformSDK.init({
  // فقط برای Direct Development لازم است:
  // platformUrl: 'https://oyna360.ir/api',
  // platformWebUrl: 'https://oyna360.ir',
  // gameSlug: 'my-game',
});
```

---

## شروع سریع — Production

1. بازی را روی URL عمومی host کنید.
2. در پنل ادمین oyna360: `slug`، `entryUrl`، `allowedOrigins`، `minSdkVersion`.
3. بازیکن از `/play/{slug}` وارد شود.

```ts
import { PlatformSDK } from '@oyna360/game-sdk';

async function boot() {
  const { user, game } = await PlatformSDK.init({ timeout: 15_000 });
  console.log(user.displayName, game.slug);

  // گیم‌پلی…
  await PlatformSDK.submitScore(4200);
  await PlatformSDK.endSession();
}

boot().catch(console.error);
```

---

## شروع سریع — Direct Development

بدون کلون کردن پلتفرم:

```ts
await PlatformSDK.init({
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
});
```

یا قبل از `init`:

```ts
window.__OYNA360_DEV__ = {
  platformUrl: 'https://oyna360.ir/api',
  platformWebUrl: 'https://oyna360.ir',
  gameSlug: 'my-game',
};
await PlatformSDK.init();
```

پنجرهٔ ورود oyna360 باز می‌شود؛ با اکانت واقعی وارد می‌شوید؛ SDK Context کامل (شامل `avatar` و `lobby`) را می‌گیرد.

در Direct Development همان APIهای امتیاز، لیدربورد، دستاورد و کیف‌پول از طریق REST مستقیم به `platformUrl` صدا زده می‌شوند (بدون iframe). Origin بازی باید در `DEV_GAME_ORIGINS` / `allowedOrigins` و CORS باشد.

جزئیات و تنظیم Origin: [docs/09-direct-development.md](./docs/09-direct-development.md)

---

## مستندات

| موضوع | فایل |
|--------|------|
| این SDK چیست / مرز با lobby-sdk | [docs/00-overview.md](./docs/00-overview.md) |
| نصب و پیش‌نیاز ادمین | [docs/01-shoro.md](./docs/01-shoro.md) |
| `init()` و `SdkInitPayload` | [docs/02-init.md](./docs/02-init.md) |
| user / session | [docs/03-user-session.md](./docs/03-user-session.md) |
| پایان سشن | [docs/04-end-session.md](./docs/04-end-session.md) |
| امتیاز | [docs/05-scores.md](./docs/05-scores.md) |
| لیدربورد | [docs/06-leaderboard.md](./docs/06-leaderboard.md) |
| پروتکل postMessage | [docs/07-postmessage-protocol.md](./docs/07-postmessage-protocol.md) |
| جِم و سکه | [docs/08-wallet.md](./docs/08-wallet.md) |
| Direct Development Mode | [docs/09-direct-development.md](./docs/09-direct-development.md) |
| دستاوردها | [docs/10-achievements.md](./docs/10-achievements.md) |
| عیب‌یابی | [docs/11-troubleshooting.md](./docs/11-troubleshooting.md) |

---

## API خلاصه

| متد | توضیح | Production | Direct Dev |
|-----|--------|:----------:|:----------:|
| `init(options?)` | دریافت Context پلتفرم | ✅ | ✅ |
| `getUser()` / `getSession()` / `getInitPayload()` / `isReady()` | خواندن وضعیت | ✅ | ✅ |
| `endSession()` | بستن سشن | ✅ | ✅ |
| `submitScore` / `getLeaderboard` | امتیاز | ✅ | ✅ |
| `unlockAchievement` / `getAchievements` | دستاورد | ✅ | ✅ |
| `getWallet` / `convertGems` | جِم | ✅ | ✅ |

Production از `postMessage` به parent استفاده می‌کند؛ Direct Dev همان endpointهای REST را با session token صدا می‌زند.

`PlatformSDK.version` → `'0.5.2'`

---

## اتصال به lobby-sdk

بعد از `init()`:

```ts
import { PlatformSDK } from '@oyna360/game-sdk';
import { PlatformLobby } from '@oyna360/lobby-sdk';

const init = await PlatformSDK.init({ /* … */ });
const lobby = await PlatformLobby.create({
  canvas,
  platformInit: init,
  roomId: init.lobby!.roomId,
  wsUrl: init.lobby!.wsUrl,
});
```

`lobby.wsUrl` را هاردکد نکنید.

---

## لایسنس

MIT
