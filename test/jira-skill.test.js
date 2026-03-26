import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("bundled jira skill exists with references", () => {
  const skill = fs.readFileSync(new URL("../skills/jira/SKILL.md", import.meta.url), "utf8");
  const commands = fs.readFileSync(new URL("../skills/jira/references/commands.md", import.meta.url), "utf8");
  const mcp = fs.readFileSync(new URL("../skills/jira/references/mcp.md", import.meta.url), "utf8");

  assert.match(skill, /^---/);
  assert.match(skill, /name: jira/);
  assert.match(skill, /"bins":\["jira"\]/);
  assert.match(skill, /references\/commands\.md/);
  assert.match(commands, /jira issue view ISSUE-KEY --raw/);
  assert.match(mcp, /mcp__atlassian__searchJiraIssuesUsingJql/);
});
