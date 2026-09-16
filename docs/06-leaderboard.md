# لیدربورد — `getLeaderboard`

```ts
const board = await PlatformSDK.getLeaderboard(20);
// { gameSlug, entries: [{ rank, score, achievedAt, user: { displayName, username, avatarUrl } }] }
```

- `limit` پیش‌فرض ۲۰
- نیاز به `init()` دارد
- **Production iframe**؛ Direct Mode در فاز B

```ts
const { entries } = await PlatformSDK.getLeaderboard(10);
for (const row of entries) {
  console.log(row.rank, row.user.displayName, row.score);
}
```

بعدی: [07-postmessage-protocol.md](./07-postmessage-protocol.md)
