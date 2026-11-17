import clients from "./clients-en.mjs";
import troubleshoot from "./troubleshooting-en.mjs";
import {
  components, downloadSample, followPath, outgoingCounts, pageRank, route,
  runSample, sampleCatalog, sampleWorkbench, transferTotals,
  twoHopTraversal,
} from "./handbook-examples.mjs";

export default {
  docs: {
    title: "Documentation",
    description: "Start with a sample graph, then connect your data, publish a model, and run queries from the console or an application.",
    sections: [
      ["start-here", "Try GraphLake", ({ link }) => `
<ul class="task-list">
  <li><strong>${link("first-model", "Build your first graph")}</strong> Run a known-result query on small CSV and JSON Lines files with the Linux CLI.</li>
  <li><strong>${link("quickstart", "Try the Parquet workbench demo")}</strong> Build from source and inspect the transfer graph in the browser.</li>
  <li><strong>${link("install", "Install the Linux service")}</strong> Verify the package, start the service, and sign in.</li>
</ul>`],
      ["model-and-query", "Build and query your own graph", ({ link }) => `
<ul class="task-list">
  <li><strong>${link("concepts", "Understand the graph model")}</strong> Learn how sources, keys, edges, and published revisions fit together.</li>
  <li><strong>${link("sources", "Connect your data")}</strong> Choose a connector, check fields, and decide whether to query directly or load a local copy.</li>
  <li><strong>${link("datasources", "Browse supported data sources")}</strong> Compare direct connectors, Trino routes, and object storage providers.</li>
  <li><strong>${link("local-tables", "Sync a local copy")}</strong> Configure full or incremental refresh and check the load history.</li>
  <li><strong>${link("model", "Model a graph in the console")}</strong> Follow the canvas walkthrough to map business keys and endpoints, then publish.</li>
  <li><strong>${link("query", "Use the query and graph workspace")}</strong> Set Cypher parameters, switch result views, and expand a node’s neighbors.</li>
  <li><strong>${link("query-recipes", "Run query recipes")}</strong> Follow paths in Cypher, summarize rows in SQL, and traverse in Gremlin.</li>
  <li><strong>${link("algorithms", "Run graph algorithms")}</strong> Compare paths, rank nodes, or identify connected groups.</li>
</ul>`],
      ["integrate-and-operate", "Connect applications and operate", ({ link }) => `
<ul class="task-list">
  <li><strong>${link("clients", "Connect an application")}</strong> Authenticate and run a downloadable HTTP, Bolt, or Gremlin example.</li>
  <li><strong>${link("access", "Configure access")}</strong> Grant the permissions an analyst, application, or AI client needs.</li>
  <li><strong>${link("mcp", "Connect an AI client")}</strong> Enable MCP services, issue a personal token, and verify the tools it can use.</li>
  <li><strong>${link("cluster", "Install a cluster")}</strong> Start Workers, then configure Coordinator failover and verify ingress.</li>
  <li><strong>${link("monitoring", "Monitor a deployment")}</strong> Check model, source, and Worker health and configure logs and telemetry.</li>
  <li><strong>${link("recovery", "Back up and recover")}</strong> Create a checkpoint, restore it at a target site, and verify the result before cutover.</li>
  <li><strong>${link("troubleshoot", "Troubleshoot an issue")}</strong> Diagnose connection, sync, query, Worker, and recovery failures.</li>
</ul>`],
    ],
  },
  concepts: {
    title: "Core concepts",
    description: "Understand what a graph model maps, what publishing changes, and which data a query reads.",
    sections: [
      ["sources", "Sources, tables, and models", ({ link }) => `
<p>A <strong>source</strong> is a connection or collection of files that GraphLake can read. A <strong>table</strong> is a named input within that source. A <strong>graph model</strong> maps rows from one or more tables into labels and relationships.</p>
<p>For example, an accounts table in PostgreSQL can define <code>Account</code> nodes while a Parquet transfer table defines <code>Transfer</code> edges. The relationship mapping uses account keys to connect those two inputs.</p>
<p>See ${link("sources", "Connect data")} for direct source access and ${link("local-tables", "Local tables")} for scheduled Parquet copies.</p>`],
      ["identity", "Keys, endpoints, and properties", ({ link }) => `
<dl class="plain-list">
  <dt>Node label</dt><dd>A named type such as <code>Account</code>. The business key identifies one node within that label.</dd>
  <dt>Relationship type</dt><dd>A directed link such as <code>Transfer</code>. Its source and destination columns map to the complete keys of the two endpoint nodes, in order.</dd>
  <dt>Property</dt><dd>A mapped column such as <code>amount</code> that you can display, filter, or aggregate. Distinct transfer IDs keep parallel transfers separate.</dd>
</dl>
<p>When account IDs repeat across tenants, use a composite key such as <code>[tenant_id, account_id]</code>. Both endpoint mappings must include the tenant column and use compatible types. Try this workflow in ${link("first-model", "your first graph")}.</p>`],
      ["versions", "Drafts, published revisions, and data freshness", ({ link }) => `
<p>A draft is the editable configuration. Publishing makes a validated revision available to clients. Queries use the published revision and report that revision alongside source versions. Rolling back a model switches its mapping and leaves source data under the source system’s control.</p>
<p>A local table uses the last successfully published copy. A CSR index represents the graph scope and source state captured at build time. If you need the latest records, check the local table and CSR freshness before choosing which data to query.</p>
<p>See ${link("model", "Model a graph")} for publishing and ${link("algorithms", "Graph algorithms")} for CSR selection.</p>`],
    ],
  },
  "first-model": {
    title: "Build your first graph",
    description: "Use the installed Linux CLI and two tiny files to map accounts and transfers, then check the result.",
    sections: [
      ["files", "1. Download the sample", ({ code, link, asset }) => `
<p>Finish ${link("install", "Linux installation")} first. The example uses three files in one directory. It does not need a database connection.</p>
<ul class="task-list">
  <li>${asset("examples/transfer/accounts.csv", "accounts.csv")} contains Alice, Bob, and Carol.</li>
  <li>${asset("examples/transfer/transfers.jsonl", "transfers.jsonl")} contains two directed transfers.</li>
  <li>${asset("examples/transfer/graph.yaml", "graph.yaml")} maps the files to one node label and one relationship type.</li>
</ul>
${code("Shell", downloadSample)}`],
      ["mapping", "2. Read the mapping", ({ code }) => `
<p><code>files</code> resolves relative to <code>graph.yaml</code>. The file schemas assign <code>Int64</code> to keys and endpoints and <code>Decimal128(18, 2)</code> to amounts. The CSV columns follow the header order.</p>
<details class="example-details"><summary>View the complete graph.yaml</summary>
${code("YAML", sampleCatalog)}
</details>
<p><code>src</code> and <code>dst</code> both point to <code>Account.id</code>. The transfer’s own <code>id</code> identifies the edge. Multiple rows can connect the same accounts when their transfer IDs differ.</p>`],
      ["verify", "3. Verify a known result", ({ code, link }) => `
<p>From the sample directory, run a query for account <code>1</code>. Pass the account ID as a parameter so you can reuse the query for other accounts.</p>
${code("Shell", runSample)}
<p class="note"><strong>Expected result</strong> Alice sent Bob <code>12.25</code>. Change <code>account_id</code> to <code>3</code> to confirm Carol has no outgoing transfer.</p>
<p>Once this succeeds, use ${link("query-recipes", "query recipes")} on the same files.</p>`],
      ["publish", "4. Bring the model into the console", ({ code, link }) => `
<p>From the same shell, use the sample directory as a separate catalog. Initialize its administrator password once, then start the packaged console on port <code>7347</code>.</p>
${code("Shell", sampleWorkbench)}
<ol>
  <li>Open <a href="http://127.0.0.1:7347/">http://127.0.0.1:7347</a> and sign in as <code>admin</code>. If the service is on another machine, forward port <code>7347</code> over SSH.</li>
  <li>In <strong>Graph Models</strong>, verify that <code>graph</code> is published. Open <strong>Query</strong>, paste the earlier Cypher, and supply <code>{"account_id":1}</code> in <strong>Query options</strong>.</li>
</ol>
<p>Continue with ${link("model", "the canvas walkthrough")} to build the same mapping yourself, or ${link("sources", "connect your own data")}. Check key types and sample rows before you publish a mapping over production data.</p>`],
    ],
  },
  "query-recipes": {
    title: "Query recipes",
    description: "Run small examples with known results in Cypher, SQL, and Gremlin. All examples use the same transfer model.",
    sections: [
      ["setup", "Prepare the example", ({ link }) => `
<p>Use the CSV and JSON Lines sample from ${link("first-model", "Build your first graph")}. Run these snippets in the published model’s <strong>Query</strong> workspace. For CLI runs, choose the dialect with <code>--language</code> and set Cypher values with <code>--parameters</code>.</p>
<p>For Cypher snippets that use <code>$account_id</code>, enter <code>{"account_id":1}</code> in <strong>Query options</strong>.</p>`],
      ["paths", "Follow two transfers in Cypher", ({ code }) => `
<p>Bind a starting account and return a named path. The graph view can draw the path and show the properties of each hop.</p>
${code("Cypher", followPath)}
<p class="note"><strong>Expected result</strong> Alice → Bob → Carol, with two transfer edges.</p>`],
      ["counts", "Keep accounts with zero transfers", ({ code }) => `
<p>Use <code>OPTIONAL MATCH</code> to keep the account when it has no outgoing edge. Count the relationship variable to exclude the empty match.</p>
${code("Cypher", outgoingCounts)}
<p class="note"><strong>Expected result</strong> Alice has 1, Bob has 1, and Carol has 0.</p>`],
      ["sql", "Aggregate the mapped edges in SQL", ({ code }) => `
<p>Choose SQL and query the mapped relationship type. Double quotes preserve the mixed-case graph table name.</p>
${code("SQL", transferTotals)}
<p class="note"><strong>Expected result</strong> 2 transfers, with a total amount of <code>37.75</code>.</p>`],
      ["gremlin", "Traverse outgoing edges in Gremlin", ({ code, link }) => `
<p>Choose Gremlin, start from the complete business key <code>1</code>, and take two outgoing <code>Transfer</code> steps.</p>
${code("Gremlin", twoHopTraversal)}
<p class="note"><strong>Expected result</strong> Carol.</p>
<p>For the next step, see ${link("query", "Query and explore")} for result views, pagination, and Arrow export.</p>`],
    ],
  },
  algorithms: {
    title: "Graph algorithms",
    description: "Choose a graph projection, run an algorithm on the sample, and interpret its result and resource use.",
    sections: [
      ["choose", "Choose an algorithm and graph scope", ({ link }) => `
<dl class="plain-list">
  <dt>Shortest path</dt><dd>Find a low-cost route between known endpoints. Decide whether cost means hops or a mapped numeric edge property.</dd>
  <dt>PageRank</dt><dd>Rank nodes in a directed graph based on incoming relationships and how their sources distribute rank.</dd>
  <dt>Weakly connected components</dt><dd>Group nodes connected by any route when edge direction is ignored.</dd>
  <dt>Communities and embeddings</dt><dd>Use Louvain or Leiden to group a projected graph, and Node2Vec to produce vector features.</dd>
</dl>
<p>Choose edge types, direction, and weights before running the algorithm. If you use a weight, all selected edge types must expose that field with supported numeric values. The examples below use the ${link("first-model", "three-account sample")}.</p>`],
      ["rank", "Rank accounts with PageRank", ({ code }) => `
${code("Cypher", pageRank)}
<p>Expect a score for each of the three accounts. Sort by rank to compare nodes within the same projection. Changing edge selection or direction changes the graph being ranked.</p>`],
      ["components", "Find connected groups", ({ code }) => `
${code("Cypher", components)}
<p>Alice, Bob, and Carol share one component. Comparing component IDs tells you whether nodes lie in the same group. A common component does not, by itself, specify a directed route.</p>`],
      ["route", "Find a weighted route", ({ code }) => `
<p>Run the CLI command in the sample directory. This treats the transfer amount as an illustrative numeric cost.</p>
${code("Shell", route)}
<p class="note"><strong>Expected result</strong> A two-hop route from account <code>1</code> to <code>3</code>, with exact cost <code>37.75</code>.</p>`],
      ["csr", "Choose live data or a CSR generation", ({ link, ref }) => `
<p>For repeated graph traversals, an administrator or publisher can build a CSR generation, which is a compressed adjacency snapshot of a published model. In <strong>Query options</strong>, choose an available generation only if its source state and graph scope match the question. Rebuild after changing mapped data or scope when the result needs the new state.</p>
<p>In a ${link("cluster", "cluster")}, supported PageRank and component workloads can use partitioned CSR. Community detection and Node2Vec work on a whole projection on the execution node. Check available operations, memory budgets, and weighting rules in the ${ref("docs/reference.zh-CN.md#整图算法", "algorithm reference")}.</p>`],
    ],
  },
  clients,
  access: {
    title: "Users and permissions",
    description: "Set up people, application service accounts, and AI clients with permissions on the models they need.",
    sections: [
      ["identities", "Choose an identity for the client", ({ link }) => `
<dl class="plain-list">
  <dt>Member</dt><dd>Use a person’s own account for console work. Console and MCP access can be managed separately.</dd>
  <dt>Service account</dt><dd>Give each application its own token and model role. Use the username <code>svc/&lt;name&gt;</code> for ${link("clients", "HTTP, Bolt, and Gremlin clients")}.</dd>
  <dt>Personal MCP token</dt><dd>Use the owner’s model permissions and tenant scope for ${link("mcp", "authorized AI work")}.</dd>
</dl>`],
      ["roles", "Assign model permissions to a user", ({ image, link }) => `
<ol>
  <li>Sign in as an administrator. In <strong>Access Control → Members</strong>, choose <strong>New member</strong> for a new user or <strong>Edit</strong> for an existing one. Select <strong>User account</strong>, enter the username and initial password for a new user, and set <strong>Allow console sign-in</strong> and <strong>Allow MCP access</strong> for the entry points they need. Select <strong>Save member</strong>.</li>
  <li>Switch to <strong>Roles → New role</strong>, or edit an existing role. Give the role a name and tick the user under <strong>Role members</strong>.</li>
  <li>Under <strong>Permissions by model</strong>, find the target model by its ID and tick the actions the user needs. In the screenshot the member <code>demo-analyst</code> gets <strong>Query</strong> and <strong>Modeling</strong> on <code>transfer-demo</code>. Select <strong>Save role</strong>.</li>
  <li>Check the model and member in the roles list. Then sign in as the member and run a small query in ${link("query", "Query")}. With MCP enabled, open <strong>AI → My permissions</strong> and compare the listed models and capabilities with the saved role. After a role change, affected console users need to sign in again.</li>
</ol>
<figure>${image("access-model-role", "English New role dialog showing demo-analyst assigned Query and Modeling on the transfer-demo model")}<figcaption>Assign the member and the permissions on the intended model in the same role.</figcaption></figure>`],
      ["actions", "Choose model actions", ({ link }) => `
<dl class="plain-list">
  <dt>Query and Export</dt><dd>Query allows schema inspection, read-only queries, and graph exploration. Full Arrow export requires both Query and Export on the same model.</dd>
  <dt>Modeling and Publish</dt><dd>Modeling allows draft edits and validation within approved sources and tables. Publish allows activation, rollback, and taking a model offline. Administrators manage data connections and which physical tables can be used.</dd>
  <dt>Read-only audit</dt><dd>Inspect configuration and version history.</dd>
</dl>
<p>For a user who needs to create a model through MCP, add its future ID under <strong>Preauthorize a new model ID</strong> and grant Modeling on both that ID and an existing template model. See ${link("mcp", "the MCP guide")} for how those grants affect tool discovery.</p>`],
      ["tenants", "Constrain rows by tenant", () => `
<p>Under a model’s Query permission, expand <strong>Restrict tenant scope</strong>. Set the tenant column to <code>tenant_id</code> and its JSON value to <code>1</code>, for example, then save the role. Map that column into all relevant node and edge business keys and both relationship endpoints, with compatible types. GraphLake enforces the scope on supported client queries, exploration, and exports.</p>
<p>Conflicting tenant values on the same model are rejected. To segregate sensitive columns, use database views or a separate model projection. Shared CSR generations are available for unscoped queries.</p>`],
      ["rotate", "Rotate credentials and verify", ({ ref }) => `
<p>Rotate an application’s token in its service-account settings. Put the new token in the client’s secret store, reconnect, and verify the old token no longer grants access. Role changes can invalidate existing sessions, connections, and download tickets.</p>
<p>See the ${ref("deploy/README.md#用户与角色", "access control reference")} for legacy service-account files, enterprise login, and audit handling.</p>`],
    ],
  },
  troubleshoot,
};
