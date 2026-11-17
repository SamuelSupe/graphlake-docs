import { readFileSync } from "node:fs";

export const postgresSource = `sources:
  ledger:
    type: postgres
    dsn_env: GRAPHLAKE_LEDGER_DSN`;

export const syncDemoSetup = `catalog_dir=/path/to/your/catalog
sqlite3 "$catalog_dir/ledger.db" <<'SQL'
CREATE TABLE accounts (
  id INTEGER NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  updated_seq INTEGER NOT NULL
);
INSERT INTO accounts VALUES (1, 'Alice', 1), (2, 'Bob', 2), (3, 'Carol', 3);
SQL`;

export const syncDemoUpdate = `sqlite3 "$catalog_dir/ledger.db" \\
  "UPDATE accounts SET name = 'Robert', updated_seq = 4 WHERE id = 2;"`;

export const sampleCatalog = readFileSync(
  new URL("./assets/examples/transfer/graph.yaml", import.meta.url), "utf8",
).trimEnd();

export const downloadSample = `demo_dir=$(mktemp -d)
cd "$demo_dir"
demo_base=https://graphlake-docs.pages.dev/assets/examples/transfer
curl -fLO "$demo_base/graph.yaml"
curl -fLO "$demo_base/accounts.csv"
curl -fLO "$demo_base/transfers.jsonl"`;

export const sampleWorkbench = `/opt/graphlake/current/bin/graphlake-admin --catalog-dir "$demo_dir" auth init
/opt/graphlake/current/bin/graphlake-admin --catalog-dir "$demo_dir" \\
  --assets-dir /opt/graphlake/current/web --port 7347`;

export const directTransfers = `MATCH (a:Account)-[t:Transfer]->(b:Account)
WHERE a.id = $account_id
RETURN a.name AS sender, b.name AS recipient, t.amount AS amount
ORDER BY t.id`;

export const workbenchPath = `MATCH p = (a:Account)-[t:Transfer]->(b:Account)
WHERE a.id = $account_id
RETURN p, a.name AS sender, b.name AS recipient, t.amount AS amount`;

export const runSample = `/opt/graphlake/current/bin/graphlake --catalog graph.yaml query \\
  --parameters '{"account_id":1}' \\
  '${directTransfers}'`;

export const transferTotals = `SELECT count(*) AS transfers, sum(amount) AS total
FROM "Transfer"`;

export const twoHopTraversal = "g.V(1).hasLabel('Account').out('Transfer').out('Transfer').values('name')";

export const outgoingCounts = `MATCH (a:Account)
OPTIONAL MATCH (a)-[t:Transfer]->(:Account)
RETURN a.name AS account, count(t) AS outgoing
ORDER BY account`;

export const followPath = `MATCH p = (a:Account)-[:Transfer]->(:Account)-[:Transfer]->(b:Account)
WHERE a.id = $account_id
RETURN p`;

export const csrSample = downloadSample + "\nprintf '4,Dana\\n' >> accounts.csv";

export const shortestPath = `MATCH p = shortestPath(
  (a:Account {id: 1})-[:Transfer*1..4]->(b:Account {id: 3})
)
RETURN p, [n IN nodes(p) | n.name] AS accounts, length(p) AS hops`;

export const pageRank = `CALL algo.pagerank({
  relationshipTypes: ['Transfer'], damping: 0.85, tolerance: 0.00000001, maxIterations: 100
})
YIELD id, rank
RETURN id.key AS account, rank ORDER BY rank DESC, account`;

export const components = `CALL algo.wcc({relationshipTypes: ['Transfer']})
YIELD id, component
RETURN id.key AS account, component.key AS component_account ORDER BY account`;

export const csrRefreshDemo = `printf '%s\\n' '{"id":12,"src":3,"dst":4,"amount":"5.00"}' >> transfers.jsonl`;

export const route = `/opt/graphlake/current/bin/graphlake --catalog graph.yaml route \\
  --edge Transfer --weight amount \\
  --start-label Account --start 1 --target-label Account --target 3`;

export const clientWorkbench = sampleWorkbench + " --driver-model graph --bolt-port 7687";

export const clientEnvironment = `export GRAPHLAKE_ORIGIN=http://127.0.0.1:7347
export GRAPHLAKE_BOLT_URI=bolt://127.0.0.1:7687
export GRAPHLAKE_GREMLIN_URL=ws://127.0.0.1:7347/gremlin
export GRAPHLAKE_USERNAME=svc/analytics
export GRAPHLAKE_MODEL=graph
printf 'GraphLake service token: '
read -rs GRAPHLAKE_TOKEN
printf '\\n'
export GRAPHLAKE_TOKEN`;

export const clientVenv = `python3 -m venv .venv
. .venv/bin/activate`;

export const boltRun = `python -m pip install 'neo4j==5.28.2'
python bolt_query.py`;

export const gremlinRun = `python -m pip install 'gremlinpython==3.7.4'
python gremlin_query.py`;

export const clientScript = (filename) =>
  readFileSync(new URL(`./assets/examples/clients/${filename}`, import.meta.url), "utf8").trimEnd();
