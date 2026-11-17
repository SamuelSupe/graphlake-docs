export const repository = "https://github.com/SamuelSupe/graphlake";
export const release = "v1.1.0";
export const reference = `${repository}/blob/${release}`;
export const releasePage = `${repository}/releases/tag/${release}`;
const artifact = "graphlake-v1.1.0-5bceeceedc8e-linux";
const downloadBase = `${repository}/releases/download/${release}`;

export const packages = ["x86_64", "aarch64"].map((arch) => {
  const archive = `${artifact}-${arch}.tar.gz`;
  return { arch, archive, url: `${downloadBase}/${archive}` };
});

export const download = `uname -m
artifact=${artifact}-$(uname -m)
base=${downloadBase}
curl -fLO "$base/$artifact.tar.gz"
curl -fLO "$base/$artifact.tar.gz.sha256"
sha256sum -c "$artifact.tar.gz.sha256"`;

export const install = `release_dir="/opt/graphlake/releases/\${artifact#graphlake-}"
if ! id graphlake >/dev/null 2>&1; then
  sudo useradd --system --user-group --home-dir /var/lib/graphlake \\
    --shell /usr/sbin/nologin graphlake
fi
sudo install -d -m 0755 /opt/graphlake/releases
sudo install -d -m 0700 -o graphlake -g graphlake \\
  /var/lib/graphlake /var/lib/graphlake/catalog
sudo install -d -m 0750 /etc/graphlake
sudo mkdir -- "$release_dir"
sudo tar -xzf "$artifact.tar.gz" --strip-components=1 -C "$release_dir"
sudo ln -s "$release_dir" /opt/graphlake/current.next
sudo mv -Tf /opt/graphlake/current.next /opt/graphlake/current
sudo install -m 0644 /opt/graphlake/current/graphlake.service \\
  /etc/systemd/system/graphlake.service`;

export const start = `sudo -u graphlake /opt/graphlake/current/bin/graphlake-admin \\
  --catalog-dir /var/lib/graphlake/catalog auth init
sudo systemctl daemon-reload
sudo systemctl enable --now graphlake
curl -fsS http://127.0.0.1:7337/healthz
curl -fsS http://127.0.0.1:7337/readyz`;

export const generateDemo = `git clone --branch ${release} --depth 1 ${repository}.git
cd graphlake
demo_root=$(mktemp -d)
demo_dir="$demo_root/catalog"
cargo run --locked --example demo -- "$demo_dir"`;

export const cypher = `MATCH (a:Account)-[:Transfer]->(b:Account)-[t:Transfer]->(c:Account)
WHERE a.tenant_id = 1 AND a.account_id = 10
RETURN c.account_id AS account, count(*) AS paths, sum(t.amount) AS amount`;

export const runDemo = `cargo run --locked -- --catalog "$demo_dir/graph.yaml" query \\
  '${cypher}'`;

export const workbench = `npm --prefix web ci
npm --prefix web run build
cargo run --locked --features admin --bin graphlake-admin -- \\
  --catalog-dir "$demo_dir" auth init
cargo run --locked --features admin --bin graphlake-admin -- \\
  --catalog-dir "$demo_dir" --assets-dir web/dist`;

export const graphQuery = `MATCH p = (:Account)-[:Transfer]->(:Account)
RETURN p`;

export const mapping = `nodes:
  Account:
    source: crm.public.accounts
    key: [tenant_id, account_id]
    properties: [status]
edges:
  Transfer:
    source: lake.finance.transfers
    key: [tenant_id, transfer_id]
    from: {node: Account, columns: [tenant_id, from_account_id]}
    to: {node: Account, columns: [tenant_id, to_account_id]}
    properties: [amount, event_time]`;

export const mcpConfig = JSON.stringify({
  mcpServers: {
    "graphlake-query": {
      url: "https://graphlake.example/mcp/query",
      headers: { Authorization: "Bearer <PERSONAL_AI_TOKEN>" },
    },
  },
}, null, 2);

export const packagesList = (checksum) => `<ul class="downloads">${packages.map(({ arch, url }) =>
  `<li><a href="${url}">${arch === "x86_64" ? "AMD64" : "ARM64"} <code>${arch}</code></a><a href="${url}.sha256">${checksum}</a></li>`
).join("")}</ul>`;
