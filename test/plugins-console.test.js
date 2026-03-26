import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("debug console exposes plugin and gog commands", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /openclaw\.plugins\.list/);
  assert.match(src, /openclaw\.plugins\.enable/);
  assert.match(src, /gog\.bootstrap/);
  assert.match(src, /gog\.auth\.status/);
  assert.match(src, /gog\.auth\.service-account\.status/);
});
