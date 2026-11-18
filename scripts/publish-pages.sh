#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
git fetch origin refs/heads/main
commit=$(git rev-parse FETCH_HEAD)
message=$(git log -1 --format=%s "$commit")
release_dir=$(mktemp -d)
trap 'rm -rf -- "$release_dir"' EXIT
git archive "$commit" | tar -x -C "$release_dir"

echo "Building graphlake-docs from $commit"
if [[ $(uname -s) == Darwin ]]; then
  docker --context orbstack run --rm --volume "$release_dir:/site" --workdir /site \
    node:24.22.1-bookworm-slim node build.mjs
else
  (cd "$release_dir" && node build.mjs)
fi

remote_main=$(git ls-remote --exit-code origin refs/heads/main | cut -f1)
if [[ $remote_main != "$commit" ]]; then
  echo "GitHub main advanced during the build. Run the release again to publish the new commit." >&2
  exit 1
fi

cd "$release_dir"
npx --yes wrangler@4.163.0 pages deploy dist --project-name graphlake-docs \
  --branch main --commit-hash "$commit" --commit-message "$message"
