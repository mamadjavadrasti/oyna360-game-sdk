# 03 — کاربر و سشن

## `getUser()`

کاربر لاگین‌شده‌ای که بازی را از پلتفرم باز کرده.

```typescript
function getUser(): SdkUser | null;
```

```typescript
const user = PlatformSDK.getUser();
if (user) {
  showAvatar(user.avatarUrl, user.displayName);
}
```

- **Sync** — Promise نیست.
- قبل از `init()` → `null`
- ایمیل کاربر عمداً در SDK نیست (حریم خصوصی).

---

## `getSession()`

متادیتای سشن فعلی بازی.

```typescript
function getSession(): SdkSession | null;
```

```typescript
const session = PlatformSDK.getSession();
console.log(session?.id); // برای لاگ debug
```

`token` را در UI نمایش ندهید — فقط SDK و bridge پلتفرم از آن استفاده می‌کنند.

---

## `isReady()`

```typescript
function isReady(): boolean;
```

```typescript
if (PlatformSDK.isReady()) {
  enableMultiplayerFeatures();
}
```

معادل `getUser() !== null` — برای چک سریع قبل از render.

---

## مثال ترکیبی

```typescript
await PlatformSDK.init();

const user = PlatformSDK.getUser();
const session = PlatformSDK.getSession();

if (!user || !session) {
  throw new Error('Platform context missing');
}

startGame({
  playerId: user.id,
  playerName: user.displayName,
  sessionId: session.id,
});
```

## بعدی

→ [04-end-session.md](./04-end-session.md)
