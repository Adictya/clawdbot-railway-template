import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("bundled gog skill exists with required metadata", () => {
  const skill = fs.readFileSync(new URL("../skills/gog/SKILL.md", import.meta.url), "utf8");
  assert.match(skill, /^---/);
  assert.match(skill, /name: gog/);
  assert.match(skill, /requires/);
  assert.match(skill, /"bins":\["gog"\]/);
});
