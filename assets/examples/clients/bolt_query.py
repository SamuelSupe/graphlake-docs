import os

from neo4j import GraphDatabase, READ_ACCESS


uri = os.environ.get("GRAPHLAKE_BOLT_URI", "bolt://127.0.0.1:7687")
auth = (os.environ.get("GRAPHLAKE_USERNAME", "svc/analytics"), os.environ["GRAPHLAKE_TOKEN"])
model_id = os.environ.get("GRAPHLAKE_MODEL", "graph")

with GraphDatabase.driver(uri, auth=auth, connection_timeout=10) as driver:
    with driver.session(database=model_id, default_access_mode=READ_ACCESS) as session:
        records = session.run(
            "MATCH (a:Account) WHERE a.name = $name RETURN a.name AS name",
            name="Alice",
        )
        names = [record["name"] for record in records]

if names != ["Alice"]:
    raise SystemExit(f"Expected ['Alice'], received {names!r}.")
print(names)
