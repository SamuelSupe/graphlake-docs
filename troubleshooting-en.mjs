export default {
  title: "Troubleshooting",
  description: "Find the error in the console or service logs, fix the failing component, and confirm recovery with the same workload.",
  sections: [
    ["logs", "Find the error and the right log", ({ code, link }) => `
<p>Start with the exact error, time and time zone, model and published revision, and any run, job, or checkpoint ID shown in the UI. Reproduce from the endpoint and account that saw the problem. Use these details to narrow the time range in the logs for the component involved.</p>
<dl class="plain-list">
  <dt><a href="#source">Data source connection failed</a></dt><dd>Data Sources and the published model’s Health Checks.</dd>
  <dt><a href="#sync">Local table sync failed</a></dt><dd>Local tables and sync → Load history, then the active Coordinator or standalone service log.</dd>
  <dt><a href="#query">Query failed</a></dt><dd>The Query workspace or client response, then Coordinator and execution Worker logs.</dd>
  <dt><a href="#worker">Worker offline</a></dt><dd>Model health Worker details, then that Worker’s log and private network route.</dd>
  <dt><a href="#backup-restore">Backup or recovery failed</a></dt><dd>Backup and Recovery, the backup job journal, and Restore progress on the target site.</dd>
</dl>
<p>For the packaged systemd service and scheduled backup job, run the relevant command on the host that owns the process. Use your deployed unit name for a Coordinator or Worker. For a foreground process, read its stdout and stderr. If you enabled log export, search the Collector’s downstream log store by service instance and time.</p>
${code("Shell", "sudo journalctl -u graphlake.service --since '30 minutes ago' --no-pager\nsudo journalctl -u graphlake-backup.service --since '30 minutes ago' --no-pager")}
<p>Keep passwords, tokens, connection strings, and customer records out of shared diagnostics. See ${link("monitoring", "Monitoring and telemetry")} for probe and log configuration.</p>`],
    ["source", "Data source connection failed", ({ image, link }) => `
<ol>
  <li><strong>Find the failing source.</strong> In <strong>Data Sources</strong>, select the model and open <strong>Browse tables and columns</strong> on its source card. Note whether the error occurs while listing tables or opening a specific table. For the published model, open <strong>Runtime Settings → Health Checks → Model health</strong>, select <strong>Check</strong>, and expand the details. Compare the published source status with the draft connection you are editing.</li>
  <li><strong>Fix the reported dependency.</strong> For network or TLS errors, check the host, port, DNS, firewall, CA trust, and certificate name from the GraphLake service host. For authentication, check the DSN environment variable in the service process and the account’s read grants for the right schema and table. For file or object sources, check the path, mount, bucket or prefix, and read permissions under the service identity. Repeat the relevant checks on any Worker that reports the source as unavailable.</li>
  <li><strong>Verify the repair.</strong> Browse the expected table and columns. If you edited connection settings in the draft, save, validate, and publish the corrected mapping for clients to use it. Run <strong>Check</strong> again and verify the published source is available. Run a query against that source with a known row or count.</li>
</ol>
<figure>${image("trouble-source", "English Model health panel showing Source unavailable for people and one of two data sources available")}<figcaption>Expand the published model’s health result to see which source failed and which Workers report it.</figcaption></figure>
<p>See ${link("sources", "Connect and browse sources")} and the ${link("datasources", "data source catalog")} for connector-specific settings.</p>`],
    ["sync", "Local table sync failed", ({ image, link }) => `
<ol>
  <li><strong>Read the individual run.</strong> Open <strong>Data Sources → Local tables and sync</strong>, select the model, and find the table. Open <strong>Load history</strong> and record the failed or interrupted run’s time, mode, trigger, and error. Check the active service log for that time. If a previous snapshot was committed, the model can still serve that older copy.</li>
  <li><strong>Fix the cause before retrying.</strong> For a missing table or column, browse the upstream source and compare the selection with the sync definition. For incremental failures, check for null or duplicate keys, null or incompatible watermarks, and the source changes since the last successful run. For storage errors, check writable space and permissions for the catalog or the managed object-storage configuration. After a process interruption, check that the previous run has reached a terminal state. Keep the last committed copy while investigating.</li>
  <li><strong>Retry and verify freshness.</strong> Use <strong>Load copy</strong> for the first successful load or <strong>Sync now</strong> for the configured refresh method. If records were deleted at the source, or corrected outside the lookback window, use <strong>More actions → Run full load</strong> to reconcile. Confirm the latest run succeeded, compare <strong>Total after commit</strong> and affected keys with the source, then check those keys through a model that maps the local copy. For a scheduled table, confirm its next refresh is shown.</li>
</ol>
<figure>${image("trouble-sync", "English Load history showing a failed sync for accounts_local above earlier successful runs")}<figcaption>The latest failure and earlier successful runs are visible together in <strong>Load history</strong>.</figcaption></figure>
<p>To change the selected columns, source, primary key, or watermark, use the creation workflow in ${link("local-tables", "Local tables and sync")}.</p>`],
    ["query", "Query returned an error", ({ image, link }) => `
<ol>
  <li><strong>Capture the error.</strong> In <strong>Query</strong>, record the message shown in the workspace, the selected model, dialect, and input parameters. For API clients, also record the HTTP status and error code. For a successful comparison run, use <strong>Execution details</strong> to check the revision and source versions. Match the failure time to Coordinator and execution Worker logs if the request reached the service.</li>
  <li><strong>Fix the reported condition.</strong> For syntax or unsupported operations, check the selected dialect and simplify to a read-only statement. For a missing Cypher parameter, open <strong>Query options</strong> and supply a valid JSON object with the exact name and expected type. For authorization, check the affected identity’s model-level Query permission and tenant scope. For <code>active_revision_changed</code>, reload the published revision and rerun. For <code>503 source_unavailable</code> or <code>worker_unavailable</code>, follow the <a href="#source">source</a> or <a href="#worker">Worker</a> checks.</li>
  <li><strong>Verify with the same inputs.</strong> Run a small query on one known key first, then rerun the original query with the intended account and parameters. Compare the expected values and row count in <strong>Table</strong>. Check the active revision and source versions for the successful execution.</li>
</ol>
<p>For timeouts, narrow the filter, bound the hop count, and use <code>EXPLAIN</code> before changing budgets. For empty results, also check direction, tenant and time filters. If a result preview is truncated or a neighbor session expires, see ${link("query", "Query and explore")} for paging, replay, and export. Use the ${link("query-recipes", "query recipes")} as a known-result baseline.</p>
<figure>${image("trouble-query", "English Query workbench displaying a missing Cypher parameter error for account_id")}<figcaption>The statement refers to <code>$account_id</code>. Enter the corresponding key in <strong>Query options</strong> and rerun.</figcaption></figure>`],
    ["worker", "A Worker is offline", ({ image, link }) => `
<ol>
  <li><strong>Identify the Worker.</strong> Open <strong>Runtime Settings → Health Checks → Model health</strong>, check a published model, and expand the source and Worker details. Note the Worker address and failure. <strong>Connection failed</strong> points to its process or private route. A Worker that reports a particular source unavailable needs a source access check on that node.</li>
  <li><strong>Check the node and route.</strong> Check the Worker’s actual service unit, startup log, and listen port. From the Coordinator, check the configured address, private proxy, mTLS trust and client identity. Compare cluster name, token binding, version, etcd and shared storage access, and the Worker’s source directory. Keep internal Worker endpoints on the private network. Restart only the affected process after correcting its configuration.</li>
  <li><strong>Verify the exact Worker is back.</strong> Run the model check again and confirm that address is healthy and the expected Worker count has recovered. Run a known-result HTTP query through the real client ingress. A query can succeed on another Worker while the original one remains offline.</li>
</ol>
<figure>${image("trouble-worker", "English Model health panel with two available sources, one healthy Worker out of two, and Connection failed on the second Worker")}<figcaption>The sources are available. The second Worker’s private endpoint failed the check.</figcaption></figure>
<p>See ${link("cluster", "Cluster installation")} for the Worker startup flags and private status probes.</p>`],
    ["backup-restore", "Backup or recovery failed", ({ image, link }) => `
<ol>
  <li><strong>Locate the failing stage.</strong> On the active HA Coordinator, open <strong>Runtime Settings → Backup and Recovery → Refresh backup status</strong>. Compare the latest attempt, last success, and checkpoint time under <strong>Scheduled backup</strong> and <strong>Offsite copy verification</strong>. Check the backup host’s timer and <code>graphlake-backup.service</code> journal for scheduled export failures, or the active Coordinator log for a failed manual backup. An unreadable status also warrants checking <code>GRAPHLAKE_BACKUP_STATUS_DIR</code> and file permissions.</li>
  <li><strong>Repair export or the offsite copy.</strong> Check free space, the private writable manual backup directory, and the exporter’s etcd and object-store access. Keep the last verified checkpoint. If offsite verification fails, recopy the control archive and its companion local-table artifacts together. Run <code>graphlake-admin backup verify --file control.json</code> on the replica and check the manifest’s external file hashes separately.</li>
  <li><strong>On the target, check import progress.</strong> Open its HTTPS <code>/recovery</code> page, enter the target recovery token, and select <strong>Read status</strong>. If no checkpoint appears, check the target inbox path, read permissions, and checkpoint layout. Use <strong>Check recovery point</strong> to catch a missing archive or mismatched manifest. If import fails, read the failed phase in <strong>Restore progress</strong> and the target Coordinator log. Check the writable restore mounts, exact Parquet hashes, and when applicable the target PostgreSQL DSN, compatible restore tools, and database state.</li>
  <li><strong>Retry and validate before cutover.</strong> Once writing has started, fix the dependency and retry the same checkpoint. Use a fresh target namespace for a different checkpoint or a corrected manifest. After import, run <strong>Verify recovery manifest</strong> and <strong>Verify recovery</strong>. If verification reports mismatched query rows, compare the restored data, active revision, and expected values in the manifest. Wait for <strong>Ready for cutover</strong>, check <code>/readyz</code> through the real HTTPS ingress, then rerun a known-result query with the intended client identity.</li>
</ol>
<figure>${image("trouble-recovery", "English GraphLake target recovery console showing the recovery checkpoint check and a verification error")}<figcaption>For recovery-point check errors, verify the files in the target inbox before starting the import.</figcaption></figure>
<p>For the complete HA checkpoint layout and the standalone catalog procedure, see ${link("recovery", "Back up and recover")}.</p>`],
    ["startup", "The console does not open", ({ link }) => `
<ol>
  <li>On the server, check <code>systemctl status graphlake</code> and the <a href="#logs">service journal</a>.</li>
  <li>Check <code>/healthz</code> for the running build and <code>/readyz</code> for readiness. If the service is ready locally, check SSH forwarding or the reverse proxy on the client path.</li>
  <li>For HTTPS, confirm the real origin matches <code>--public-url</code> and the proxy preserves <code>Host</code> and <code>Origin</code>. Verify both probes and console login through the real client URL.</li>
</ol>
<p>See ${link("monitoring", "Monitoring and telemetry")} for cluster and ingress probes.</p>`],
    ["model", "A model is missing or cannot be published", ({ link }) => `
<p>Check the published revision and the user’s role if a model is missing. If publication fails, run <strong>Validate schema</strong> and <strong>Validate data</strong>. Compare the columns, business key types, tenant columns, and component order at both relationship endpoints. For a revision conflict, reload the current draft and review the changes before saving or publishing.</p>
<p>After publishing, verify access and run a known-result query under the affected account. Use ${link("first-model", "the sample")} for a known-good baseline.</p>`],
    ["freshness", "The local copy or CSR is stale", ({ link }) => `
<p>Check the last successful load, watermark, and whether the published model reads the local copy. Apply the <a href="#sync">sync checks</a> for an old or failed load. If a CSR generation is older than the required data, rebuild it or use the appropriate live model. Rerun a known-result query against the repaired revision or generation.</p>
<p>See ${link("local-tables", "Local tables and sync")} and ${link("algorithms", "Graph algorithms")}.</p>`],
  ],
};
