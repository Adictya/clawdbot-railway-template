# OpenClaw Railway Template (1‑click deploy)

This repo packages **OpenClaw** for Railway with a small **/setup** web wizard so users can deploy and onboard **without running any commands**.

## What you get

- **OpenClaw Gateway + Control UI** (served at `/` and `/openclaw`)
- A friendly **Setup Wizard** at `/setup` (protected by a password)
- Persistent state via **Railway Volume** (so config/credentials/memory survive redeploys)
- **`gog` CLI** preinstalled in the image for Gmail/Calendar/Drive/Contacts/Sheets/Docs
- **`jira` CLI** preinstalled in the image for Jira issue and sprint workflows
- **`gh` CLI** and `curl` available for GitHub and Notion workflows
- A bundled **`gog` OpenClaw skill** seeded into the workspace on first boot
- A bundled **`jira` OpenClaw skill** seeded into the workspace on first boot
- Bundled **`linear`**, **`notion`**, and **`github`** OpenClaw skills seeded into the workspace on first boot
- One-click **Export backup** (so users can migrate off Railway later)
- **Import backup** from `/setup` (advanced recovery)

## How it works (high level)

- The container runs a wrapper web server.
- The wrapper protects `/setup` (and the Control UI at `/openclaw`) with `SETUP_PASSWORD` using HTTP Basic auth.
- During setup, the wrapper runs `openclaw onboard --non-interactive ...` inside the container, writes state to the volume, and then starts the gateway.
- After setup, **`/` is OpenClaw**. The wrapper reverse-proxies all traffic (including WebSockets) to the local gateway process.

## Railway deploy instructions (what you’ll publish as a Template)

In Railway Template Composer:

1) Create a new template from this GitHub repo.
2) Add a **Volume** mounted at `/data`.
3) Set the following variables:

Required:
- `SETUP_PASSWORD` — user-provided password to access `/setup` and the Control UI (`/openclaw`) via HTTP Basic auth

Recommended:
- `OPENCLAW_STATE_DIR=/data/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=/data/workspace`

Optional:
- `OPENCLAW_GATEWAY_TOKEN` — if not set, the wrapper generates one (not ideal). In a template, set it using a generated secret.
- `GOG_ACCOUNT` — default `gog` account/email alias for non-interactive commands
- `GOG_CLIENT` — optional named OAuth client bucket for `gog`
- `GOG_SERVICE_ACCOUNT_EMAIL` + `GOG_SERVICE_ACCOUNT_JSON_B64` — preferred `gog` bootstrap for Google Workspace/domain-wide delegation
- `GOG_OAUTH_CLIENT_JSON_B64` + `GOG_OAUTH_TOKEN_JSON_B64` + `GOG_KEYRING_PASSWORD` — pre-seed `gog` OAuth auth from Railway secrets
- `JIRA_SERVER` + `JIRA_LOGIN` + `JIRA_PROJECT` + `JIRA_API_TOKEN` — bootstrap `jira` CLI on first boot
- `JIRA_INSTALLATION=cloud|local` — defaults to `cloud`
- `JIRA_AUTH_TYPE=basic|bearer|mtls` — set `bearer` for Jira Server/Data Center PATs
- `JIRA_BOARD` — optional default board name for `jira init`
- `JIRA_INSECURE=true` — optional; only for trusted self-signed Jira instances
- `LINEAR_API_KEY` — enables the bundled Linear skill
- `NOTION_API_KEY` — preferred auth for the bundled Notion skill
- `GH_TOKEN` or `GITHUB_TOKEN` — recommended non-interactive auth for the bundled GitHub skill / `gh`

Notes:
- This template pins OpenClaw to a released version by default via Docker build arg `OPENCLAW_GIT_REF` (override if you want `main`).
- All `GOG_*_JSON_B64` values should be base64-encoded file contents with newlines removed.
- If both `gog` service-account and OAuth bootstrap secrets are present for the same account, `gog` prefers the service account.
- `jira` stores config metadata on disk, but continues to read `JIRA_API_TOKEN` from Railway env at runtime.
- The Linear skill ships with its Node dependencies preinstalled in the image.

4) Enable **Public Networking** (HTTP). Railway will assign a domain.
   - This service listens on Railway’s injected `PORT` at runtime (recommended).
5) Deploy.

Then:
- Visit `https://<your-app>.up.railway.app/setup`
  - Your browser will prompt for **HTTP Basic auth**. Use any username; the password is `SETUP_PASSWORD`.
- Complete setup
- Visit `https://<your-app>.up.railway.app/` and `/openclaw` (same Basic auth)

## Support / community

- GitHub Issues: https://github.com/vignesh07/clawdbot-railway-template/issues
- Discord: https://discord.com/invite/clawd

If you’re filing a bug, please include the output of:
- `/healthz`
- `/setup/api/debug` (after authenticating to /setup)

## Getting chat tokens (so you don’t have to scramble)

### Telegram bot token
1) Open Telegram and message **@BotFather**
2) Run `/newbot` and follow the prompts
3) BotFather will give you a token that looks like: `123456789:AA...`
4) Paste that token into `/setup`

### Discord bot token
1) Go to the Discord Developer Portal: https://discord.com/developers/applications
2) **New Application** → pick a name
3) Open the **Bot** tab → **Add Bot**
4) Copy the **Bot Token** and paste it into `/setup`
5) Invite the bot to your server (OAuth2 URL Generator → scopes: `bot`, `applications.commands`; then choose permissions)

## Persistence (Railway volume)

Railway containers have an ephemeral filesystem. Only the mounted volume at `/data` persists across restarts/redeploys.

What persists cleanly today:
- **Custom skills / code:** anything under `OPENCLAW_WORKSPACE_DIR` (default: `/data/workspace`)
- **Bundled `gog` skill copy:** seeded to `/data/workspace/skills/gog/SKILL.md` on first boot if missing
- **Bundled `jira` skill copy:** seeded to `/data/workspace/skills/jira/SKILL.md` on first boot if missing
- **Bundled extra skill copies:** seeded under `/data/workspace/skills/{linear,notion,github}` on first boot if missing
- **Node global tools (npm/pnpm):** this template configures defaults so global installs land under `/data`:
  - npm globals: `/data/npm` (binaries in `/data/npm/bin`)
  - pnpm globals: `/data/pnpm` (binaries) + `/data/pnpm-store` (store)
- **`gog` config + keyring:** `/data/.config/gogcli` (via `XDG_CONFIG_HOME=/data/.config` and `GOG_KEYRING_BACKEND=file`)
- **`jira` config:** `/data/.config/.jira/.config.yml` (via `JIRA_CONFIG_FILE=/data/.config/.jira/.config.yml`)
- **Notion file fallback:** `/data/.config/notion/api_key` if you choose file-based auth instead of `NOTION_API_KEY`
- **Python packages:** create a venv under `/data` (example below). The runtime image includes Python + venv support.

What does *not* persist cleanly:
- `apt-get install ...` (installs into `/usr/*`)
- Homebrew installs (typically `/opt/homebrew` or similar)

### Optional bootstrap hook

If `/data/workspace/bootstrap.sh` exists, the wrapper will run it on startup (best-effort) before starting the gateway.
Use this to initialize persistent install prefixes or create a venv.
You do not need this hook for `gog`; the image already includes the binary, auth bootstrap, and skill seeding logic.

Example `bootstrap.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Example: create a persistent python venv
python3 -m venv /data/venv || true

# Example: ensure npm/pnpm dirs exist
mkdir -p /data/npm /data/npm-cache /data/pnpm /data/pnpm-store
```

## `gog` CLI and skill

- The image includes `gog` at `/usr/local/bin/gog`.
- On boot, the wrapper can hydrate `gog` auth from Railway secrets so `gog` is ready immediately after deploy.
- The setup console includes safe `gog` commands for inspection and repair, including `gog.bootstrap`, `gog auth list`, `gog auth status`, `gog auth keyring`, and `gog auth service-account status <email>`.
- The bundled `gog` skill is copied into `/data/workspace/skills/gog/SKILL.md` if it is not already present.

### Recommended `gog` auth modes

1. Google Workspace / service account (recommended)
   - Set `GOG_SERVICE_ACCOUNT_EMAIL` to the user to impersonate.
   - Set `GOG_SERVICE_ACCOUNT_JSON_B64` to the base64-encoded service-account JSON.
2. Regular OAuth refresh token
   - Set `GOG_OAUTH_CLIENT_JSON_B64` to the base64-encoded OAuth client JSON.
   - Set `GOG_OAUTH_TOKEN_JSON_B64` to the base64-encoded token export JSON from an already-authorized `gog` install.
   - Set `GOG_KEYRING_PASSWORD` so the file keyring works non-interactively in the container.

Example base64 encoding on macOS/Linux:

```bash
base64 < service-account.json | tr -d '\n'
base64 < oauth-client.json | tr -d '\n'
base64 < gog-token-export.json | tr -d '\n'
```

After changing any `GOG_*` Railway secret, redeploy the service. If auth drifts, open `/setup` and run `gog.bootstrap`.

## `jira` CLI and skill

- The image includes `jira` at `/usr/local/bin/jira`.
- On boot, the wrapper can generate Jira CLI config from Railway secrets by running `jira init --force ...` internally.
- The setup console includes safe Jira commands for inspection and repair, including `jira.bootstrap`, `jira version`, `jira me`, `jira serverinfo`, and `jira issue view <ISSUE-123>`.
- The bundled Jira skill is copied into `/data/workspace/skills/jira/` if it is not already present.

### Recommended `jira` bootstrap vars

- `JIRA_SERVER=https://yourcompany.atlassian.net`
- `JIRA_LOGIN=you@example.com`
- `JIRA_PROJECT=PROJ`
- `JIRA_API_TOKEN=...`
- Optional: `JIRA_INSTALLATION=cloud` or `local`
- Optional: `JIRA_AUTH_TYPE=bearer` for Jira Server/Data Center PATs
- Optional: `JIRA_BOARD=Platform Team`
- Optional: `JIRA_INSECURE=true` for trusted self-signed Jira instances only

After changing any `JIRA_*` Railway secret, redeploy the service. If auth drifts or the config needs to be regenerated, open `/setup` and run `jira.bootstrap`.

## `linear`, `notion`, and `github` skills

- The bundled `linear` skill runs a local Node script at `/data/workspace/skills/linear/scripts/linear-cli.js` and uses `LINEAR_API_KEY`.
- The bundled `github` skill uses the preinstalled `gh` CLI. For non-interactive use, set `GH_TOKEN` or `GITHUB_TOKEN`.
- The bundled `notion` skill uses `curl`. Prefer `NOTION_API_KEY`; if you want file-based fallback, place the key at `/data/.config/notion/api_key`.
- These skills are seeded automatically on first boot, like `gog` and `jira`.

## Troubleshooting

### “disconnected (1008): pairing required” / dashboard health offline

This is not a crash — it means the gateway is running, but no device has been approved yet.

Fix:
- Open `/setup`
- Use the **Debug Console**:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

If `openclaw devices list` shows no pending request IDs:
- Make sure you’re visiting the Control UI at `/openclaw` (or your native app) and letting it attempt to connect
  - Note: the Railway wrapper now proxies the gateway and injects the auth token automatically, so you should not need to paste the gateway token into the Control UI when using `/openclaw`.
- Ensure your state dir is the Railway volume (recommended): `OPENCLAW_STATE_DIR=/data/.openclaw`
- Check `/setup/api/debug` for the active state/workspace dirs + gateway readiness

### “unauthorized: gateway token mismatch”

The Control UI connects using `gateway.remote.token` and the gateway validates `gateway.auth.token`.

Fix:
- Re-run `/setup` so the wrapper writes both tokens.
- Or set both values to the same token in config.

### “Application failed to respond” / 502 Bad Gateway

Most often this means the wrapper is up, but the gateway can’t start or can’t bind.

Checklist:
- Ensure you mounted a **Volume** at `/data` and set:
  - `OPENCLAW_STATE_DIR=/data/.openclaw`
  - `OPENCLAW_WORKSPACE_DIR=/data/workspace`
- Ensure **Public Networking** is enabled (Railway will inject `PORT`).
- Check Railway logs for the wrapper error: it will show `Gateway not ready:` with the reason.

### Legacy CLAWDBOT_* env vars / multiple state directories

If you see warnings about deprecated `CLAWDBOT_*` variables or state dir split-brain (e.g. `~/.openclaw` vs `/data/...`):
- Use `OPENCLAW_*` variables only
- Ensure `OPENCLAW_STATE_DIR=/data/.openclaw` and `OPENCLAW_WORKSPACE_DIR=/data/workspace`
- Redeploy after fixing Railway Variables

### Build OOM (out of memory) on Railway

Building OpenClaw from source can exceed small memory tiers.

Recommendations:
- Use a plan with **2GB+ memory**.
- If you see `Reached heap limit Allocation failed - JavaScript heap out of memory`, upgrade memory and redeploy.

## Local smoke test

```bash
docker build -t clawdbot-railway-template .

docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SETUP_PASSWORD=test \
  -e OPENCLAW_STATE_DIR=/data/.openclaw \
  -e OPENCLAW_WORKSPACE_DIR=/data/workspace \
  -v $(pwd)/.tmpdata:/data \
  clawdbot-railway-template

# open http://localhost:8080/setup (password: test)
```

---

## Official template / endorsements

- Officially recommended by OpenClaw: <https://docs.openclaw.ai/railway>
- Railway announcement (official): [Railway tweet announcing 1‑click OpenClaw deploy](https://x.com/railway/status/2015534958925013438)

  ![Railway official tweet screenshot](assets/railway-official-tweet.jpg)

- Endorsement from Railway CEO: [Jake Cooper tweet endorsing the OpenClaw Railway template](https://x.com/justjake/status/2015536083514405182)

  ![Jake Cooper endorsement tweet screenshot](assets/railway-ceo-endorsement.jpg)

- Created and maintained by **Vignesh N (@vignesh07)**
- **11000+ deploys on Railway and counting** [Link to template on Railway](https://railway.com/deploy/clawdbot-railway-template)

![Railway template deploy count](assets/railway-deploys.jpg)
