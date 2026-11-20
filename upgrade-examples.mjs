import { repository, release as candidate, sourceDigestPrefix as build } from "./examples.mjs";

export const upgradeInit = `set -euo pipefail
work_dir=$(mktemp -d)
cd "$work_dir"
docs=https://graphlake-docs.pages.dev/assets/examples
curl -fSLO "$docs/upgrade/graphlake-release.sh"
curl -fSLO "$docs/clients/http_query.py"`;

export const upgradeStage = `artifact=graphlake-${candidate}-${build}-linux-$(uname -m)
download=${repository}/releases/download/${candidate}
curl -fSLO "$download/$artifact.tar.gz"
curl -fSLO "$download/$artifact.tar.gz.sha256"
target=$(sudo bash graphlake-release.sh stage "$artifact.tar.gz")
printf '%s\\n' "$target"
cat "$target/BUILD-INFO"`;

export const upgradeNodeBackup = `checkpoint=$(sudo mktemp -d /var/backups/graphlake.XXXXXXXX)
printf '%s\\n' "$checkpoint"
readlink -e /opt/graphlake/current | sudo tee "$checkpoint/previous-release" >/dev/null
sudo bash -c '
  set -e
  umask 077
  cd /
  shopt -s nullglob
  tar --acls --xattrs --numeric-owner -cpf "$1/node-config.tar" \\
    etc/graphlake etc/systemd/system/graphlake*
  cd "$1"
  sha256sum node-config.tar > node-config.tar.sha256
' _ "$checkpoint"`;

export const upgradeCanary = `export GRAPHLAKE_ORIGIN=http://127.0.0.1:7337
export GRAPHLAKE_USERNAME=svc/analytics
export GRAPHLAKE_MODEL=graph
printf 'GraphLake service token: '
read -rs GRAPHLAKE_TOKEN
printf '\\n'
export GRAPHLAKE_TOKEN

curl -fsS "$GRAPHLAKE_ORIGIN/healthz" | sudo tee "$checkpoint/health-before.json"
curl -fsS "$GRAPHLAKE_ORIGIN/readyz"
python3 http_query.py | sudo tee "$checkpoint/query-before.txt"`;

export const standaloneBackup = `sudo systemctl stop graphlake.service
sudo bash -c '
  set -e
  umask 077
  tar --acls --xattrs --numeric-owner -cpf "$1/catalog.tar" \\
    -C /var/lib/graphlake catalog
  cd "$1"
  tar -tf catalog.tar >/dev/null
  sha256sum catalog.tar > catalog.tar.sha256
  sha256sum -c catalog.tar.sha256 node-config.tar.sha256
' _ "$checkpoint"`;

export const standaloneUpgrade = 'sudo bash graphlake-release.sh activate "$target" graphlake.service';

export const colocatedUpgrade = `sudo bash graphlake-release.sh activate "$target" \\
  graphlake-worker@7441.service graphlake-worker@7442.service
systemctl is-active graphlake-worker@7441.service graphlake-worker@7442.service
sudo systemctl start graphlake.service`;

export const clusterCheckpoint = `sudo install -d -m 0700 -o graphlake -g graphlake /var/lib/graphlake-backups
export_dir=$(sudo -u graphlake mktemp -d /var/lib/graphlake-backups/pre-upgrade.XXXXXXXX)
sudo systemd-run --wait --pipe --collect --quiet \\
  -p User=graphlake -p Group=graphlake \\
  -p EnvironmentFile=/etc/graphlake/graphlake.env \\
  -E GRAPHLAKE_BACKUP_CATALOG_DIR=/var/lib/graphlake/catalog \\
  /opt/graphlake/current/bin/graphlake-admin \\
  --cluster-config /etc/graphlake/cluster.yaml backup export \\
  --file "$export_dir/control.json"
sudo -u graphlake /opt/graphlake/current/bin/graphlake-admin \\
  backup verify --file "$export_dir/control.json"
printf '%s\\n' "$export_dir"`;

export const upgradeWorker = `sudo bash graphlake-release.sh activate "$target" graphlake-worker@7441.service
systemctl is-active graphlake-worker@7441.service
sudo journalctl -u graphlake-worker@7441.service -n 30 --no-pager`;

export const upgradeCoordinator = `sudo bash graphlake-release.sh activate "$target" graphlake.service
curl -fsS --retry 10 --retry-all-errors --retry-delay 1 http://127.0.0.1:7338/status
sudo journalctl -u graphlake.service -n 30 --no-pager`;

export const handoffCoordinator = `sudo systemctl stop graphlake.service`;

export const upgradeVerify = `expected_build="${candidate}+src.${build}"
curl -fsS --retry 10 --retry-all-errors --retry-delay 1 \\
  "$GRAPHLAKE_ORIGIN/healthz" -o health-after.json
python3 - "$expected_build" <<'PY'
import json
import sys
with open("health-after.json") as response:
    build = json.load(response)["build"]
if build != sys.argv[1]:
    raise SystemExit(f"Expected {sys.argv[1]}, got {build}")
print(build)
PY
curl -fsS --retry 10 --retry-all-errors --retry-delay 1 "$GRAPHLAKE_ORIGIN/readyz"
python3 http_query.py > query-after.txt
sudo diff -u "$checkpoint/query-before.txt" query-after.txt`;

export const standaloneRollback = `previous=$(sudo cat "$checkpoint/previous-release")
sudo systemctl stop graphlake.service
sudo bash -c '
  set -e
  cd "$1"
  sha256sum -c catalog.tar.sha256
  restore=$(mktemp -d /var/lib/graphlake/.restore.XXXXXXXX)
  tar --acls --xattrs --numeric-owner -xpf catalog.tar -C "$restore"
  test -d "$restore/catalog/.graphlake-auth"
  mv /var/lib/graphlake/catalog "$restore/before-restore"
  if ! mv "$restore/catalog" /var/lib/graphlake/catalog; then
    mv "$restore/before-restore" /var/lib/graphlake/catalog
    exit 1
  fi
  printf "Replaced catalog retained at %s/before-restore\\n" "$restore"
' _ "$checkpoint"
sudo bash graphlake-release.sh activate "$previous" graphlake.service`;

export const rollbackWorker = `previous=$(sudo cat "$checkpoint/previous-release")
sudo bash graphlake-release.sh activate "$previous" graphlake-worker@7441.service`;

export const rollbackCoordinator = `previous=$(sudo cat "$checkpoint/previous-release")
sudo bash graphlake-release.sh activate "$previous" graphlake.service`;

export const verifyRecoveryArchive = `previous=$(sudo cat "$checkpoint/previous-release")
sudo "$previous/bin/graphlake-admin" backup verify --file "$export_dir/control.json"`;

export const restoreClusterCheckpoint = `restore_dir=/srv/graphlake-restore/pre-upgrade
previous=$(sudo cat "$checkpoint/previous-release")
sudo systemd-run --wait --pipe --collect --quiet \\
  -p User=graphlake -p Group=graphlake \\
  -p EnvironmentFile=/etc/graphlake/recovery.env \\
  "$previous/bin/graphlake-admin" --cluster-config /etc/graphlake/recovery.yaml \\
  backup restore --file "$restore_dir/control.json" --recovery-dir "$restore_dir"`;
