import {
  clusterCheckpoint, colocatedUpgrade, handoffCoordinator, restoreClusterCheckpoint, rollbackCoordinator, rollbackWorker,
  standaloneBackup, standaloneRollback, standaloneUpgrade, upgradeCanary, upgradeCoordinator, upgradeInit, upgradeNodeBackup,
  upgradeStage, upgradeVerify, upgradeWorker, verifyRecoveryArchive,
} from "./upgrade-examples.mjs";

export default {
  title: "Upgrade and roll back",
  description: "Keep a restorable checkpoint, upgrade standalone or clustered GraphLake, and verify the same model and query before reopening traffic.",
  sections: [
    ["plan", "Plan the maintenance window", ({ asset, code, link }) => `
<p>The commands use Debian 12 with systemd, releases under <code>/opt/graphlake/releases/</code>, and an upgrade from <code>v1.1.6</code> to <code>v1.1.8</code>. Read the <a href="https://github.com/SamuelSupe/graphlake/releases/tag/v1.1.8">target release notes</a> and confirm the old version can read any state the maintenance window may write. For a different target release, change the archive name, download URL, and expected build together.</p>
<p>Before touching a production host, rehearse with a copy of a known dataset and verify that its checkpoint can be restored. Identify the Coordinator and Worker units, which units share <code>/opt/graphlake/current</code>, the actual client ingress, and which client protocols must pass acceptance. Use a Bash shell on each host and keep it open so later commands can reuse <code>target</code> and <code>checkpoint</code>.</p>
<p>${asset("examples/upgrade/graphlake-release.sh", "Download graphlake-release.sh")} using the commands below. The helper verifies archive integrity, extracts to a separate directory, and switches the symlink atomically while the specified units are stopped. Keep your existing unit files, startup flags, and drop-ins with this example. Review any unit changes a different release requires before restarting.</p>
${code("Shell", upgradeInit)}
<p>Run the download and staging step on every host. It selects the host's Linux architecture and verifies the published SHA-256 with the downloaded archive. Keep the original package, checksum, and old release directory until rollback has been rehearsed.</p>
${code("Shell", upgradeStage)}
<p>See ${link("install", "Linux installation")} for the directory layout and ${link("cluster", "cluster installation")} for the example unit names.</p>`],
    ["backup", "Back up the matching state", ({ code, link }) => `
<ul class="task-list">
  <li><strong>On every host.</strong> Record the old symlink target and keep the old archive, checksum, and <code>BUILD-INFO</code>. Back up environment files, configured TLS and source credentials, the cluster YAML, systemd units and overrides, telemetry settings, and any ingress configuration or certificates stored outside <code>/etc/graphlake</code>.</li>
  <li><strong>Standalone or a single Coordinator.</strong> Stop writes and local refresh jobs, then copy the whole catalog offline. Include hidden authentication, local-table files, audit logs, and revision archives. Separately snapshot external databases, mounted files, and object-store versions consumed by the model.</li>
  <li><strong>HA.</strong> Freeze model, role, and local-table writes before creating the checkpoint. Export control state and committed local tables with the old binary. Keep <code>control.json</code>, matching <code>local-&lt;id&gt;</code> directories, and a manifest with external data snapshots at the same business checkpoint. Keep an etcd snapshot and the matching shared object-store control data if your infrastructure restore plan uses them. Keep a verified copy in a separate failure domain.</li>
</ul>
${code("Shell", upgradeNodeBackup)}
<p>Record the before-upgrade result through the client route that will be used for acceptance. This example uses model <code>graph</code> and the service account from the ${link("clients", "developer integration guide")}. The runnable sample returns <code>['Alice']</code> and its published revision. For your own model, replace the query and expected rows in the script. On HA, set <code>GRAPHLAKE_ORIGIN</code> in this block to the actual HTTPS ingress. Run the canary on the same host before both the upgrade and final verification.</p>
${code("Shell", upgradeCanary)}`],
    ["standalone", "Upgrade a standalone service", ({ code }) => `
<p>Drain client traffic and stop scheduled source changes during the maintenance window. The first block stops GraphLake, archives the catalog including hidden files, and checks both local archives. The second starts the staged release. New binaries and web assets come from the same directory.</p>
${code("Shell", standaloneBackup)}
${code("Shell", standaloneUpgrade)}
<p>For a cluster with one Coordinator, allow a maintenance outage. Stop the Coordinator and the Workers that use the shared catalog before taking the offline backup. Snapshot its etcd and shared storage as well. When the Coordinator and both Workers share <code>current</code> on one host, keep the Coordinator stopped, list both Worker units in the same command, then start the Coordinator.</p>
${code("Shell · single-host cluster", colocatedUpgrade)}`],
    ["cluster", "Roll out a cluster upgrade", ({ code, link }) => `
<p>In an HA cluster, prepare a maintenance window and keep the old published model and role configuration stable. Pause scheduled local-table refresh and CSR builds before the checkpoint. Do the following export on the active Coordinator with the old release still active. Run both export and verification before replacing any node.</p>
${code("Shell", clusterCheckpoint)}
<p>Copy the entire checkpoint to an independent site and verify the copy with the previous release. Assemble the matching data snapshots and manifest using the ${link("recovery", "backup and recovery guide")}.</p>
<ol>
  <li><strong>Workers first.</strong> Run this on one Worker host at a time. Replace the port-based unit name with that host's actual unit. After each restart, check that the Worker reappears in Model health and the unchanged Coordinator still returns the baseline query. Wait for that check before replacing the next Worker.</li>
</ol>
${code("Shell", upgradeWorker)}
<ol start="2">
  <li><strong>Upgrade the standby Coordinator.</strong> Run this on the standby after all Workers are healthy. Its private status endpoint at port <code>7338</code> normally reports <code>role: candidate</code> with <code>ready: false</code> while the old leader owns the lease. Keep it running while you arrange the handoff.</li>
</ol>
${code("Shell", upgradeCoordinator)}
<ol start="3">
  <li><strong>Hand off leadership.</strong> After draining the old leader through the configured ingress, stop the service on that host. Wait for the candidate to report <code>role: leader</code> and <code>ready: true</code>, then run the acceptance checks through the business ingress. Bolt and Gremlin clients may need to reconnect after a handoff.</li>
</ol>
${code("Shell · old leader", handoffCoordinator)}
<ol start="4">
  <li><strong>Upgrade the former leader.</strong> Once the new leader passes acceptance, run the Coordinator upgrade command on the former leader and confirm it joins as a candidate. Check all nodes again before resuming model, role, and local-table writes. Keep new data layouts or features that write incompatible state out of the mixed-version window.</li>
</ol>`],
    ["verify", "Verify the upgrade through the client entry point", ({ code, image, link }) => `
<p>Use the same shell and the same baseline as in the backup step. The commands check the exact build at <code>/healthz</code>, the readiness gate at <code>/readyz</code>, and the query output including the published revision. For a different target or a rollback, change <code>expected_build</code> to the expected build string, such as the one recorded in <code>health-before.json</code>.</p>
${code("Shell", upgradeVerify)}
<ol>
  <li>Sign in to the English console. Open <strong>Runtime Settings → Health Checks → Model health</strong>, select <strong>Check</strong>, and expand the result. Verify the sources and expected Worker count for the same published revision.</li>
  <li>Open <strong>Query</strong> and verify a known result in <strong>Table</strong>. Expand <strong>Execution details</strong> to confirm the model version and sources. Reconnect and run the ${link("clients", "Bolt and Gremlin examples")} if those protocols serve your applications.</li>
  <li>Review failed requests, local-table freshness and CSR as applicable, and the backup schedule. Reopen traffic and resume jobs after the checks pass.</li>
</ol>
<figure>${image("upgrade-model-health", "English GraphLake v1.1.2 Health Checks showing two available sources and two healthy Workers")}<figcaption>After the rollout, run a fresh model health check and expand the results to confirm each Worker and source.</figcaption></figure>
<figure>${image("upgrade-query-result", "English GraphLake v1.1.2 Query workspace showing Alice and the model version in Execution details")}<figcaption>Check a known query result and its published revision alongside the health endpoint.</figcaption></figure>`],
    ["rollback", "Roll back a failed upgrade", ({ code, link }) => `
<p>Keep traffic isolated when the build, readiness, source health, authorization, or known-result check fails. Save the failed node's logs and preserve the newer state for investigation. Before restoring a checkpoint, account for any later writes so they can be reconciled after recovery.</p>
<p><strong>Standalone.</strong> The default rollback below uses the previous binary and the offline catalog backup. It verifies the archive, restores it on the same filesystem, and retains the replaced catalog for review. If you changed service or environment configuration, verify <code>node-config.tar.sha256</code> and restore the corresponding saved files before activation. Recover external source data at the same checkpoint when it changed.</p>
${code("Shell", standaloneRollback)}
<p><strong>Compatible cluster state.</strong> Keep ingress isolated and stop all Coordinators before switching the shared fleet back. Use this path only when you have confirmed the previous release can read the current control state, local-table snapshots, and CSR. On each Worker host, select the previous release recorded there. If several Worker units share a symlink, list all of them in the Worker command and keep the Coordinator stopped until the Workers are ready.</p>
${code("Shell · Worker host", rollbackWorker)}
<p>Start the previous Coordinator after the Workers are back. For HA, wait for the first Coordinator to become ready before starting the standby on its host.</p>
${code("Shell · Coordinator host", rollbackCoordinator)}
<p><strong>Incompatible cluster state.</strong> Restore the verified pre-upgrade checkpoint with its matching binaries in a fresh cluster namespace and a separate storage prefix. Verify the replica on the recovery host with the old tool. Set <code>export_dir</code> to the offsite checkpoint directory if it differs from the original export location.</p>
${code("Shell", verifyRecoveryArchive)}
<p>Use the isolated target's HTTPS <code>/recovery</code> workflow in the ${link("recovery", "backup and recovery guide")}. For an offline CLI import, first restore the matching source files and databases, prepare <code>recovery.yaml</code> with the unused cluster name and storage prefix, and put the target credentials in <code>recovery.env</code>. With all target Coordinators stopped and the checkpoint under the directory below, import the control archive and manifest.</p>
${code("Shell", restoreClusterCheckpoint)}
<p>For a CLI import, set <code>GRAPHLAKE_RECOVERY_DIR</code> to <code>restore_dir</code> and configure the target recovery token before starting the Coordinator. Complete target verification before cutover. Reassign roles and issue fresh service credentials where required by the restore. Repeat the build, readiness, authorization, and known-result checks with the previous build and the recovered dataset before opening traffic.</p>`],
  ],
};
