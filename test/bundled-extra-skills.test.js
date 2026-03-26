import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("bundled extra skills and helper CLIs are wired in", () => {
  const docker = fs.readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const linearSkill = fs.readFileSync(new URL("../skills/linear/SKILL.md", import.meta.url), "utf8");
  const linearCli = fs.readFileSync(new URL("../skills/linear/scripts/linear-cli.js", import.meta.url), "utf8");
  const notionSkill = fs.readFileSync(new URL("../skills/notion/SKILL.md", import.meta.url), "utf8");
  const githubSkill = fs.readFileSync(new URL("../skills/github/SKILL.md", import.meta.url), "utf8");

  assert.match(docker, /\bgh\b/);
  assert.match(docker, /\bcurl\b/);
  assert.match(docker, /skills\/linear\/scripts/);
  assert.match(docker, /npm --prefix .*linear\/scripts.* ci --omit=dev/);

  assert.match(server, /EXTRA_BUNDLED_SKILLS = \["linear", "notion", "github"\]/);

  assert.match(linearSkill, /name: linear/);
  assert.match(linearSkill, /LINEAR_API_KEY/);
  assert.match(linearCli, /LinearClient/);

  assert.match(notionSkill, /name: notion/);
  assert.match(notionSkill, /NOTION_API_KEY/);
  assert.match(notionSkill, /curl/);

  assert.match(githubSkill, /name: github/);
  assert.match(githubSkill, /`gh` CLI/);
  assert.match(githubSkill, /GH_TOKEN|GITHUB_TOKEN/);
});
