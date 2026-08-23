# 06 — `getLeaderboard()`

**نسخه SDK:** `0.2.0+`

## توضیح

جدول برترین امتیازات **همین بازی** را از پلتفرم می‌گیرد.

## امضا

```typescript
function getLeaderboard(limit?: number): Promise<LeaderboardResponse>;
```

| پارامتر | پیش‌فرض | حداکثر |
|---------|---------|--------|
| `limit` | `20` | `100` (سمت API) |

## خروجی — `LeaderboardResponse`

```typescript
interface LeaderboardResponse {
  gameSlug: string;
  entries: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;        // 1-based
  score: number;
  achievedAt: string;  // ISO 8601
  user: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}
```

## مثال — نمایش در بازی

```typescript
async function showLeaderboardUI() {
  const { entries } = await PlatformSDK.getLeaderboard(10);

  const html = entries
    .map(
      (e) =>
        `<li>#${e.rank} ${e.user.displayName} — ${e.score.toLocaleString('fa-IR')}</li>`,
    )
    .join('');

  document.getElementById('board')!.innerHTML = html;
}
```

## مثال — بعد از submit

```typescript
const submit = await PlatformSDK.submitScore(score);
const board = await PlatformSDK.getLeaderboard(5);

renderPodium(board.entries);
highlightRank(submit.rank);
```

## API عمومی (بدون SDK)

Leaderboard روی **صفحه جزئیات بازی** پلتفرم (`/games/:slug`) هم نمایش داده می‌شود.

```
GET /api/games/:slug/leaderboard?limit=20
```

نیازی به authentication ندارد.

## نکات

- ترتیب: امتیاز نزولی، در تساوی قدیمی‌تر اول.
- اگر هنوز کسی امتیاز نداده، `entries: []`.
- `getLeaderboard` نیاز به login بازیکن دارد (init در iframe play)؛ API عمومی برای هر client در دسترس است.

## بعدی

→ [07-postmessage-protocol.md](./07-postmessage-protocol.md)
