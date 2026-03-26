import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function getRedactor() {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const m = src.match(/function redactSecrets\(text\) \{([\s\S]*?)\n\}/);
  assert.ok(m, "redactSecrets not found");
  // eslint-disable-next-line no-new-func
  return new Function("return function redactSecrets(text){" + m[1] + "\n}" )();
}

test("redactSecrets redacts Telegram bot tokens", () => {
  const redact = getRedactor();
  const s = "botToken: 123456789:AAABBBcccDDD_eee-FFF";
  const out = redact(s);
  assert.ok(!out.includes("123456789:"));
  assert.match(out, /\[REDACTED\]/);
});

test("redactSecrets redacts gog oauth fields and tokens", () => {
  const redact = getRedactor();
  const s = [
    '{"client_secret":"secret-123","refresh_token":"1//refresh-token","access_token":"ya29.token-value"}',
    "-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----",
  ].join("\n");
  const out = redact(s);
  assert.ok(!out.includes("secret-123"));
  assert.ok(!out.includes("1//refresh-token"));
  assert.ok(!out.includes("ya29.token-value"));
  assert.ok(!out.includes("BEGIN PRIVATE KEY"));
  assert.match(out, /\[REDACTED/);
});
