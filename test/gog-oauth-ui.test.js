import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("gog setup UI exposes remote OAuth start and finish flow", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/setup-app.js", import.meta.url), "utf8");
  const docker = fs.readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");

  assert.match(server, /gog OAuth repair/);
  assert.match(server, /\/setup\/api\/gog\/oauth\/start/);
  assert.match(server, /\/setup\/api\/gog\/oauth\/finish/);
  assert.match(server, /interactive account authorization is still required/);

  assert.match(app, /\/setup\/api\/gog\/oauth\/start/);
  assert.match(app, /\/setup\/api\/gog\/oauth\/finish/);
  assert.match(app, /Generating Google auth URL/);
  assert.match(app, /Finishing gog OAuth/);

  assert.match(docker, /GOG_WRAPPER_KEYRING_PASSWORD_FILE/);
  assert.match(docker, /gog-real/);
  assert.match(docker, /python3 -c \"import secrets,sys;sys.stdout.write\(secrets.token_hex\(32\)\)\"/);
});
