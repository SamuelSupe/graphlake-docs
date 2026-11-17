import os

from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
from gremlin_python.driver.serializer import GraphSONSerializersV3d0
from gremlin_python.process.anonymous_traversal import traversal


url = os.environ.get("GRAPHLAKE_GREMLIN_URL", "ws://127.0.0.1:7347/gremlin")
connection = DriverRemoteConnection(
    url,
    os.environ.get("GRAPHLAKE_MODEL", "graph"),
    username=os.environ.get("GRAPHLAKE_USERNAME", "svc/analytics"),
    password=os.environ["GRAPHLAKE_TOKEN"],
    message_serializer=GraphSONSerializersV3d0(),
)
try:
    names = traversal().with_remote(connection).V().has("Account", "name", "Alice").values("name").to_list()
finally:
    connection.close()

if names != ["Alice"]:
    raise SystemExit(f"Expected ['Alice'], received {names!r}.")
print(names)
