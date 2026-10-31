# Commerce 0.7 release

- Package version, `SDK_VERSION` and `PlatformSDK.version` are all `0.7.0`.
- New: `getProducts`, `purchaseProduct`, `getPurchaseStatus`, `getPurchaseReceipts`, `getInventory`, `consumeItem`, `getExchangeStatus`.
- Commerce operations work via authenticated REST in Direct Development and trusted parent RPC in an iframe.
- Business operation IDs are separate from transport correlation IDs, so concurrent retries do not mix their replies.
- `convertGems` now uses the commerce route; it requires the matching platform backend and parent bridge. Deploy platform migration/API/web before upgrading games to this version.
- Stable operation IDs must be persisted by the game before sending. Replay protection is provided by the matching backend's database transactions, not local SDK storage.
- The platform owns item balances and consumption. External in-game coin credits/effects still require the game server to apply each receipt once.
- GitHub source/dist updates do not publish a release to npm. Until npm is published by the owner, install the exact Git commit or a locally packed tarball.

Run `npm run build`, then `npm test`. Tests cover both transports, operation IDs, input rejection, version alignment and forged-parent replies.
