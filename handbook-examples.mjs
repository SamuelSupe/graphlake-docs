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

export const pageRank = `CALL algo.pagerank({relationshipTypes: ['Transfer']})
YIELD id, rank
RETURN id.key AS account, rank
ORDER BY rank DESC, account`;

export const components = `CALL algo.wcc({relationshipTypes: ['Transfer']})
YIELD id, component
RETURN id.key AS account, component
ORDER BY account`;

export const route = `/opt/graphlake/current/bin/graphlake --catalog graph.yaml route \\
  --edge Transfer --weight amount \\
  --start-label Account --start 1 --target-label Account --target 3`;

export const httpClient = `import base64
import json
import os
import uuid
from urllib.parse import quote
from urllib.request import Request, urlopen

origin = os.environ["GRAPHLAKE_ORIGIN"].rstrip("/")
model_id = os.environ.get("GRAPHLAKE_MODEL", "graph")
credentials = "svc/analytics:" + os.environ["GRAPHLAKE_TOKEN"]
basic = base64.b64encode(credentials.encode()).decode()

def call(path, body=None):
    headers = {"Authorization": "Basic " + basic}
    data = None
    if body is not None:
        headers.update({"Content-Type": "application/json", "Origin": origin})
        data = json.dumps(body).encode()
    with urlopen(Request(origin + "/api/v1" + path, data, headers), timeout=15) as response:
        return json.load(response)

models = call("/models")
model = next(model for model in models if model["id"] == model_id)
result = call("/models/" + quote(model_id, safe="") + "/query", {
    "request_id": str(uuid.uuid4()),
    "model_revision": model["active_revision"],
    "language": "cypher",
    "query": "MATCH (a:Account) WHERE a.id = $id RETURN a.name AS account",
    "parameters_json": json.dumps({"id": 1}),
    "timeout_ms": 10000,
})
print(result["rows"])
`;

export const boltClient = `import os
from neo4j import GraphDatabase

auth = ("svc/analytics", os.environ["GRAPHLAKE_TOKEN"])
with GraphDatabase.driver("bolt+s://graphlake.example:7687", auth=auth) as driver:
    with driver.session(database="graph") as session:
        records = session.run("MATCH (a:Account) RETURN a.name AS name ORDER BY name")
        print([record["name"] for record in records])`;

export const gremlinClient = `import os
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
from gremlin_python.driver.serializer import GraphSONSerializersV3d0
from gremlin_python.process.anonymous_traversal import traversal

conn = DriverRemoteConnection(
    "wss://graphlake.example/gremlin",
    "graph",
    username="svc/analytics",
    password=os.environ["GRAPHLAKE_TOKEN"],
    message_serializer=GraphSONSerializersV3d0(),
)
try:
    g = traversal().with_remote(conn)
    print(g.V().hasLabel("Account").values("name").order().to_list())
finally:
    conn.close()`;
