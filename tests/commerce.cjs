const test = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs"),
  { randomUUID } = require("node:crypto");
function runtime(embedded) {
  const handlers = new Set(),
    calls = [];
  const parent = {
    postMessage(message, target) {
      calls.push({ message, target });
      if (message.type === "platform:commerce:request")
        queueMicrotask(() => {
          for (const handler of [...handlers])
            handler({
              source: parent,
              origin: "https://oyna360.ir",
              data: {
                type: "platform:commerce:result",
                requestId: message.requestId,
                result: { operation: message.operation, args: message.args },
              },
            });
        });
    },
  };
  const payload = {
    type: "platform:init",
    session: { id: "s", token: "test-session" },
    user: { id: "u", username: "test", displayName: "Test" },
    game: { slug: "game-one", name: "Game" },
    avatar: {
      presetId: "a",
      presetKey: "a",
      presetKind: "procedural",
      customConfig: {},
    },
  };
  const win = {
    parent: null,
    location: { origin: "https://game.example" },
    __OYNA360_PLATFORM_INIT__: payload,
    __OYNA360_PLATFORM_INIT_OK__: true,
    addEventListener(type, fn) {
      if (type === "message") handlers.add(fn);
    },
    removeEventListener(type, fn) {
      handlers.delete(fn);
    },
    dispatchEvent() {},
  };
  win.parent = embedded ? parent : win;
  const exports = {};
  let timeout;
  const context = {
    exports,
    window: win,
    document: { referrer: "https://oyna360.ir/play/game-one" },
    URL,
    URLSearchParams,
    MessageEvent: class {
      constructor(type, params) {
        Object.assign(this, params);
      }
    },
    crypto: { randomUUID },
    setTimeout(fn, ms) {
      return setTimeout(fn, ms === 10000 ? 50 : ms);
    },
    clearTimeout,
    console,
    fetch: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ url, ...JSON.parse(options.body ?? "{}") }),
      };
    },
    require: (name) => {
      if (name === "./types") return { SDK_VERSION: "0.7.0" };
      throw Error(name);
    },
  };
  vm.runInNewContext(fs.readFileSync("dist/index.js", "utf8"), context);
  return { sdk: exports.PlatformSDK, exports, calls, parent, handlers, win };
}
test("release version is identical in package, source and emitted distribution", () => {
  const pkg = require("../package.json"),
    { SDK_VERSION } = require("../dist/types");
  assert.equal(pkg.version, "0.7.0");
  assert.equal(SDK_VERSION, pkg.version);
  assert.equal(require("../dist").PlatformSDK.version, pkg.version);
});
for (const embedded of [false, true])
  test(
    embedded
      ? "iframe commerce protocol"
      : "direct-development authenticated commerce REST",
    async () => {
      const { sdk, calls } = runtime(embedded);
      await sdk.init({
        platformUrl: "https://oyna360.ir/api",
        platformWebUrl: "https://oyna360.ir",
      });
      const id = randomUUID();
      await sdk.getProducts();
      await sdk.purchaseProduct("potion", id);
      await sdk.getPurchaseStatus(id);
      await sdk.getPurchaseReceipts();
      await sdk.getInventory();
      await sdk.consumeItem("potion", 2, id);
      await sdk.convertGems(5, id);
      await sdk.getExchangeStatus(id);
      const operations = embedded
        ? calls
            .filter((c) => c.message.type === "platform:commerce:request")
            .map((c) => ({
              operation: c.message.operation,
              args: c.message.args,
            }))
        : calls.map((c) => JSON.parse(c.options.body));
      assert.deepEqual(
        operations.map((c) => c.operation),
        [
          "products",
          "purchase",
          "purchaseStatus",
          "receipts",
          "inventory",
          "consume",
          "exchange",
          "exchangeStatus",
        ],
      );
      assert.equal(operations[1].args.requestId, id);
      assert.equal(operations[6].args.requestId, id);
      assert.equal(operations[6].args.gems, 5);
      await sdk.purchaseProduct("potion", id);
      assert.equal(
        (embedded
          ? calls.at(-1).message.args
          : JSON.parse(calls.at(-1).options.body).args
        ).requestId,
        id,
      );
      if (embedded) {
        assert(
          calls
            .filter((c) => c.message.type === "platform:commerce:request")
            .every((c) => c.target === "https://oyna360.ir"),
        );
      } else {
        assert(
          calls.every(
            (c) => c.url === "https://oyna360.ir/api/games/game-one/commerce",
          ),
        );
        assert(
          calls.every(
            (c) => c.options.headers.Authorization === "Bearer test-session",
          ),
        );
      }
      assert.throws(() => sdk.purchaseProduct("bad/item", id));
      assert.throws(() => sdk.consumeItem("potion", 0, id));
      assert.throws(() => sdk.getPurchaseStatus(undefined));
      await assert.rejects(sdk.convertGems(-1, id));
      assert.throws(() => sdk.getPurchaseReceipts("../bad"));
    },
  );
test("forged iframe replies cannot settle a commerce request", async () => {
  const r = runtime(true);
  await r.sdk.init({ platformWebUrl: "https://oyna360.ir" });
  r.parent.postMessage = (message) => {
    r.calls.push({ message });
  };
  const pending = r.sdk.getInventory();
  await Promise.resolve();
  await Promise.resolve();
  const message = r.calls.at(-1).message;
  for (const handler of r.handlers)
    handler({
      source: {},
      origin: "https://oyna360.ir",
      data: {
        type: "platform:commerce:result",
        requestId: message.requestId,
        result: { forged: true },
      },
    });
  await assert.rejects(pending, /timeout/);
});
