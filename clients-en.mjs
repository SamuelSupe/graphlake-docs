import { boltRun, clientEnvironment, clientScript, clientVenv, clientWorkbench, downloadSample, gremlinRun } from "./handbook-examples.mjs";

export default {
  title: "Developer integration",
  description: "Authenticate a service account and run the same read-only query against a published GraphLake model using HTTP, Bolt, or Gremlin.",
  sections: [
    ["prepare", "Prepare a published model", ({ code, image, link }) => `
<p>Use GraphLake v1.1.8 and Python 3.11 or later. If you already have a published transfer sample with model ID <code>graph</code>, use it and check the listeners below. To start from scratch, install the ${link("install", "GraphLake package")}, copy the sample into a fresh directory, then initialize the admin password and start the service.</p>
${code("Shell", downloadSample)}
${code("Shell", clientWorkbench)}
<p>Open <code>http://127.0.0.1:7347</code>, sign in as <code>admin</code>, and check <strong>Graph Models</strong>. The sample is displayed as <strong>text-files</strong> and its model ID is <code>graph</code>. Verify <strong>Published</strong> before connecting. For a new model built in the console, publish the draft (preview and confirm if business validation is required) and use its ID in the examples.</p>
<figure>${image("clients-published-model", "English Graph Models directory showing text-files with model ID graph and Published status")}<figcaption>Use the model ID under the display name. The example model is visible to clients after publication and a matching query grant.</figcaption></figure>
<p>HTTP is available on the console listener. <code>--driver-model graph</code> enables Gremlin and sets the default driver model. <code>--bolt-port 7687</code> enables the separate Bolt listener. For an existing install, add the required flags to the service launch command and restart it.</p>`],
    ["auth", "Create a service account and grant Query", ({ code, image, link }) => `
<ol>
  <li>Generate a dedicated token with <code>openssl rand -hex 32</code> and keep it in the application's secret store. In <strong>Access Control → Members → New member</strong>, select <strong>Service account</strong>. Enter <code>analytics</code> as the <strong>Service account name</strong>, enter the token in <strong>Initial token</strong> and <strong>Confirm token</strong>. Clear <strong>Allow MCP access</strong> for this driver-only account, then select <strong>Save member</strong>.</li>
  <li>Open <strong>Roles → New role</strong> and name it <code>analytics-reader</code>. Add <code>svc/analytics</code> to the role and check <strong>Query</strong> on model <code>graph</code> under <strong>Permissions by model</strong>. Save the role. In <strong>Members</strong>, confirm the account is <strong>Enabled</strong> with <strong>Drivers / API</strong> access and that role assigned.</li>
  <li>In a second terminal, set these values and enter the same token at the hidden prompt. The three examples share the same service account and read permissions. For your own model, set <code>GRAPHLAKE_MODEL</code> to its ID and adapt the query and expected result.</li>
</ol>
<figure>${image("clients-service-account", "English Access Control Members tab showing svc/analytics enabled with Drivers / API access and analytics-reader assigned")}<figcaption>Confirm the member’s client username and role before testing the connection.</figcaption></figure>
${code("Shell", clientEnvironment)}
<p>Use these loopback URLs on the service host or over SSH forwarding. In production, set the client variables to your <code>https://</code> origin, direct <code>bolt+s://</code> listener, and <code>wss://</code> URL ending in <code>/gremlin</code>. The HTTPS proxy preserves <code>Host</code> and <code>Origin</code>, forwards WebSocket upgrades, and matches the service’s <code>--public-url</code>. See ${link("deploy", "deployment and HTTPS")} and ${link("access", "model permissions")}.</p>
<p>If you use Bolt or Gremlin, create and activate a virtual environment before installing the driver. The HTTP example only needs the Python standard library.</p>
${code("Shell", clientVenv)}`],
    ["http", "HTTP API", ({ asset, code }) => `
<p>Authenticate with <strong>HTTP Basic</strong> using <code>svc/analytics</code> and its token. <code>GET /api/v1/models</code> lists the published models visible to that account. Read the model’s <code>active_revision</code>, then send it as <code>model_revision</code> to <code>POST /api/v1/models/{id}/query</code>, with a new UUID as <code>request_id</code>. The script sends Cypher parameters as a JSON-encoded string in <code>parameters_json</code>.</p>
<p>${asset("examples/clients/http_query.py", "Download http_query.py")}</p>
${code("Python", clientScript("http_query.py"))}
${code("Shell", "python3 http_query.py")}
<p><strong>Verify</strong> The script checks that the preview has exactly one row, <code>[["Alice"]]</code>, is complete, and matches the requested revision. It prints <code>['Alice']</code> and the verified revision. HTTP preview cells are strings or null. A complete export requires the model’s separate <strong>Export</strong> permission.</p>`],
    ["bolt", "Bolt", ({ asset, code }) => `
<p>Use a direct <code>bolt://</code> connection for the loopback demo and <code>bolt+s://</code> for a remote TLS listener. Pass the same service username and token to the Neo4j driver, then set <code>session(database="graph")</code> to choose the published model. This example uses a read-only auto-commit query, which works with the CSV sample.</p>
<p>${asset("examples/clients/bolt_query.py", "Download bolt_query.py")}</p>
${code("Python", clientScript("bolt_query.py"))}
${code("Shell", boltRun)}
<p><strong>Verify</strong> Expect <code>['Alice']</code>. Consuming the result verifies that the client reached the Bolt listener, authenticated, selected the database, and could read the mapped data. GraphLake supports direct Bolt 5.1–5.4 connections.</p>`],
    ["gremlin", "Gremlin WebSocket", ({ asset, code }) => `
<p>Connect to <code>/gremlin</code> with the same service username and token over SASL PLAIN. Pass <code>graph</code> as the traversal source to select that model explicitly. GraphLake maps the alias <code>g</code> to the default model. The example uses GraphSON 3 and a read-only bytecode traversal.</p>
<p>${asset("examples/clients/gremlin_query.py", "Download gremlin_query.py")}</p>
${code("Python", clientScript("gremlin_query.py"))}
${code("Shell", gremlinRun)}
<p><strong>Verify</strong> Expect <code>['Alice']</code>. The traversal proves that the WebSocket upgrade, authentication, traversal-source alias, and model read succeeded.</p>`],
    ["errors", "Diagnose connection and query failures", ({ link, ref }) => `
<dl class="plain-list">
  <dt>Authentication fails</dt><dd>Check the <code>svc/</code> prefix, token, and enabled state. Open a fresh connection after a token or role change.</dd>
  <dt>Model is missing or forbidden</dt><dd>Confirm it is published, use its ID, and check the account’s role, Query grant, and tenant scope. Test model discovery with the same service account.</dd>
  <dt>HTTP revision changed</dt><dd>For <code>active_revision_changed</code>, fetch <code>/api/v1/models</code> again. After confirming the new revision is acceptable, submit the read with that revision and a fresh request ID.</dd>
  <dt>Bolt or Gremlin refuses the connection</dt><dd>Check the configured listener, protocol scheme, and TLS trust. For Gremlin, confirm the proxy upgrades the WebSocket on <code>/gremlin</code>. Try the same known-result query through the deployment endpoint.</dd>
</dl>
<p>See ${ref("deploy/README.md#客户端接入", "the protocol reference")} for supported driver features and ${link("troubleshoot", "Troubleshooting")} for service and source errors.</p>`],
  ],
};
