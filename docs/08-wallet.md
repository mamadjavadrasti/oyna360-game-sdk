# کیف‌پول جِم — `getWallet` / `convertGems`

جِم ارز پلتفرم است. تبدیل به «سکه داخل بازی» با نرخ `coinsPerGem` همان بازی انجام می‌شود.

```ts
const wallet = await PlatformSDK.getWallet();
// { gems, coinsPerGem, gameSlug }

const result = await PlatformSDK.convertGems(5);
// { gemsSpent, coinsReceived, coinsPerGem, gemsRemaining, gameSlug }
```

## مسئولیت بازی

پلتفرم جِم را کم می‌کند و `coinsReceived` را برمی‌گرداند.  
**اعتبار سکه داخل اقتصاد خودتان** با شماست (در سرور/کلاینت بازی اعمال کنید).

## نکات

- `gems` باید عدد صحیح مثبت باشد.
- در **Production** و **Direct Dev** هر دو کار می‌کند (iframe یا REST با session token).

```ts
try {
  const { coinsReceived } = await PlatformSDK.convertGems(amount);
  await creditLocalCoins(coinsReceived);
} catch (e) {
  showError(e);
}
```

بعدی: [09-direct-development.md](./09-direct-development.md) · [10-achievements.md](./10-achievements.md)
