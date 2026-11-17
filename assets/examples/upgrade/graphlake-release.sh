#!/usr/bin/env bash
set -euo pipefail

if (( EUID != 0 )); then
  printf '%s\n' 'Run this script with sudo.' >&2
  exit 1
fi

root=/opt/graphlake
case "${1:-}" in
  stage)
    archive=$(realpath -e -- "${2:?Provide the package archive path.}")
    name=$(basename -- "$archive" .tar.gz)
    if [[ $archive != *.tar.gz || $name != graphlake-v*-linux-"$(uname -m)" ]]; then
      printf '%s\n' "Expected a GraphLake package for $(uname -m)." >&2
      exit 1
    fi
    (
      cd -- "$(dirname -- "$archive")"
      sha256sum -c -- "$name.tar.gz.sha256" >&2
    )
    target="$root/releases/${name#graphlake-}"
    if [[ -e $target || -L $target ]]; then
      printf 'Release directory already exists: %s\n' "$target" >&2
      exit 1
    fi
    install -d -m 0755 "$root/releases"
    scratch=$(mktemp -d "$root/releases/.stage.XXXXXXXX")
    trap 'rm -rf -- "$scratch"' EXIT
    chmod 0755 "$scratch"
    tar -xzf "$archive" --no-same-owner --strip-components=1 -C "$scratch"
    test -x "$scratch/bin/graphlake-admin" && test -r "$scratch/web/index.html" &&
      test -r "$scratch/BUILD-INFO" || exit 1
    mv -T -- "$scratch" "$target"
    printf '%s\n' "$target"
    ;;
  activate)
    target=$(realpath -e -- "${2:?Provide a staged release directory.}")
    shift 2
    if [[ $target != "$root/releases/"* ]] || (( $# == 0 )); then
      printf '%s\n' 'Provide a release under /opt/graphlake/releases and the unit names on this host.' >&2
      exit 1
    fi
    test -x "$target/bin/graphlake-admin" && test -r "$target/web/index.html" || exit 1
    test -L "$root/current"
    systemctl stop -- "$@"
    scratch=$(mktemp -d "$root/.activate.XXXXXXXX")
    trap 'rm -rf -- "$scratch"' EXIT
    ln -s -- "$target" "$scratch/current"
    mv -Tf -- "$scratch/current" "$root/current"
    systemctl daemon-reload
    systemctl start -- "$@"
    ;;
  *)
    printf '%s\n' 'Usage: graphlake-release.sh stage ARCHIVE | activate RELEASE_DIR UNIT [UNIT ...]' >&2
    exit 2
    ;;
esac
