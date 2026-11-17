export const labCluster = `name: finance-lab
metadata: http://127.0.0.1:2379
storage: /var/lib/graphlake/cluster-data
token_env: GRAPHLAKE_CLUSTER_TOKEN
distributed_partitions: 4
memory_mib: 256
workers:
  - http://127.0.0.1:7441
  - http://127.0.0.1:7442`;

export const installClusterConfig = `curl -fsS http://127.0.0.1:2379/health
sudo install -d -m 0750 -o root -g graphlake /etc/graphlake
sudo install -d -m 0700 -o graphlake -g graphlake /var/lib/graphlake/cluster-data
sudo install -m 0640 -o root -g graphlake cluster.yaml /etc/graphlake/cluster.yaml
sudo touch /etc/graphlake/graphlake.env
sudo chown root:root /etc/graphlake/graphlake.env
sudo chmod 0600 /etc/graphlake/graphlake.env
sudoedit /etc/graphlake/graphlake.env`;

export const workerUnit = `[Unit]
Description=GraphLake Worker on port %i
After=network-online.target
Wants=network-online.target

[Service]
User=graphlake
Group=graphlake
EnvironmentFile=/etc/graphlake/graphlake.env
ExecStart=/opt/graphlake/current/bin/graphlake-admin --cluster-config /etc/graphlake/cluster.yaml --port %i worker --source-dir /var/lib/graphlake/catalog
Restart=on-failure
UMask=0077
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target`;

export const coordinatorOverride = `[Service]
EnvironmentFile=/etc/graphlake/graphlake.env
ExecStart=
ExecStart=/opt/graphlake/current/bin/graphlake-admin --catalog-dir /var/lib/graphlake/catalog --assets-dir /opt/graphlake/current/web --cluster-config /etc/graphlake/cluster.yaml --status-port 7338 --query-slots 3`;

export const startCluster = `sudo -u graphlake /opt/graphlake/current/bin/graphlake-admin \\
  --catalog-dir /var/lib/graphlake/catalog auth init
sudo systemctl edit graphlake
sudo systemctl daemon-reload
sudo systemctl enable --now graphlake-worker@7441 graphlake-worker@7442
sudo systemctl enable --now graphlake
curl -fsS http://127.0.0.1:7337/readyz
curl -fsS http://127.0.0.1:7338/status`;

export const productionCluster = `name: finance
metadata:
  - https://etcd-a.example:2379
  - https://etcd-b.example:2379
  - https://etcd-c.example:2379
storage: s3://graphlake-state/finance
token_env: GRAPHLAKE_CLUSTER_TOKEN
ca_file: /etc/graphlake/tls/cluster-ca.pem
identity_file: /etc/graphlake/tls/client-identity.pem
distributed_partitions: 4
memory_mib: 256
workers:
  - https://worker-a.example:7443
  - https://worker-b.example:7443`;

export const haFlags = "--coordinator-failover --public-url https://graphlake.example";

export const installMonitor = `sudo install -m 0640 -o root -g graphlake monitor.json /etc/graphlake/monitor.json
sudo install -m 0644 /opt/graphlake/current/graphlake-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now graphlake-monitor
curl -fsS http://127.0.0.1:9337/metrics`;

export const serviceChecks = `curl -fsS https://graphlake.example/healthz
curl -fsS https://graphlake.example/readyz
curl -fsS http://127.0.0.1:7338/status
sudo journalctl -u graphlake -u graphlake-worker@7441 -n 100 --no-pager`;

export const setupBackupTimer = `sudo install -m 0644 /opt/graphlake/current/graphlake-backup.service /etc/systemd/system/
sudo install -m 0644 /opt/graphlake/current/graphlake-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start graphlake-backup.service
sudo systemctl enable --now graphlake-backup.timer
sudo systemctl list-timers graphlake-backup.timer`;

export const verifyBackup = `/opt/graphlake/current/bin/graphlake-admin backup verify \\
  --file /srv/graphlake-replica/checkpoint-001/control.json`;

export const fingerprintPostgres = `/opt/graphlake/current/bin/graphlake-admin backup fingerprint-postgres \\
  --dsn-env LEDGER_DSN --relation ledger.accounts --relation ledger.transfers`;

export const recoveryManifest = JSON.stringify({
  format: 1,
  control_sha256: "<control.json sha256 field>",
  postgres: {
    dump_sha256: "<postgres.dump SHA-256>",
    dsn_env: "LEDGER_DSN",
    relations: {
      "ledger.accounts": "<accounts fingerprint>",
      "ledger.transfers": "<transfers fingerprint>",
    },
  },
  parquet: { "payments.parquet": "<payments.parquet SHA-256>" },
  canaries: [{
    model: "ledger",
    revision: "<published active_revision>",
    language: "cypher",
    query: "MATCH (:Account)-[:Transfer]->(:Account) RETURN count(*) AS transfers",
    expected_rows: [["4"]],
  }],
}, null, 2);
