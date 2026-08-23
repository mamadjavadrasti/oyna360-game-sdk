# 08 — کیف پول جِم و تبدیل به سکه

جِم ارز پلتفرم است. سکه متعلق به **خود بازی** است؛ پلتفرم فقط جِم کم می‌کند و مقدار سکهٔ معادل را برمی‌گرداند تا بازی به کیف خودش اضافه کند.

## نرخ تبدیل

در پنل ادمین → ویرایش بازی → **سکه به ازای هر جِم** (`coinsPerGem`)

مثال: `100` یعنی `1 جِم = 100 سکه`

مقدار `0` تبدیل را برای آن بازی غیرفعال می‌کند.

## SDK

```typescript
import { PlatformSDK } from '@platform/game-sdk';

await PlatformSDK.init();

// موجودی جِم + نرخ این بازی
const wallet = await PlatformSDK.getWallet();
console.log(wallet.gems, wallet.coinsPerGem);

// تبدیل ۱۰ جِم
const result = await PlatformSDK.convertGems(10);
// result.coinsReceived → به کیف سکهٔ بازی اضافه کنید
// result.gemsRemaining → موجودی باقی‌مانده جِم
addCoinsToPlayer(result.coinsReceived);
```

## پاسخ‌ها

### `getWallet()` → `WalletBalanceResponse`

| فیلد | توضیح |
|------|--------|
| `gems` | موجودی جِم کاربر |
| `coinsPerGem` | نرخ این بازی |
| `gameSlug` | اسلاگ بازی |

### `convertGems(n)` → `ConvertGemsResponse`

| فیلد | توضیح |
|------|--------|
| `gemsSpent` | جِم کم‌شده |
| `coinsReceived` | سکه‌ای که بازی باید بدهد |
| `coinsPerGem` | نرخ استفاده‌شده |
| `gemsRemaining` | موجودی بعد از تبدیل |
| `gameSlug` | اسلاگ بازی |

## خطاهای رایج

- `Insufficient gems` — موجودی کافی نیست
- `Gem exchange is disabled` — `coinsPerGem === 0`
- timeout — بازی خارج از iframe پلتفرم است

## بعدی

→ [07-postmessage-protocol.md](./07-postmessage-protocol.md)
