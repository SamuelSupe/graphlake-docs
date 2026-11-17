import {
  cyberInvestigation, cyberParameters, cypher, download, generateDemo, graphQuery, install, mapping, mcpConfig,
  packagesList, release, runDemo, start, workbench,
} from "./examples.mjs";
import operations from "./operations-en.mjs";
import handbook from "./handbook-en.mjs";
import { datasourcePage } from "./datasources.mjs";
import { directTransfers, postgresSource, syncDemoSetup, syncDemoUpdate, workbenchPath } from "./handbook-examples.mjs";

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
    datasources: datasourcePage(false),
    sources: {
      title: "Connect data",
      description: "Give GraphLake read access to the tables, warehouse views, or files that contain your entities and relationships.",
      sections: [
        ["choose", "Choose a connector", ({ link }) => `
<p>Use the ${link("datasources", "data source catalog")} to find the connection type, required settings, and dependencies for your database, warehouse, lakehouse table, or file storage.</p>`],
        ["configure", "Add a source in the workbench", ({ image }) => `
<p>Sign in as an administrator. To follow the screenshots, prepare the <a href="#sqlite-demo">SQLite sample</a> before adding the connection.</p>
<ol>
  <li>Open <strong>Data Sources</strong> in the console and select the model you want to configure. Select <strong>Add data source</strong>, search for the connector, and choose <strong>Configure</strong> on its card. In a new, unsaved model, start from <strong>Add data source</strong> in the modeling guide.</li>
  <li>Give the source a name unique within the model, without periods. Enter the connection settings or map file paths to table names. For the SQLite sample, use <code>ledger</code> as the name and <code>ledger.db</code> as the <strong>Database file path</strong>.</li>
  <li>Select <strong>Add to draft</strong>, then <strong>Save draft</strong>. If the configuration panel opens after adding the source, you can save inside that panel. To edit an existing connection, open <strong>Configure</strong> on its source card.</li>
</ol>
<p>Use read-only credentials and supply the names of server-side environment variables for credential fields. File paths are resolved on the GraphLake server. CSV and JSON Lines require explicit column types, and Parquet carries its schema.</p>
<figure>${image("source-add", "English Configure SQLite panel showing the ledger source name, ledger.db path, and Add to draft")}<figcaption>Choose <strong>Add to draft</strong> after filling in the connector settings.</figcaption></figure>`],
        ["sqlite-demo", "Prepare the SQLite sample", ({ code }) => `
<p>On the GraphLake host, set <code>catalog_dir</code> to the path passed to <code>--catalog-dir</code> for your practice console. Use a directory without an existing <code>ledger.db</code>. Run this command with <code>sqlite3</code> installed, and make the new file readable by the GraphLake service account.</p>
${code("Shell", syncDemoSetup)}
<p>The example uses <code>id</code> to identify a row and <code>updated_seq</code> to track changes. After adding the SQLite source as <code>ledger</code>, select <code>ledger.accounts</code> for the sync walkthrough.</p>`],
        ["browse", "Browse tables and columns", ({ image }) => `
<ol>
  <li>On the source card, select <strong>Browse tables and columns</strong>. If the connector shows a schema or namespace selector, choose it first. For PostgreSQL, this could be <code>public</code>.</li>
  <li>Choose the <strong>Source table</strong>. Read <strong>Column</strong>, <strong>Type</strong>, and <strong>Nullable</strong> in the preview. In the example, <code>id</code> and <code>updated_seq</code> are non-null <code>Int64</code> columns.</li>
  <li>If a known table is missing from the list, open <strong>Find manually</strong>. Fill in <strong>Fully qualified table name</strong> using the connector’s naming format, then select <strong>Load columns</strong>. When opening the browser from a model mapping or the local-table form, select <strong>Use this table</strong> to fill in the selected table.</li>
</ol>
<figure>${image("source-browser", "English source browser showing ledger.accounts and the columns id, name, and updated_seq with types and nullability")}<figcaption>Check the key, endpoint, and watermark fields before using them in a mapping or a sync job.</figcaption></figure>
<p>If the browse request fails, see <a href="../troubleshoot/#source">Troubleshoot a data source connection</a>.</p>`],
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
      description: "Run a parameterized query, switch between result views, and follow relationships one hop at a time in the console.",
      sections: [
        ["run", "Run against a published model", ({ code, link }) => `
<p>Open <strong>Query</strong> and select a published model. For this walkthrough use <code>Transfer demo</code> from ${link("model", "the canvas modeling tutorial")}. The published <code>graph</code> model from ${link("first-model", "Build your first graph")} works with the same query.</p>
<p>Choose <strong>Cypher</strong> next to <strong>Run query</strong> and paste this into <strong>Query statement</strong>. It returns the path <code>p</code> for the canvas, plus the sender, recipient, and amount for the table. See ${link("query-recipes", "query recipes")} for SQL and Gremlin examples.</p>
${code("Cypher", workbenchPath)}`],
        ["parameters", "Set Cypher parameters", ({ code, image }) => `
<ol>
  <li>Below the editor, open <strong>Query options → Cypher parameters (JSON)</strong>. Paste the JSON object below. Use the key <code>account_id</code> without the dollar sign. Enter <code>1</code> as a number because this sample uses an <code>Int64</code> account ID.</li>
  <li>Select <strong>Run query</strong>. Open <strong>Table</strong> to check the single row. Alice sent Bob <code>12.25</code>.</li>
  <li>To reuse the statement, change the value to <code>2</code> and run it again. The row now shows Bob sending Carol <code>25.50</code>. Set the value back to <code>1</code> and run again before the neighbor walkthrough.</li>
</ol>
${code("JSON", '{"account_id":1}')}
<p>If the query reports a parameter error, check that you entered a JSON object with double-quoted keys and that each key matches the name after <code>$</code> in the statement. The parameter field appears when Cypher is selected. Leave <strong>Timeout (ms)</strong> empty to use the server default. See <a href="../troubleshoot/#query">Troubleshoot a query error</a> for other failure codes.</p>
<figure>${image("query-parameters", "English Query workspace with account_id set to 1 and the Table tab showing Alice, Bob, and 12.25")}<figcaption>Enter the statement in the editor and its JSON parameters in <strong>Query options</strong>.</figcaption></figure>`],
        ["views", "Switch result views", () => `
<p>Use the tabs above the results to inspect the query output or the published schema.</p>
<dl class="plain-list">
  <dt>Graph</dt><dd>Explore returned nodes, edges, and paths. Select an element to inspect its business key and properties. For a query that returns only scalar values, use <strong>Table</strong>. To populate the graph, return a node, edge, or path such as <code>RETURN p</code>.</dd>
  <dt>Table</dt><dd>Read the returned rows and column types. In this example, <code>p</code> is the path and the other columns show the transfer details.</dd>
  <dt>Graph schema</dt><dd>Inspect the published model’s node labels, edge types, business keys, and mapped properties.</dd>
  <dt>Raw response</dt><dd>Inspect the latest query’s response JSON. Open <strong>Execution details</strong> below the results to check the model revision and source versions.</dd>
</dl>`],
        ["graph", "Expand one-hop neighbors", ({ image }) => `
<ol>
  <li>With the result for <code>account_id</code> set to <code>1</code>, switch to <strong>Graph</strong>. Select the <code>Account</code> node with business key <code>2</code>. The properties panel identifies it as Bob.</li>
  <li>In the node’s properties panel, open <strong>Expansion filters</strong>. Set <strong>Direction</strong> to <strong>Outgoing</strong> and <strong>Edge types</strong> to <code>Transfer</code>. Choose <strong>Incoming</strong> to follow edges pointing to the selected node, or <strong>Both directions</strong> to follow either direction. After choosing an edge type with mapped properties, you can add a property condition.</li>
  <li>Select <strong>Expand neighbors</strong>. Carol and the <code>Transfer</code> edge from Bob appear on the canvas. It now shows three nodes and two edges. Use <strong>Fit graph to view</strong> if a new node is outside the current view.</li>
</ol>
<p>Each expansion adds one hop around the selected node. If more matches are available, select <strong>Load next page</strong> to add another batch for the same node. To follow another hop, select one of the newly added nodes and expand it. <strong>Table</strong> and <strong>Raw response</strong> read from the query execution. If the model revision changes, rerun the query before continuing.</p>
<figure>${image("query-neighbors", "English Graph view showing Alice to Bob to Carol, with Bob selected and the Outgoing Transfer expansion controls visible")}<figcaption>Bob’s outgoing transfer adds Carol to the graph. The row count above the tabs refers to the query execution.</figcaption></figure>`],
        ["export", "Work with larger results", ({ link, ref }) => `
<p>The workbench shows a bounded preview. Use cancellation for a query you no longer need. For complete results, enable full-result capture and download Arrow IPC with query and export permissions. Use filters, hop bounds, and resource limits to keep exploratory queries predictable.</p>
<p>Applications can use HTTP, Bolt, Gremlin WebSocket, the CLI, or embedded Rust. See the ${ref("docs/reference.zh-CN.md#查询语义与资源控制", "query and protocol reference")} and the ${ref("docs/reference.zh-CN.md#整图算法", "graph algorithms reference")} for shortest paths, PageRank, and community detection.</p>
<p>For runnable shortest path, PageRank, and component examples, see ${link("algorithms", "Graph algorithms and CSR")}.</p>`],
      ],
    },
    "local-tables": {
      title: "Local tables",
      description: "Create a Parquet copy from an external table, set full or incremental refresh, and track sync jobs in the console.",
      sections: [
        ["load", "Create and load a local table", ({ link }) => `
<ol>
  <li>As an administrator, ${link("sources", "add the source and save the model draft")}. Open <strong>Data Sources → Local tables and sync</strong> or <strong>Graph Models → Local tables</strong>.</li>
  <li>Select <strong>Create local table</strong> and enter a name. Under <strong>External source table</strong>, browse to the source, choose the table, and select <strong>Use this table</strong>.</li>
  <li>In <strong>Columns and primary key</strong>, keep every field used by the model’s keys, endpoints, and properties. For the SQLite sample, name the copy <code>accounts_local</code>, choose <code>ledger.accounts</code>, and keep <code>id</code>, <code>name</code>, and <code>updated_seq</code>.</li>
  <li>Set the refresh method below. Leave <strong>Load immediately</strong> checked and select <strong>Create local table</strong> to start the first load in the background. If you clear it, select <strong>Load copy</strong> on the table card later.</li>
</ol>`],
        ["refresh", "Configure full or incremental refresh", ({ image }) => `
<dl class="plain-list">
  <dt>Full replacement</dt><dd>Select <strong>Full replacement</strong> under <strong>Refresh method</strong>. Each load reads the selected columns across the source table and replaces the copy after success. This captures physical deletes and primary-key changes.</dd>
  <dt>Incremental refresh</dt><dd>While creating the table, tick the <strong>Primary key</strong> checkbox beside each key column and select <strong>Incremental refresh</strong>. Choose a non-null integer, date, or timestamp in <strong>Watermark column</strong>. For the sample, use <code>id</code> as the key and <code>updated_seq</code> as the watermark.</dd>
  <dt>Scheduled refresh</dt><dd>Under <strong>Schedule</strong>, turn on <strong>Enable scheduled refresh</strong> and set the interval in seconds (minimum <code>30</code>). For example, use <code>3600</code> for hourly refresh and, with incremental mode, <code>86400</code> under <strong>Full reconciliation interval</strong> for a separate daily full load. You can also set the load timeout.</dd>
</dl>
<p>The first load reads the full source table, including when the configured method is incremental. Later incremental loads reread the committed watermark boundary and merge by key. The key must be stable, unique, and non-null. Advance the watermark on every insert or update. Use a full reconciliation for physical deletes and changes outside the lookback window.</p>
<p>While creating an incremental table, you can set a <strong>Lookback window</strong> in the watermark column’s units to reread earlier rows. If the source records deletions in a non-null boolean or integer column, select it under <strong>Soft-delete column</strong> to remove the matching keys during incremental refresh.</p>
<p>On an existing table, <strong>Refresh settings → Save settings</strong> changes the method, intervals, or timeout for the next run. A table needs a key and watermark set at creation to offer incremental mode. Create a new table to change the source, selected columns, key, or watermark. To run a one-off full load, select <strong>More actions → Run full load</strong>. <strong>Sync now</strong> uses the configured refresh method.</p>
<figure>${image("local-sync-settings", "English Create local table dialog with id checked as the primary key and updated_seq selected for incremental refresh")}<figcaption>The left checkboxes select columns to load. The right checkbox marks <code>id</code> as the primary key.</figcaption></figure>`],
        ["status", "Check sync status and load history", ({ code, image }) => `
<p>Open <strong>Local tables and sync</strong> for the selected model and find the table by name or source. The table card shows the latest job status, rows from the latest successful load, refresh policy, next refresh, and last full reconciliation. The <strong>Copy ready</strong> count tracks tables with a usable snapshot.</p>
<figure>${image("local-tables", "English sync panel showing the status, next refresh time, and Load history action for accounts_local")}<figcaption>Use the table card to check the schedule and open refresh settings or load history.</figcaption></figure>
<p>Select <strong>Load history</strong> on the table card for the last 20 runs. Each entry shows the mode, trigger, status, duration, and row counts. <strong>Rows read</strong> can include rows at the watermark boundary. <strong>Total after commit</strong> is the size of the resulting copy. If a run fails, read the error on the card or in history and follow the <a href="../troubleshoot/#sync">sync troubleshooting steps</a>.</p>
<details class="example-details"><summary>Try an incremental update with the SQLite sample</summary>
<p>After the first load shows three rows, run this command on the sample database. Select <strong>Sync now</strong> on <code>accounts_local</code> and open <strong>Load history</strong>. With the default lookback of zero, two rows are read (watermarks <code>3</code> and <code>4</code>), and the copy has three rows after commit.</p>
${code("Shell", syncDemoUpdate)}
</details>
<figure>${image("local-sync-history", "English Load history for accounts_local showing successful incremental and full runs and committed row totals")}<figcaption>The latest full run captured a physical deletion in the sample. The earlier incremental update read two rows and committed a three-row copy.</figcaption></figure>`],
        ["use-copy", "Use the local copy in the graph", () => `
<p>Once a copy is ready, select <strong>More actions → Add as model data source</strong> and pick <code>local_&lt;name&gt;.data</code> in a node or edge mapping. To replace mappings already using that exact external table, choose <strong>Switch mappings to local copy</strong>. Check the mapped columns, save the draft, validate it, and publish the model to direct queries to the copy.</p>`],
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
        ["enable", "Enable query and modeling services", ({ image, link }) => `
<ol>
  <li>As an administrator, grant the account <strong>Allow MCP access</strong> and the required model actions in ${link("access", "Access Control")}.</li>
  <li>Open <strong>Runtime Settings → MCP Services</strong>. Turn on <strong>Enable query service</strong>, <strong>Enable modeling service</strong>, or both. Both are off by default. Set the row limit and timeout for query requests as needed.</li>
  <li>Select <strong>Save MCP settings</strong>. Changes take effect immediately. To let an agent publish, separately enable <strong>Allow model publishing</strong> and give its account <strong>Publish</strong> on the target model.</li>
</ol>
<dl class="plain-list">
  <dt><code>/mcp/query</code></dt><dd>Discover visible models and published schema, then run bounded read-only queries.</dd>
  <dt><code>/mcp/modeling</code></dt><dd>Read, validate, create, and save authorized drafts. Creating a draft requires Modeling rights on both an approved template and the preauthorized new model ID.</dd>
</dl>
<figure>${image("mcp-settings", "English MCP Services settings showing query and modeling enabled with model publishing unchecked")}<figcaption>Use the independent switches to enable the services needed by your client.</figcaption></figure>`],
        ["token", "Generate a personal token", ({ image }) => `
<ol>
  <li>Sign in as the member the AI client will represent and open <strong>AI</strong>. Expand <strong>My permissions</strong> to check model access.</li>
  <li>In <strong>Personal token</strong>, select <strong>Generate personal token</strong> and then <strong>Copy token</strong>. Save it in the client’s credential store before leaving or refreshing the page. The token is revealed only during issuance.</li>
</ol>
<p>Each user has one active token, valid for 90 days. Use <strong>Manage token</strong> to replace or revoke it. Generating a replacement invalidates the old token. For a member with MCP access and console sign-in disabled, an administrator can select <strong>Issue MCP token</strong> and save the member in <strong>Access Control → Members</strong>.</p>
<figure>${image("mcp-client-setup", "English AI workspace showing Generate personal token, the Query and Modeling service choices, and Streamable HTTP connection settings")}<figcaption>Generate a token as the member whose permissions the client should inherit.</figcaption></figure>`],
        ["connect", "Register GraphLake in your client", ({ code }) => `
<ol>
  <li>In <strong>AI → Add to agent</strong>, select <strong>Query MCP</strong> or <strong>Modeling MCP</strong> if both are available. Copy the <strong>MCP URL</strong>.</li>
  <li>In your client’s MCP settings, create a <strong>Streamable HTTP</strong> entry using that URL. Select <strong>Bearer Token</strong> or configure the <code>Authorization: Bearer &lt;token&gt;</code> header. Add a separate entry if the client needs both endpoints.</li>
  <li>For a JSON-based client, expand <strong>Use JSON configuration</strong> or adapt the example below. Use the public HTTPS origin configured on GraphLake for remote clients and replace the token placeholders in the client’s credential configuration.</li>
</ol>
${code("JSON", mcpConfig)}
<p>The same personal token can authenticate both endpoints. Tool access follows the owner’s current model actions and tenant scope on every request.</p>`],
        ["verify", "Verify the MCP connection", ({ image }) => `
<ol>
  <li>In the GraphLake <strong>AI</strong> workspace, select the service, open <strong>Verify connection</strong>, and click <strong>Test MCP connection</strong>. Paste your saved token if the page asks for it.</li>
  <li>Check the authenticated username and open <strong>View models and tools</strong>. Compare model IDs and available tools with the role you configured. Repeat for the other endpoint if you added both.</li>
  <li>In your client, reconnect or refresh the server’s tool list. Ask it to call <code>list_models</code> on that server. A successful result shows the models that identity can access. This independently verifies the client's URL, transport, credentials, and permissions.</li>
</ol>
<p>If the client reports <code>401</code>, check the Bearer header and whether the token was expired, replaced, or revoked. For <code>403</code>, check <strong>Allow MCP access</strong> and the role on the model. For <code>404</code>, verify the URL and that its service is enabled. In the client, confirm the transport is Streamable HTTP.</p>
<figure>${image("mcp-verify", "English AI connection test showing demo-analyst, one visible model, and three query tools")}<figcaption>Verify the user, visible models, and tools before using the client to query data or edit drafts.</figcaption></figure>`],
        ["use", "Run your first request", ({ code, ref }) => `
<p>On the query endpoint, ask the client to call <code>list_models</code>, then <code>get_schema</code> and <code>query</code> for a published model. With the transfer demo the following read-only query returns <code>3</code>.</p>
${code("Cypher", "MATCH (n:Account) RETURN count(n) AS accounts")}
<p>On the modeling endpoint, use <code>get_model</code> to confirm draft access. For a requested edit, read its revision, validate the changes, and review the saved draft before publication. The ${ref("docs/mcp.md", "MCP reference")} describes tool arguments, token rotation, and query limits.</p>`],
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
