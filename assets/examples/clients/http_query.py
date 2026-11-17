import base64
import json
import os
import uuid
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


origin = os.environ.get("GRAPHLAKE_ORIGIN", "http://127.0.0.1:7347").rstrip("/")
username = os.environ.get("GRAPHLAKE_USERNAME", "svc/analytics")
model_id = os.environ.get("GRAPHLAKE_MODEL", "graph")
credentials = f"{username}:{os.environ['GRAPHLAKE_TOKEN']}"
authorization = "Basic " + base64.b64encode(credentials.encode()).decode()


def request(path, body=None):
    headers = {} if body is None else {
        "Content-Type": "application/json",
        "Origin": origin,
    }
    data = None if body is None else json.dumps(body).encode()
    req = Request(f"{origin}/api/v1{path}", data=data, headers=headers)
    req.add_unredirected_header("Authorization", authorization)
    try:
        with urlopen(req, timeout=15) as response:
            return json.load(response)
    except HTTPError as error:
        raise SystemExit(f"HTTP {error.code} from {path}: {error.read().decode(errors='replace')}") from None


revision = next(
    (model.get("active_revision") for model in request("/models") if model["id"] == model_id),
    None,
)
if not revision:
    raise SystemExit(f"No published model {model_id!r} is visible to {username!r}.")

result = request(f"/models/{quote(model_id, safe='')}/query", {
    "request_id": str(uuid.uuid4()),
    "model_revision": revision,
    "language": "cypher",
    "query": "MATCH (a:Account) WHERE a.name = $name RETURN a.name AS name",
    "parameters_json": json.dumps({"name": "Alice"}),
    "timeout_ms": 10000,
})
if result["model_revision"] != revision or result["truncated"] or result["rows"] != [["Alice"]]:
    raise SystemExit("Unexpected revision or result. Check the published transfer sample.")
print([row[0] for row in result["rows"]])
print(f"Verified model {model_id} at revision {revision}")
