import argparse
import atexit
import getpass
import http.cookiejar
import json
import os
import time
import uuid
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import HTTPCookieProcessor, Request, build_opener


parser = argparse.ArgumentParser(description="Build and query the sample's partitioned CSR.")
parser.add_argument("command", choices=("build", "status", "shortest", "pagerank", "wcc"))
command = parser.parse_args().command

origin = os.environ.get("GRAPHLAKE_ORIGIN", "http://127.0.0.1:7337").rstrip("/")
model = os.environ.get("GRAPHLAKE_MODEL", "graph")
model_url = f"/models/{quote(model, safe='')}"
client = build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))


def request(path, body=None):
    headers = {"Origin": origin}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    try:
        with client.open(Request(origin + "/api/v1" + path, data=data, headers=headers), timeout=70) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        raise SystemExit(f"HTTP {error.code} from {path}: {error.read().decode(errors='replace')}") from None


def logout():
    req = Request(origin + "/api/v1/auth/logout", headers={"Origin": origin}, method="POST")
    try:
        with client.open(req, timeout=5):
            pass
    except OSError:
        pass


def account(identity):
    return json.loads(identity)["key"][0]


password = os.environ.get("GRAPHLAKE_ADMIN_PASSWORD") or getpass.getpass("GraphLake admin password: ")
request("/auth/login", {"username": "admin", "password": password})
atexit.register(logout)
_, models = request("/models")
revision = next((item.get("active_revision") for item in models if item["id"] == model), None)
if not revision:
    raise SystemExit(f"Publish model {model!r} before running the example.")

if command == "build":
    _, result = request(model_url + "/csr", {"model_revision": revision, "timeout_ms": 60000})
    print(json.dumps(result, indent=2))
elif command == "status":
    _, status = request(model_url + "/freshness")
    info = {key: status[key] for key in ("model_revision", "csr", "refresh")}
    if status["csr"] is not None:
        _, head = request(model_url + "/csr")
        info["manifest"] = {key: head[key] for key in ("generation", "vertices", "edges", "sources", "built_at_ms")}
    print(json.dumps(info, indent=2))
else:
    _, snapshot = request(model_url + "/csr")
    if snapshot["model_revision"] != revision:
        raise SystemExit("The model revision changed. Run status and select the current generation.")
    generation = snapshot["generation"]
    operations = {
        "shortest": {
            "kind": "shortest",
            "start": {"label": "Account", "key": ["1"]},
            "target": {"label": "Account", "key": ["3"]},
            "max_hops": 4,
        },
        "pagerank": {"kind": "pagerank", "damping": 0.85, "tolerance": 1e-8, "max_iterations": 100},
        "wcc": {"kind": "wcc", "max_iterations": 20},
    }
    request_id = str(uuid.uuid4())
    deadline = time.monotonic() + 65
    status, result = request(model_url + "/query", {
        "request_id": request_id,
        "model_revision": revision,
        "timeout_ms": 60000,
        "csr": {
            "generation": generation,
            "direction": "undirected" if command == "wcc" else "outgoing",
            "edge_types": ["Transfer"],
            "operation": operations[command],
        },
    })
    while status == 202:
        if time.monotonic() >= deadline:
            raise SystemExit(f"Query {request_id} is still running. Check its status before resubmitting.")
        time.sleep(0.5)
        status, result = request("/queries/" + request_id)

    if result["csr_generation"] != generation or result["model_revision"] != revision or result["truncated"]:
        raise SystemExit("The response is truncated or uses a different generation or model revision.")
    rows = result["rows"]
    if command == "shortest":
        if len(rows) != 1:
            raise SystemExit(f"Expected a single path from account 1 to 3, received {len(rows)}.")
        hops, vertices, edges = rows[0]
        output = {
            "hops": int(hops),
            "accounts": [vertex["key"][0] for vertex in json.loads(vertices)],
            "transfers": [edge["identity"]["key"][0] for edge in json.loads(edges)],
        }
    elif command == "pagerank":
        ranks = [(account(vertex), float(rank)) for vertex, rank in rows]
        output = [{"account": key, "rank": round(rank, 6)} for key, rank in
                  sorted(ranks, key=lambda row: (-row[1], row[0]))]
    else:
        output = {}
        for vertex, component in rows:
            output.setdefault(account(component), []).append(account(vertex))
        output = {component: sorted(members) for component, members in sorted(output.items())}
    print(json.dumps({"generation": generation, command: output}, indent=2))
