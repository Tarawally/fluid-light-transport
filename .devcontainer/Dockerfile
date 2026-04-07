FROM mcr.microsoft.com/devcontainers/base:debian

# 1. Install dependencies (Cached unless this line changes)
RUN apt-get update && apt-get install -y --no-install-recommends unzip curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

USER vscode
WORKDIR /home/vscode

# 2. THE SECRET SAUCE: Fetch the latest version tag from GitHub.
# Docker caches this JSON file. If the 'tag_name' in the JSON changes, 
# EVERY layer below this one will invalidate and rebuild.
ADD https://api.github.com/repos/oven-sh/bun/releases/latest /tmp/bun_release.json

# 3. Extract the version and install
# This layer only runs if the JSON above changed.
RUN export LATEST_BUN=$(grep -oP '"tag_name": "\K[^"]+' /tmp/bun_release.json) \
    && curl -fsSL https://bun.sh/install | bash -s -- "$LATEST_BUN"

# 4. Final Environment Setup
ENV BUN_INSTALL="/home/vscode/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Verify (This also only runs on new versions)
RUN bun --version