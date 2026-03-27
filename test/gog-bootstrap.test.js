import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("gog bootstrap uses set commands for credentials and service accounts", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /"auth", "credentials", "set", clientPath/);
  assert.match(src, /"auth", "service-account", "set", `--key=\$\{keyPath\}`, serviceAccountEmail/);
});
