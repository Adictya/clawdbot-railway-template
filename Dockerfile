# Build openclaw from source to avoid npm packaging gaps (some dist files are not shipped).
FROM node:22-bookworm AS openclaw-build

# Dependencies needed for openclaw build
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    curl \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

# Install Bun (openclaw build uses it)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /openclaw

# Pin to a known-good ref (tag/branch). Override in Railway template settings if needed.
# Using a released tag avoids build breakage when `main` temporarily references unpublished packages.
ARG OPENCLAW_GIT_REF=v2026.3.8
RUN git clone --depth 1 --branch "${OPENCLAW_GIT_REF}" https://github.com/openclaw/openclaw.git .

# Patch: relax version requirements for packages that may reference unpublished versions.
# Apply to all extension package.json files to handle workspace protocol (workspace:*).
RUN set -eux; \
  find ./extensions -name 'package.json' -type f | while read -r f; do \
    sed -i -E 's/"openclaw"[[:space:]]*:[[:space:]]*">=[^"]+"/"openclaw": "*"/g' "$f"; \
    sed -i -E 's/"openclaw"[[:space:]]*:[[:space:]]*"workspace:[^"]+"/"openclaw": "*"/g' "$f"; \
  done

RUN pnpm install --no-frozen-lockfile
RUN pnpm build
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:install && pnpm ui:build


# Fetch pinned gog release for the target platform.
FROM debian:bookworm-slim AS gog-fetch
ARG GOG_VERSION=v0.12.0
ARG TARGETARCH

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  ver="${GOG_VERSION#v}"; \
  case "${TARGETARCH}" in \
    amd64) gog_sha256="a03fccbd67ea2e59a26a56e92de8918577f4bebe4b2f946823419777827cdab2" ;; \
    arm64) gog_sha256="d7f20494d7eb0e8716631853d055ccbb368c7b81cb8165f55b45884bccb67b4b" ;; \
    *) echo "Unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
  esac; \
  asset="gogcli_${ver}_linux_${TARGETARCH}.tar.gz"; \
  url="https://github.com/steipete/gogcli/releases/download/${GOG_VERSION}/${asset}"; \
  curl -fsSL -o "/tmp/${asset}" "${url}"; \
  echo "${gog_sha256}  /tmp/${asset}" | sha256sum -c -; \
  tar -xzf "/tmp/${asset}" -C /tmp; \
  install -D -m 0755 /tmp/gog /out/gog


# Fetch pinned jira-cli release for the target platform.
FROM debian:bookworm-slim AS jira-fetch
ARG JIRA_CLI_VERSION=v1.7.0
ARG TARGETARCH

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  ver="${JIRA_CLI_VERSION#v}"; \
  case "${TARGETARCH}" in \
    amd64) jira_arch="x86_64"; jira_sha256="b5e0ba4804f3f11f92c483d9a6ea9ebccec1c735cd2e12b0440cab9d7afd626a" ;; \
    arm64) jira_arch="arm64"; jira_sha256="80aa3cc02790892b29e1580a8e49eb49a6550815b362c5ef8c05aea1dee73a95" ;; \
    *) echo "Unsupported TARGETARCH: ${TARGETARCH}" >&2; exit 1 ;; \
  esac; \
  asset="jira_${ver}_linux_${jira_arch}.tar.gz"; \
  root="jira_${ver}_linux_${jira_arch}"; \
  url="https://github.com/ankitpokhrel/jira-cli/releases/download/${JIRA_CLI_VERSION}/${asset}"; \
  curl -fsSL -o "/tmp/${asset}" "${url}"; \
  echo "${jira_sha256}  /tmp/${asset}" | sha256sum -c -; \
  tar -xzf "/tmp/${asset}" -C /tmp; \
  install -D -m 0755 "/tmp/${root}/bin/jira" /out/jira


# Runtime image
FROM node:22-bookworm
ENV NODE_ENV=production

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gh \
    tini \
    python3 \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

# `openclaw update` expects pnpm. Provide it in the runtime image.
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

COPY --from=gog-fetch /out/gog /usr/local/bin/gog
COPY --from=jira-fetch /out/jira /usr/local/bin/jira

# Persist user-installed tools by default by targeting the Railway volume.
# - npm global installs -> /data/npm
# - pnpm global installs -> /data/pnpm (binaries) + /data/pnpm-store (store)
ENV NPM_CONFIG_PREFIX=/data/npm
ENV NPM_CONFIG_CACHE=/data/npm-cache
ENV PNPM_HOME=/data/pnpm
ENV PNPM_STORE_DIR=/data/pnpm-store
ENV XDG_CONFIG_HOME=/data/.config
ENV GOG_KEYRING_BACKEND=file
ENV JIRA_CONFIG_FILE=/data/.config/.jira/.config.yml
ENV PATH="/data/npm/bin:/data/pnpm:${PATH}"

WORKDIR /app

# Wrapper deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built openclaw
COPY --from=openclaw-build /openclaw /openclaw

# Provide an openclaw executable
RUN printf '%s\n' '#!/usr/bin/env bash' 'exec node /openclaw/dist/entry.js "$@"' > /usr/local/bin/openclaw \
  && chmod +x /usr/local/bin/openclaw

COPY src ./src
COPY skills ./skills
RUN npm --prefix "/app/skills/linear/scripts" ci --omit=dev

# The wrapper listens on $PORT.
# IMPORTANT: Do not set a default PORT here.
# Railway injects PORT at runtime and routes traffic to that port.
# If we force a different port, deployments can come up but the domain will route elsewhere.
EXPOSE 8080

# Ensure PID 1 reaps zombies and forwards signals.
ENTRYPOINT ["tini", "--"]
CMD ["node", "src/server.js"]
