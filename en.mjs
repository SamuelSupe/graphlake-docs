import {
  cyberInvestigation, cyberParameters, cypher, download, generateDemo, graphQuery, install, mapping, mcpConfig,
  packagesList, release, runDemo, start, workbench,
} from "./examples.mjs";
import operations from "./operations-en.mjs";
import handbook from "./handbook-en.mjs";
import { directTransfers, postgresSource } from "./handbook-examples.mjs";

const workbenchAlt = "GraphLake workbench showing three accounts linked by transfers from the Parquet demo";

export default {
  ui: {
    product: "Read-only graph analytics", overview: "Overview", docs: "Docs", language: "中文",
    primary: "Main navigation", start: "Get started", guides: "Guides", integration: "Applications and access", operations: "Operations",
    breadcrumb: "Breadcrumb", contents: "Docs navigation", onPage: "On this page", previous: "Previous", next: "Next",
    search: "Search documentation", searchAction: "Search", searchHint: "Try CSR, Bolt, or source_unavailable",
    searchEmpty: "No matching guides. Try a shorter term.", searchMatches: "Matching guides ({count})",
    skip: "Skip to content", copy: "Copy", copied: "Copied", copyError: "Select to copy",
    footer: "Resources", release: "Release notes",
  },
  home: {
    title: "Graph analytics<br class=\"wide-break\"> on your<br class=\"wide-break\"> <span class=\"hero-accent\">existing data</span>",
    description: "Model relationships across databases and lakehouse tables. Query them with Cypher, SQL, or Gremlin, then explore the results in your browser.",
    cta: "Run your first query",
    workbenchAlt,
    workflow: "From tables to a graph",
    steps: [
      ["sources", "Connect data", "Read from existing databases, warehouses, or lakehouse files. Direct queries leave source records in place."],
      ["model", "Model relationships", "Map table keys and columns to nodes, edges, and properties. Validate a draft before publishing it."],
      ["query", "Query and explore", "Follow multi-hop paths, expand neighbors in the workbench, or export results for downstream analysis."],
    ],
    cases: {
      funds: "Trace transfers across accounts and inspect the routes that connect a sender to a recipient.",
      "cyber-investigation": "Correlate a sign-in alert with processes and network connections in the same session.",
      dependencies: "Follow dependencies from a changed service to its downstream consumers.",
      lineage: "Trace datasets back to their upstream tables and jobs.",
    },
    more: "Take GraphLake further",
  },
  articles: {
    install: {
      title: "Install on Linux",
      description: "Set up a standalone GraphLake service on Debian 12 or a compatible glibc-based Linux host with systemd.",
      sections: [
        ["download", "1. Download and verify", ({ code, releasePage }) => `
<p>Use a host with <code>sudo</code> access and glibc 2.36 or newer. The <a href="${releasePage}">${release} release</a> includes the CLI, the admin service, the built workbench, and systemd assets. Download the archive and checksum matching <code>uname -m</code>.</p>
${packagesList("SHA-256 checksum")}
<p>Or use the following commands in a download directory. Continue after the checksum reports <code>OK</code>. Keep the same shell for the installation steps.</p>
${code("Shell", download)}`],
        ["install", "2. Install the service", ({ code, link }) => `
<p>Use these commands for a fresh installation. For an existing service, follow the ${link("deploy", "upgrade procedure")} first. If you downloaded the files manually, set <code>artifact</code> to the archive filename without <code>.tar.gz</code> and verify the checksum before continuing. The release directory holds the binaries and UI. The catalog under <code>/var/lib/graphlake</code> holds models and service state.</p>
${code("Shell", install)}`],
        ["start", "3. Initialize and start", ({ code }) => `
<p>Choose the <code>admin</code> password when prompted. Initialize authentication once per catalog. Run both probes after starting the unit.</p>
${code("Shell", start)}
<p><code>/healthz</code> reports the running build. <code>/readyz</code> reports service readiness. If startup fails, inspect <code>sudo journalctl -u graphlake -n 80 --no-pager</code>.</p>`],
        ["open", "4. Open the workbench", ({ code, link }) => `
<p>Open <a href="http://127.0.0.1:7337/">http://127.0.0.1:7337</a> on the service host. From another machine, replace <code>graph-host</code> with your SSH host, run the tunnel below, and open the same URL on your computer.</p>
${code("Shell", "ssh -N -L 7337:127.0.0.1:7337 graph-host")}
<p>Sign in as <code>admin</code>, then create a model and ${link("sources", "add your first data source")}. For shared access, see ${link("deploy", "HTTPS and access control")}.</p>`],
      ],
    },
    quickstart: {
      title: "Quickstart",
      description: "Run a graph query against a small Parquet dataset, then explore the results in the browser workbench.",
      sections: [
        ["generate", "1. Generate the demo data", ({ code, link }) => `
<p>Install Git, Rust 1.95 or newer, and a C/C++ toolchain. The workbench step also requires Node.js 24. The built-in demo writes three accounts, four transfers, and a graph mapping to a temporary catalog.</p>
<p>If you already have the Linux package, ${link("first-model", "try the file-based demo with the packaged binary")}.</p>
${code("Shell", generateDemo)}`],
        ["run", "2. Run a Cypher query", ({ code }) => `
<p>In the same shell, find destinations two transfers away from account <code>10</code> in tenant <code>1</code>. The amount sums the last transfer on each matched path.</p>
${code("Shell", runDemo)}
<p class="note"><strong>Expected result</strong> Account <code>30</code>, <code>2</code> paths, total amount <code>600</code>.</p>`],
        ["workbench", "3. Open the workbench", ({ code }) => `
<p>Build the browser UI, set the local <code>admin</code> password, and start the service. The catalog's valid model is adopted on startup.</p>
${code("Shell", workbench)}
<p>Open <a href="http://127.0.0.1:7337/">http://127.0.0.1:7337</a> and sign in as <code>admin</code>. In <strong>Graph Models</strong> (图模型), open <code>graph</code> and go to <strong>Query</strong> (查询).</p>`],
        ["explore", "4. Explore the transfers", ({ code, image, link }) => `
<p>Choose Cypher, run the query below, then open the <strong>Graph</strong> (图) result tab. Select a node or relationship to inspect its properties.</p>
${code("Cypher", graphQuery)}
<figure>${image("workbench", workbenchAlt)}<figcaption>The transfer graph in the GraphLake workbench.</figcaption></figure>
<p>Ready for your own data? ${link("sources", "Connect a source")} and ${link("model", "publish a graph model")}.</p>`],
      ],
    },
    sources: {
      title: "Connect data",
      description: "Give GraphLake read access to the tables, warehouse views, or files that contain your entities and relationships.",
      sections: [
        ["choose", "Choose a connector", ({ ref }) => `
<dl class="plain-list">
  <dt>Databases</dt><dd>PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, Oracle, MongoDB, DuckDB, TiDB, and OceanBase in MySQL mode.</dd>
  <dt>Warehouses and lakehouse</dt><dd>Snowflake, BigQuery, ClickHouse, Trino, Spanner, SAP HANA, Databricks SQL, Apache Doris, StarRocks, Iceberg, and Delta Lake.</dd>
  <dt>Files and object storage</dt><dd>CSV, JSON Lines, and Parquet. Configure S3, MinIO, OSS, TOS, COS, Azure Blob Storage, or GCS as a connection to browse and map files.</dd>
</dl>
<p>Oracle direct access requires Oracle Instant Client on the server. Trino can also expose SQL Server, Oracle, Hive, Hudi, MongoDB, Elasticsearch, and Redshift through configured catalogs. See the ${ref("docs/reference.zh-CN.md#图映射与连接器", "connector reference")} for configuration and supported types.</p>`],
        ["configure", "Add a source in the workbench", () => `
<ol>
  <li>Open <strong>Data Sources</strong> (数据源) in the model draft and select a connector.</li>
  <li>Enter connection settings or map file paths to table names. For credentials, specify the environment variable names configured on the GraphLake server.</li>
  <li>Choose <strong>Add to draft</strong> (添加到草稿) and save. Browse tables and columns to confirm the fields you plan to map.</li>
</ol>
<p>Use credentials with read access to the intended tables and views. Paths resolve on the GraphLake server. CSV and JSON Lines need explicit column types. Parquet supplies its own schema.</p>`],
        ["postgres", "Connect PostgreSQL step by step", ({ code, link }) => `
<ol>
  <li>Create a database identity that can connect and select the tables or views that the graph will use. Confirm that the GraphLake host can reach the database.</li>
  <li>For the packaged Linux service, set <code>GRAPHLAKE_LEDGER_DSN</code> in the root-owned <code>/etc/graphlake/graphlake.env</code>. Restart the service to read the new environment.</li>
  <li>Add a PostgreSQL source in <strong>Data Sources</strong>. Use the environment variable name for the DSN. The equivalent catalog configuration is below.</li>
</ol>
${code("YAML", postgresSource)}
<p>Browse a table such as <code>ledger.public.accounts</code> and verify key fields and endpoint types. Save the draft, then ${link("model", "map the tables and validate the model")}.</p>`],
        ["next", "Map the tables", ({ link }) => `
<p>Identify a stable key for each entity and the columns that connect one entity to another. Continue to ${link("model", "Model a graph")}. If you want queries to use a scheduled copy of selected columns, create ${link("local-tables", "a local Parquet table")}.</p>`],
      ],
    },
    model: {
      title: "Model a graph",
      description: "Build an account transfer graph in the console. Connect two files, map nodes and directed edges on the canvas, then publish and verify the result.",
      sections: [
        ["ui-start", "1. Open a new model", ({ asset, link }) => `
<p>Follow the ${link("install", "installation guide")} to start the console, then sign in as an administrator for this walkthrough. To work on an existing model, open its name in <strong>Graph Models</strong>. Access to editing and publishing depends on your ${link("access", "model permissions")}.</p>
<ol>
  <li>Download ${asset("examples/transfer/accounts.csv", "accounts.csv")} and ${asset("examples/transfer/transfers.jsonl", "transfers.jsonl")}. Put both files in the running server’s catalog directory, set by <code>--catalog-dir</code>. For a separate playground, use the catalog in ${link("first-model", "the first graph tutorial")}, which already contains the files.</li>
  <li>In <strong>Graph Models → New model</strong>, enter <code>Transfer demo</code> for <strong>Name</strong> and <code>transfer-demo</code> for <strong>Model ID</strong>. Select <strong>Continue</strong>. The ID identifies the model in API calls and client connections.</li>
</ol>`],
        ["ui-sources", "2. Connect the two source files", () => `
<p>Select <strong>Add data source</strong> in the setup guide. For the second source, use <strong>More tools → Add data source</strong> in the modeling toolbar. In a saved model, use <strong>Data Sources</strong>.</p>
<dl class="plain-list">
  <dt>CSV accounts</dt><dd>Select <strong>Configure CSV</strong>. Set the source name to <code>people</code>. Under <strong>Table mappings</strong>, use <strong>Add CSV table</strong> to create <code>accounts</code>. Set <strong>File path</strong> to <code>accounts.csv</code>. Declare <code>id</code> as <code>Int64</code> and <code>name</code> as <code>Utf8</code>, in that order.</dd>
  <dt>JSON Lines transfers</dt><dd>Select <strong>Configure JSON Lines</strong>. Set the source name to <code>payments</code>. Use <strong>Add JSON Lines table</strong> to create <code>transfers</code> with file path <code>transfers.jsonl</code>. Declare <code>id</code>, <code>src</code>, and <code>dst</code> as <code>Int64</code>, and <code>amount</code> as <code>Decimal128(18, 2)</code>.</dd>
</dl>
<p>Use <strong>Add column</strong> to enter each additional field. Leave <strong>Allow nulls</strong> cleared for both <code>id</code> columns. Select <strong>Add to draft</strong> after configuring each source. File paths refer to files on the GraphLake server.</p>`],
        ["ui-node", "3. Map the Account node label", () => `
<ol>
  <li>In the modeling toolbar, select <strong>Add node</strong>. Enter <code>Account</code> and select <strong>Add</strong>.</li>
  <li>In <strong>Configuration details</strong>, set <strong>Source table</strong> to <code>people.accounts</code> and <strong>Business key</strong> to <code>id</code>. The key must uniquely identify an account within the <code>Account</code> label.</li>
  <li>Under <strong>Properties</strong>, select <strong>+</strong> and enter <code>name</code>. Use <strong>Browse tables and columns</strong> when you need to check a field name or type.</li>
</ol>`],
        ["ui-edge", "4. Draw and map the Transfer edge", ({ image }) => `
<ol>
  <li>Select <strong>Draw edge</strong>, then select <code>Account</code> as both the start and end label. Enter <code>Transfer</code> and select <strong>Create edge</strong>.</li>
  <li>Set <strong>Source table</strong> to <code>payments.transfers</code>. Under <strong>Business key</strong>, use <strong>+</strong> to add <code>id</code>, the unique identifier of a transfer.</li>
  <li>Under <strong>Endpoint mapping</strong>, enter <code>src</code> for <strong>Start</strong> and <code>dst</code> for <strong>End</strong>. The <code>id</code> shown to the right of each arrow is the matching key column on <code>Account</code>. Under <strong>Properties</strong>, add <code>amount</code>.</li>
</ol>
<p>The canvas shows labels and edge types. The loop means that both endpoints have the <code>Account</code> label. The values in each transfer row determine which two account records it connects.</p>
<figure>${image("model-editor", "English GraphLake console showing the Transfer edge selected and src and dst mapped to Account.id")}<figcaption>Select a node or edge on the canvas to reopen its mappings. The <strong>Nodes</strong> and <strong>Edges</strong> toolbar lists can also take you to a specific label or edge type.</figcaption></figure>
<p>For a larger model, drag a node or use the arrow keys to reposition it. Use <strong>Layout</strong> and the zoom controls to adjust the view. These controls change the drawing while preserving the mappings.</p>`],
        ["publish", "5. Save, validate, and publish", ({ code, link }) => `
<ol>
  <li>Select <strong>Save draft</strong> to keep the mapping. In <strong>More tools</strong>, use <strong>Validate schema</strong> to check the mapping and <strong>Validate data</strong> to check the source rows. For example, check for duplicate keys or transfers whose endpoints have no matching account.</li>
  <li>Select <strong>Validate and publish</strong>. Publishing checks the current data and shows an <strong>Active</strong> revision when it succeeds. If saving or publishing is unavailable, check the setup guide for incomplete mappings, save unsaved changes, and confirm your ${link("access", "permissions")}.</li>
  <li>Open <strong>Query</strong>, select <code>Transfer demo</code> and <strong>Cypher</strong>, then paste and run this query.</li>
</ol>
${code("Cypher", directTransfers.replace("$account_id", "1"))}
<p class="note"><strong>Expected result</strong> The table shows one row with Alice as the sender, Bob as the recipient, and 12.25 as the amount.</p>`],
        ["keys", "Adapt keys and mappings to your data", ({ code, ref }) => `
<p>Choose a row identifier for each node label. Include tenant identity in the key when account IDs repeat across tenants. A relationship maps its source and destination columns to the full node keys in the same order.</p>
<p>In this mapping excerpt, <code>Account</code> rows come from PostgreSQL and <code>Transfer</code> rows come from Parquet. <code>amount</code> and <code>event_time</code> can be returned or filtered in queries.</p>
${code("YAML", mapping)}
<p>Use <strong>More tools → View YAML</strong> to inspect or download the draft, or edit it if you have modeling permission. The ${ref("examples/finance.yaml", "complete example")} includes the source definitions.</p>`],
        ["versions", "Manage model revisions", ({ ref }) => `
<p>Queries use the active revision while you edit. In <strong>More tools → Version history</strong>, select a published version to compare it with the current draft. A publisher can roll back to a previous published mapping or take the model offline. Restoring source data requires a separate backup.</p>
<p>For multi-table mappings, filters, and business-time rules, see the ${ref("docs/reference.zh-CN.md#多表图映射与业务时间", "model reference")}.</p>`],
      ],
    },
    query: {
      title: "Query and explore",
      description: "Run read-only graph queries, inspect paths in the browser, and export the results when you need the full dataset.",
      sections: [
        ["run", "Run against a published model", ({ code, link }) => `
<p>Open <strong>Query</strong> (查询), select a published model, and choose Cypher, SQL, or Gremlin. In the ${link("quickstart", "Parquet demo")}, this Cypher query summarizes two-hop transfers to each destination.</p>
${code("Cypher", cypher)}
<p>Use the query options to set a timeout or provide Cypher parameters. The result identifies the model revision and source versions. Check these when reproducing a result. See ${link("query-recipes", "query recipes")} for runnable examples in all three languages.</p>`],
        ["graph", "Investigate the graph", ({ code }) => `
<p>Return a path or graph objects to populate the graph view. Select a node or edge to inspect its properties. Expand a node to see its neighbors and load additional batches as needed. Use the table view for scalar results.</p>
${code("Cypher", graphQuery)}`],
        ["export", "Work with larger results", ({ ref }) => `
<p>The workbench shows a bounded preview. Use cancellation for a query you no longer need. For complete results, enable full-result capture and download Arrow IPC with query and export permissions. Use filters, hop bounds, and resource limits to keep exploratory queries predictable.</p>
<p>Applications can use HTTP, Bolt, Gremlin WebSocket, the CLI, or embedded Rust. See the ${ref("docs/reference.zh-CN.md#查询语义与资源控制", "query and protocol reference")} and the ${ref("docs/reference.zh-CN.md#整图算法", "graph algorithms reference")} for shortest paths, PageRank, and community detection.</p>`],
      ],
    },
    "local-tables": {
      title: "Local tables",
      description: "Load selected source columns into managed Parquet and use the copy for queries that can tolerate scheduled freshness.",
      sections: [
        ["load", "Load and publish a copy", ({ image }) => `
<ol>
  <li>As an administrator, save the source configuration in a model draft, then open <strong>Local Tables</strong> (本地表).</li>
  <li>Choose the source table and the columns needed by the model, including keys and endpoints. Create and load the copy.</li>
  <li>When the run succeeds, add the copy to model sources. Point the mapping to <code>local_&lt;name&gt;.data</code>, validate the draft, and publish it.</li>
</ol>
<figure>${image("local-tables", "Local Tables panel showing a successful transfer table load and the next scheduled refresh")}<figcaption>Check copy readiness and run history before switching a mapping.</figcaption></figure>`],
        ["refresh", "Choose a refresh strategy", () => `
<dl class="plain-list">
  <dt>Full refresh</dt><dd>Read the selected fields again and publish a new snapshot. Use this to reflect physical deletes and changes to keys.</dd>
  <dt>Incremental refresh</dt><dd>Set a stable, unique, non-null key and an integer, date, or timestamp watermark. Advance the watermark on every insert and update. GraphLake rereads the watermark boundary and replaces rows by key.</dd>
  <dt>Scheduled refresh</dt><dd>Schedule either mode, then check the last successful run and next run time. The first load is full.</dd>
</dl>
<p class="note"><strong>Freshness</strong> Incremental refresh reads by watermark. Reconcile deletes and late rows below the committed watermark with a full refresh.</p>`],
        ["recovery", "Maintain the snapshot", ({ ref }) => `
<p>A failed load before publication leaves the prior committed copy available. Back up the entire catalog, including <code>.graphlake-local/</code>. Workers reading local copies need access at the same absolute path. See the ${ref("docs/local-tables.zh-CN.md", "local tables reference")} for recovery, storage, and concurrency limits.</p>`],
        ["managed", "Use shared managed snapshots in HA", ({ code, link }) => `
<p>In a ${link("cluster", "cluster with Coordinator failover")}, enable managed local tables in the shared cluster configuration. The Coordinators and Workers use the same etcd namespace and S3-compatible storage prefix. This lets Workers read managed snapshots from object storage.</p>
${code("YAML", "managed_local_tables: true\nlocal_snapshot_retention_seconds: 86400\nlocal_snapshot_gc_grace_seconds: 300")}
<p>Create and load a new managed table, then switch the model to the <code>local-table://&lt;table UUID&gt;</code> reference and publish. Existing mappings can keep reading their file-backed copies during the transition. GraphLake reclaims eligible old generations and retains snapshots held by active queries or backups. Apply bucket lifecycle rules to incomplete uploads and noncurrent object versions. Keep live object retention under GraphLake's control.</p>`],
      ],
    },
    mcp: {
      title: "Connect an AI client",
      description: "Give an AI client access to published queries or authorized modeling tasks through Model Context Protocol (MCP).",
      sections: [
        ["enable", "Enable the service you need", () => `
<p>In <strong>Runtime Settings → MCP services</strong> (运行配置 → MCP 服务), an administrator can enable query and modeling independently. Both default to disabled. Enable publication separately if it is required.</p>
<dl class="plain-list">
  <dt><code>/mcp/query</code></dt><dd>Discover visible models and published schema, then run bounded read-only queries.</dd>
  <dt><code>/mcp/modeling</code></dt><dd>Read, validate, create, and save authorized drafts. Publication requires the publisher role and server opt-in.</dd>
</dl>`],
        ["connect", "Register GraphLake in your client", ({ code }) => `
<p>Open <strong>AI</strong> in the console. Generate a personal token and store it in the client's credential configuration. Add a Streamable HTTP MCP entry for each service you need. Replace the example origin with your GraphLake HTTPS origin and provide the token in the <code>Authorization</code> header.</p>
${code("JSON", mcpConfig)}
<p>The token uses the owner's current model permissions and tenant scope. An administrator can issue a token for a member with MCP access. Test the connection in the AI workspace to check the authenticated identity and tool visibility.</p>`],
        ["use", "Run your first request", ({ ref }) => `
<p>Ask the client to list permitted models, inspect the published schema, and run a small query. For model edits, read the current draft and revision, validate changes, and review the saved draft before publishing. See the ${ref("docs/mcp.md", "MCP reference")} for role checks, token rotation, and query limits.</p>`],
      ],
    },
    "use-cases": {
      title: "Use cases",
      description: "Start from a relationship question. The examples below show which tables to map and what to inspect in the result.",
      sections: [
        ["funds", "Transaction investigation", ({ code, link }) => `
<p><strong>Question.</strong> Which accounts receive funds two transfers away from a starting account?</p>
<p>Map accounts to <code>Account</code> nodes and transfers to <code>Transfer</code> edges with amount and event time. Use tenant-aware keys. Rank destinations by path count or amount, then inspect individual transfer paths and timestamps.</p>
${code("Cypher", cypher)}
<p>Run this example on the ${link("quickstart", "included Parquet dataset")}.</p>`],
        ["cyber-investigation", "Cyber investigation", ({ code, link }) => `
<p><strong>Question.</strong> A sign-in alert names an account. Which processes started in the matching session, and what endpoints did they contact during the incident window?</p>
<p>Map sign-in logs to <code>Identity → Host</code>, endpoint process telemetry to <code>Host → Process</code>, and network events to <code>Process → NetworkEndpoint</code>. Use tenant-scoped identity and host keys, and a process instance ID that distinguishes reused PIDs. Keep the originating event ID and UTC epoch milliseconds on each edge. Map the same host-scoped session identifier on sign-ins and process starts.</p>
<p>In the published model, run this Cypher query. Supply the alert's account and time window in <strong>Query options</strong>.</p>
${code("Cypher", cyberInvestigation)}
${code("JSON", cyberParameters)}
<p>Open the returned paths in ${link("query", "the graph view")} and select an edge to find the source event ID. Verify the account, process, and destination in the original telemetry before recording a finding.</p>`],
        ["dependencies", "Service impact analysis", ({ code, link }) => `
<p><strong>Question.</strong> Which services depend on the component being changed?</p>
<p>Map an inventory table to <code>Service</code> nodes and calls or declared dependencies to <code>DEPENDS_ON</code> edges, directed from consumer to dependency. Keep ownership and environment as properties. For this illustrative schema, the query follows incoming dependencies up to three hops from <code>payments</code>.</p>
${code("Cypher", "MATCH p = (s:Service)-[:DEPENDS_ON*1..3]->(target:Service)\nWHERE target.name = 'payments'\nRETURN p LIMIT 100")}
<p>See how to ${link("model", "map node and relationship keys")} before running this on your own inventory.</p>`],
        ["lineage", "Data lineage", ({ code, link }) => `
<p><strong>Question.</strong> Which upstream datasets contributed to a report table?</p>
<p>Map catalog entries to <code>Dataset</code> nodes and lineage records to <code>DERIVED_FROM</code> edges, directed from output to input. Add job or pipeline identifiers as relationship properties. For this illustrative schema, explore paths up to four hops from the report.</p>
${code("Cypher", "MATCH p = (report:Dataset)-[:DERIVED_FROM*1..4]->(:Dataset)\nWHERE report.name = 'daily_revenue'\nRETURN p LIMIT 100")}
<p>Use ${link("query", "the graph view")} to inspect paths and share findings with dataset owners.</p>`],
      ],
    },
    ...handbook,
    ...operations,
    deploy: {
      title: "Deploy and operate",
      description: "Choose a runtime mode and verify service health, access, and recovery before directing clients to the deployment.",
      sections: [
        ["topology", "Choose a deployment mode", ({ link }) => `
<dl class="plain-list">
  <dt>Standalone service</dt><dd>${link("install", "Install one graphlake-admin process")} for the browser, HTTP, and optional Bolt and Gremlin endpoints.</dd>
  <dt>Distributed service</dt><dd>Use a Coordinator with private Workers for supported distributed operations. Run the same build on all nodes and provide access to the mapped data.</dd>
  <dt>Coordinator failover</dt><dd>Use etcd for leadership, S3-compatible shared control state, and TLS ingress that probes the elected Coordinator.</dd>
</dl>
<p>See the ${link("cluster", "cluster installation guide")} for configuration, startup, HA, and acceptance checks.</p>`],
        ["access", "Secure the client entry point", ({ ref }) => `
<p>For shared browser access, use an HTTPS reverse proxy and set <code>--public-url</code> to the exact browser origin. Create model-level roles for query, export, modeling, publishing, and audit. Use role-based service accounts for application drivers and scoped personal tokens for AI clients.</p>
<p>Keep database credentials in server-side environment settings. See the ${ref("deploy/README.md", "service and client reference")} for proxy headers and protocol configuration.</p>`],
        ["health", "Check health and data access", ({ link }) => `
<p>Check the build at <code>/healthz</code> and readiness at <code>/readyz</code>. Use runtime health to probe published sources and Workers, then run a known-result query through the same ingress clients use. Collect Prometheus metrics, audit events, and OpenTelemetry signals as needed.</p>
<p>See the ${link("monitoring", "monitoring guide")} for probe and telemetry setup.</p>`],
        ["recover", "Upgrade, roll back, and recover", ({ link, ref }) => `
<p>Back up the catalog and credential configuration, and keep the previous binary release. Stop the standalone service, unpack the new archive into a separate directory, switch <code>current</code> and the unit as needed, then restart. Confirm the running build, model revision, and known-result query. Rollback restores the old release and its matching catalog when needed.</p>
<p>For off-site recovery, keep a checkpoint that binds control state, PostgreSQL and Parquet snapshots, and expected business-query results. In the target <code>/recovery</code> page, import the checkpoint and pass acceptance checks before reopening traffic. Include local table artifacts referenced by the control export and keep a separate catalog backup for standalone deployments.</p>
<p>See the ${ref("docs/deployment.md#upgrade-and-rollback", "upgrade guide")} and ${link("recovery", "backup and recovery guide")}.</p>`],
      ],
    },
  },
};
