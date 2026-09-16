# پروتکل postMessage (Production)

در Production، بازی داخل iframe است و با **صفحهٔ parent پلتفرم** حرف می‌زند — نه مستقیم با REST برای این عملیات.

## از بازی → پلتفرم

| `type` | نقش |
|--------|-----|
| `platform:ready` | SDK لود شد؛ لطفاً init بفرست |
| `platform:session:end` | بستن سشن |
| `platform:score:submit` | ثبت امتیاز (+ `requestId`, `sessionToken`, `score`) |
| `platform:leaderboard:get` | درخواست لیدربورد |
| `platform:achievement:unlock` / `platform:achievements:get` | دستاورد |
| `platform:wallet:get` / `platform:gems:exchange` | کیف‌پول |
| `platform:lobby:ready` | (از lobby-sdk) درخواست مجدد init |

## از پلتفرم → بازی

| `type` | نقش |
|--------|-----|
| `platform:init` | Context کامل |
| `platform:score:result` و بقیه `*:result` | پاسخ RPC با همان `requestId` |

## `platform:init` (شکل)

```ts
{
  type: 'platform:init',
  version: string,
  session: { id, token },
  user: { id, username, displayName, avatarUrl },
  game: { slug, name },
  avatar: { presetId, presetKey, presetKind, customConfig },
  avatarBases?: [{ id, glbUrl }],
  lobby?: { wsUrl, roomId, strictRoom? }
}
```

بازی‌ساز معمولاً لازم نیست این پیام‌ها را دستی بسازد؛ `PlatformSDK` و parent پلتفرم این کار را می‌کنند.

## Direct Development

به‌جای parent، Authorize HTTP استفاده می‌شود؛ ولی **شکل نهایی Context همان `SdkInitPayload` است** تا lobby-sdk و کد بازی یکسان بمانند.

بعدی: [08-wallet.md](./08-wallet.md)
