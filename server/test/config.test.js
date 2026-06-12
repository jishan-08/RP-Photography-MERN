import assert from "node:assert/strict";
import test from "node:test";
import { getConfig } from "../src/config.js";

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test("getConfig parses valid settings and trims client origins", () => {
  process.env.PORT = "5050";
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
  process.env.JWT_SECRET = "local-test-secret";
  process.env.CLIENT_URL = "http://localhost:5173, https://example.com ";
  process.env.NODE_ENV = "test";

  assert.deepEqual(getConfig(), {
    port: 5050,
    mongoUri: "mongodb://127.0.0.1:27017/test",
    jwtSecret: "local-test-secret",
    clientOrigins: ["http://localhost:5173", "https://example.com"]
  });
});

test("getConfig rejects missing database configuration", () => {
  delete process.env.MONGO_URI;
  process.env.JWT_SECRET = "local-test-secret";
  process.env.NODE_ENV = "test";

  assert.throws(() => getConfig(), /MONGO_URI/);
});

test("getConfig rejects weak production JWT secrets", () => {
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
  process.env.JWT_SECRET = "replace-this-with-a-long-random-secret";
  process.env.NODE_ENV = "production";

  assert.throws(() => getConfig(), /JWT_SECRET/);
});

test("getConfig rejects invalid ports", () => {
  process.env.PORT = "70000";
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test";
  process.env.JWT_SECRET = "local-test-secret";
  process.env.NODE_ENV = "test";

  assert.throws(() => getConfig(), /PORT/);
});
