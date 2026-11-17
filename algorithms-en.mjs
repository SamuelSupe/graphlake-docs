import { components, csrRefreshDemo, csrSample, pageRank, route, shortestPath } from "./handbook-examples.mjs";

export default {
  title: "Graph algorithms and CSR",
  description: "Build a partitioned graph snapshot, check which generation is published, and verify shortest path, PageRank, and weakly connected components on a four-account graph.",
  sections: [
    ["choose", "Prepare the sample graph", ({ code, link }) => `
<p>Shortest path finds a route with the fewest hops. PageRank scores vertices from directed links. Weakly connected components (WCC) group vertices while ignoring edge direction. Try them on three linked accounts and one isolated account.</p>
<p>Download the ${link("first-model", "transfer sample")} to a new directory and add Dana as account <code>4</code>. The two transfers are Alice → Bob → Carol. Use these same files for both the live and CSR examples.</p>
${code("Shell", csrSample)}
<p>For live Cypher queries, use a standalone workbench or a cluster with the sample model published. For partitioned CSR, follow ${link("cluster", "Install a cluster")} with GraphLake v1.1.1, an etcd gateway, shared storage, and Workers. Use the sample cluster configuration with <code>distributed_partitions: 4</code>. Before starting a fresh demo cluster, place the three files in its catalog directory and make them readable by the Coordinator and Workers. In <strong>Graph Models</strong>, confirm the model ID is <code>graph</code> and its status is <strong>Published</strong>.</p>
<p>CSR (compressed sparse row) stores a graph's adjacency in a published generation. GraphLake also captures the graph scope, source versions, and the model revision used to build it. A snapshot stays fixed until you publish a new generation.</p>`],
    ["build", "Create a CSR generation", ({ asset, code }) => `
<p>${asset("examples/algorithms/csr_demo.py", "Download csr_demo.py")} and run it with Python 3. The script asks for the built-in <code>admin</code> password without echoing it. It signs in with an HTTP session and sends the same-origin <code>Origin</code> header. Use <code>GRAPHLAKE_ORIGIN</code> for your actual HTTPS endpoint or forwarded loopback URL and <code>GRAPHLAKE_MODEL</code> for the published model ID. Defaults are <code>http://127.0.0.1:7337</code> and <code>graph</code>.</p>
${code("Shell", "python3 csr_demo.py build")}
<ol>
  <li>The script reads <code>active_revision</code> from <code>GET /api/v1/models</code> and posts it as <code>model_revision</code> to <code>POST /api/v1/models/graph/csr</code>. The same endpoint creates the first generation and refreshes an existing one. Use an administrator or a signed-in member with Publish permission for that model.</li>
  <li>On success, the response includes the <code>generation</code>, captured <code>model_revision</code> and <code>sources</code>, build time, and counts. For the sample, expect <strong>4 vertices and 2 edges</strong>. A successful build publishes the new generation automatically.</li>
</ol>
<p>The demo uses the model's default graph scope. When refreshing a snapshot built with a specific logical partition or historical time, include the intended <code>graph_options</code> in the API request. The example uses a 60-second build timeout. For larger graphs the API accepts up to <code>600000</code> milliseconds.</p>`],
    ["status", "Check build status and the generation in use", ({ code, image, link }) => `
${code("Shell", "python3 csr_demo.py status")}
<dl class="plain-list">
  <dt>Build attempt</dt><dd><code>GET /api/v1/models/{id}/freshness</code> shows <code>refresh.status</code> as <code>building</code>, <code>succeeded</code>, or <code>failed</code>, and provides <code>refresh.error</code> on failure. <code>refresh</code> can be empty if the current process has no recorded attempt. <code>csr: null</code> means the active revision has no published generation.</dd>
  <dt>Published snapshot</dt><dd><code>GET /api/v1/models/{id}/csr</code> shows the current generation, build time, counts, graph scope, and source versions. A failed build can leave the earlier generation published. Read both endpoints to tell the two states apart.</dd>
  <dt>Console health</dt><dd>Open <strong>Runtime Settings → Health Checks → Model health</strong> and select <strong>Check</strong> for the model. When CSR is configured or present, the console can show a refresh message and build time. <strong>CSR matches the current local copy</strong> concerns local-table freshness. For external CSV, JSON Lines, or database sources, compare the build time and recorded source versions after source changes.</dd>
  <dt>Executed query</dt><dd>In <strong>Query</strong>, select Cypher and use <strong>Query options → Use published CSR</strong>. After running the query, expand <strong>Execution details</strong> and compare <strong>CSR version</strong> with the current generation ID. To run on live data, use <strong>Switch to live sources</strong>.</dd>
</dl>
<figure>${image("csr-model-health", "English Health Checks panel showing a healthy model and its CSR build timestamp")}<figcaption>The model health check displays freshness information and the build timestamp for the published CSR.</figcaption></figure>
<p>If a build fails, inspect the Coordinator log at the attempt time, check source access, shared storage and available memory, then retry. See ${link("monitoring", "health checks and logs")}.</p>`],
    ["route", "Find a shortest path", ({ code, image }) => `
<p>Find the directed path from Alice (<code>1</code>) to Carol (<code>3</code>), with at most four <code>Transfer</code> hops. The runnable CSR example queries by label and business key.</p>
${code("Shell", "python3 csr_demo.py shortest")}
<p><strong>Verify</strong> Expect <code>hops: 2</code>, account IDs <code>1 → 2 → 3</code>, and transfer IDs <code>10, 11</code>. The search minimizes hops. In the console, select <strong>Use published CSR</strong> to run the Cypher below on the snapshot, or use live sources to compare the result.</p>
${code("Cypher", shortestPath)}
<p>Use <strong>Table</strong> to check <code>[Alice, Bob, Carol]</code> and <code>2</code>. Use <strong>Graph</strong> to inspect the two transfers.</p>
<figure>${image("csr-shortest-result", "English Query workspace showing Alice, Bob, Carol, two hops and the executed CSR version")}<figcaption>The shortest-path table and Execution details show the route and the generation actually queried.</figcaption></figure>
<details class="example-details"><summary>Find a route by transfer amount with the CLI</summary>
<p>Run this command from the sample directory for a weighted route. The path costs <code>37.75</code>. <code>shortestPath()</code> uses the number of hops, while this command uses the mapped amount.</p>
${code("Shell", route)}
</details>`],
    ["rank", "Run PageRank", ({ code }) => `
<p>Score all four accounts on outgoing transfers. The CSR example uses damping <code>0.85</code>, tolerance <code>1e-8</code>, and up to 100 iterations.</p>
${code("Shell", "python3 csr_demo.py pagerank")}
<p><strong>Verify</strong> Account <code>3</code> (Carol) ranks first at about <code>0.400545</code>, and <code>2</code> (Bob) is second at <code>0.288050</code>. Alice and the isolated Dana tie at about <code>0.155703</code>. The scores sum to about 1 before rounding.</p>
<p>For a live-source comparison in <strong>Query</strong>, select <strong>Switch to live sources</strong> if a snapshot is selected, then run this Cypher.</p>
${code("Cypher", pageRank)}`],
    ["components", "Find weakly connected components", ({ code }) => `
<p>Group accounts that are connected by transfers in either direction. The CSR example uses undirected adjacency and up to 20 iterations.</p>
${code("Shell", "python3 csr_demo.py wcc")}
<p><strong>Verify</strong> Expect two components. The representative account with key <code>1</code> groups <code>1, 2, 3</code>. Dana is alone in the component with key <code>4</code>. The component ID identifies a group. Use shortest path to check directional reachability.</p>
<p>For a live comparison in the console, run the following Cypher with live sources selected.</p>
${code("Cypher", components)}`],
    ["csr", "Refresh and verify a changed graph", ({ code, link, ref }) => `
<ol>
  <li>Record the current generation ID and counts with <code>python3 csr_demo.py status</code>. For a refresh drill, append the transfer below once to the demo catalog’s <code>transfers.jsonl</code>. It connects Carol to Dana and leaves the model mapping unchanged.</li>
</ol>
${code("Shell", csrRefreshDemo)}
<ol start="2">
  <li>Run <code>python3 csr_demo.py build</code> again. Use <code>status</code> to confirm a new generation ID, an updated source version for <code>transfers.jsonl</code>, the same model revision, and <strong>4 vertices and 3 edges</strong>.</li>
  <li>Run <code>python3 csr_demo.py wcc</code>. All four accounts now form one component. The script pins the current generation in each algorithm request and checks that the response uses that generation. For a new console query, switch to live sources, select <strong>Use published CSR</strong> again, and compare the new <strong>CSR version</strong> in the result.</li>
</ol>
<p>Rebuild when your source data or needed graph scope changes. Rebuild for the new active revision after publishing an updated model. A query already accepted can finish on its original generation. For <code>409 csr_generation_conflict</code> on a new query, reread the published generation and run the check again.</p>
<p>For models backed by ${link("local-tables", "local tables")}, a published <code>freshness.auto_refresh_csr: true</code> can refresh CSR after committed local copies advance. External file and database changes in this example use the manual build flow. See the ${ref("deploy/cluster.md#分区图执行", "partitioned graph API reference")} for the full request format, and the ${ref("docs/reference.zh-CN.md#整图算法", "algorithm reference")} for additional operations.</p>`],
  ],
};
