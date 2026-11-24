import {
  clusterCheckpoint, colocatedUpgrade, handoffCoordinator, restoreClusterCheckpoint, rollbackCoordinator, rollbackWorker,
  standaloneBackup, standaloneRollback, standaloneUpgrade, upgradeCanary, upgradeCoordinator, upgradeInit, upgradeNodeBackup,
  upgradeStage, upgradeVerify, upgradeWorker, verifyRecoveryArchive,
} from "./upgrade-examples.mjs";

export default {
  title: "版本升级与回滚",
  description: "保留可恢复的检查点，升级 GraphLake 单机或集群，然后用同一模型版本和已知查询验收。",
  sections: [
    ["plan", "规划维护窗口并准备安装包", ({ asset, code, link }) => `
<p>命令以 Debian 12、systemd 和 <code>/opt/graphlake/releases/</code> 布局为例，演示从 <code>v1.1.6</code> 升至 <code>v1.1.8</code>。先核对<a href="https://github.com/SamuelSupe/graphlake/releases/tag/v1.1.8">目标版本发行说明</a>，确认旧版能否读取维护窗口中可能写入的状态。若使用其他目标版本，同时替换安装包名、下载地址和验收的构建字符串。</p>
<p>先在隔离环境用已知数据演练升级和恢复。列出各主机的 Coordinator 和 Worker 单元、共用 <code>/opt/graphlake/current</code> 的服务、实际业务入口，以及需要验收的协议。在各主机用 Bash 执行，保留当前终端供后续命令使用 <code>target</code> 和 <code>checkpoint</code>。</p>
<p>${asset("examples/upgrade/graphlake-release.sh", "下载 graphlake-release.sh")}。下面的命令也可下载它。脚本校验归档、解压到独立目录，在指定服务停止期间原子切换链接。此示例沿用现有 systemd 单元、启动参数和覆盖配置。其他版本若要求修改单元，请先确认差异再重启。</p>
${code("Shell", upgradeInit)}
<p>在每台主机执行下载及准备命令。命令按 Linux 架构选择安装包，并使用官方 SHA-256 文件校验。保留旧安装包、校验文件和解压目录，直到回滚演练通过。</p>
${code("Shell", upgradeStage)}
<p>目录布局见${link("install", "Linux 安装")}，示例单元名见${link("cluster", "集群安装")}。</p>`],
    ["backup", "备份同一检查点的数据和配置", ({ code, link }) => `
<ul class="task-list">
  <li><strong>所有主机。</strong>记录旧链接目标，保留旧包、校验文件及 <code>BUILD-INFO</code>。备份环境变量文件、TLS 和源凭据、集群 YAML、systemd 单元与覆盖配置、遥测设置，以及 <code>/etc/graphlake</code> 之外的入口配置和证书。</li>
  <li><strong>单机或单 Coordinator。</strong>暂停写入和定时同步，停机后备份整个 catalog，包含隐藏的认证文件、本地表、审计和模型版本归档。外部数据库、挂载文件和对象存储版本应单独做快照。</li>
  <li><strong>HA 集群。</strong>暂停模型、权限及本地表写入。用旧版工具导出控制状态和已提交的本地表。将 <code>control.json</code>、配套 <code>local-&lt;id&gt;</code> 目录、外部数据快照和恢复清单保存在同一业务检查点。如果基础设施恢复依赖 etcd 和对象存储快照，一并保存相互匹配的副本。在独立故障域保留并校验一份副本。</li>
</ul>
${code("Shell", upgradeNodeBackup)}
<p>先从客户端实际使用的入口记录升级前结果。以下使用${link("clients", "开发者接入指南")}中的 <code>graph</code> 模型与服务账号。样例脚本返回 <code>['Alice']</code> 和发布版本。使用自己的模型时，修改脚本中的查询和预期结果。HA 集群将命令中的 <code>GRAPHLAKE_ORIGIN</code> 改成业务 HTTPS 地址，并在同一台验收主机保留升级前后的记录。</p>
${code("Shell", upgradeCanary)}`],
    ["standalone", "升级单机服务", ({ code }) => `
<p>在维护窗口将流量切出，并暂停计划任务对来源的变更。先停止 GraphLake，归档包含隐藏文件的 catalog 并校验两份本地备份，再启动已准备的新版本。二进制和控制台资源来自同一版本目录。</p>
${code("Shell", standaloneBackup)}
${code("Shell", standaloneUpgrade)}
<p>单 Coordinator 集群需要停机窗口。备份前停止 Coordinator 和使用共享 catalog 的 Worker，并保存 etcd 和共享存储快照。同一主机上的 Coordinator 和两个 Worker 共用 <code>current</code> 时，保持 Coordinator 停止，把两个 Worker 单元放在同一条切换命令里，等 Worker 启动后再启动 Coordinator。</p>
${code("Shell · 单主机集群", colocatedUpgrade)}`],
    ["cluster", "滚动升级 HA 集群", ({ code, link }) => `
<p>维护窗口内先保持已发布模型和角色配置稳定，暂停本地表定时同步及 CSR 构建。在仍运行旧版的活动 Coordinator 上完成下面的导出与校验，再替换节点。</p>
${code("Shell", clusterCheckpoint)}
<p>将整个检查点复制到异地，用旧版工具复核。按${link("recovery", "备份与恢复指南")}准备匹配的数据快照和清单。</p>
<ol>
  <li><strong>逐台升级 Worker。</strong>每次只处理一台，将示例中的端口单元名改成该主机的实际服务。重启后在模型健康中确认该 Worker 已恢复，并用原 Coordinator 重跑基线查询。通过后再处理下一台。</li>
</ol>
${code("Shell", upgradeWorker)}
<ol start="2">
  <li><strong>升级备用 Coordinator。</strong>全部 Worker 正常后，在备用主机执行以下命令。旧主仍持有租约时，备用节点的私有状态端口 <code>7338</code> 通常返回 <code>role: candidate</code>、<code>ready: false</code>。保持备用节点运行，准备交接。</li>
</ol>
${code("Shell", upgradeCoordinator)}
<ol start="3">
  <li><strong>交接主权。</strong>先通过入口将旧主的流量排空，再在旧主停止服务。等待候选节点报告 <code>role: leader</code>、<code>ready: true</code>，从实际业务入口运行验收。已有 Bolt 和 Gremlin 客户端可能需要重连。</li>
</ol>
${code("Shell · 旧主", handoffCoordinator)}
<ol start="4">
  <li><strong>升级原主节点。</strong>新主验收通过后，在原主执行同一组 Coordinator 升级命令，确认它以候选节点加入。复查所有节点后再恢复模型、角色和本地表写入。混合版本窗口内保持旧版仍能读取的状态格式。</li>
</ol>`],
    ["verify", "通过业务入口验收", ({ code, image, link }) => `
<p>在记录基线的终端执行以下命令。它核对 <code>/healthz</code> 的精确构建字符串、<code>/readyz</code> 的就绪状态，再比较查询输出中的结果和发布版本。检查其他版本或回滚时，将 <code>expected_build</code> 改为对应值，例如 <code>health-before.json</code> 中记录的旧构建。</p>
${code("Shell", upgradeVerify)}
<ol>
  <li>登录英文控制台，打开<strong>运行配置 → 健康检查 → 模型健康</strong>，点击 <strong>Check</strong> 后展开结果。核对相同发布版本的来源及预期 Worker 数。</li>
  <li>在<strong>查询（Query）</strong>的 <strong>Table</strong> 核对已知结果，展开 <strong>Execution details</strong> 查看模型版本与来源。已为应用开启 Bolt 或 Gremlin 时，重连并运行${link("clients", "对应客户端示例")}。</li>
  <li>检查异常请求、适用的本地表及 CSR 新鲜度和备份任务。全部通过后再恢复业务流量和定时任务。</li>
</ol>
<figure>${image("upgrade-model-health", "英文 GraphLake v1.1.2 Health Checks 显示两个来源和两个 Worker 均正常")}<figcaption>升级后重新运行模型健康检查，展开每个来源和 Worker 的结果。</figcaption></figure>
<figure>${image("upgrade-query-result", "英文 GraphLake v1.1.2 Query 工作台显示 Alice 和执行详情中的模型版本")}<figcaption>结合健康接口、已知结果及发布版本验收。</figcaption></figure>`],
    ["rollback", "升级失败时回滚", ({ code, link }) => `
<p>构建、就绪、来源、权限或已知查询验收失败时，保持业务入口隔离。保留失败节点日志和升级后的状态。恢复检查点前记录此后发生的写入，便于恢复后对账或重放。</p>
<p><strong>单机。</strong>下面恢复旧二进制及停机前备份的 catalog。命令会校验备份，在同一文件系统解包，并保留被替换的目录。如果变更过单元文件或环境配置，激活前先校验 <code>node-config.tar.sha256</code>，恢复对应配置文件。外部数据有变更时按同一检查点恢复。</p>
${code("Shell", standaloneRollback)}
<p><strong>集群状态仍兼容。</strong>保持入口隔离并停止所有 Coordinator。先确认旧版能读取当前的控制状态、本地表快照和 CSR，再在 Worker 主机切回各自记录的旧版。共用链接的所有 Worker 单元应在同一条命令中切换，Worker 未就绪前保持 Coordinator 停止。</p>
${code("Shell · Worker 主机", rollbackWorker)}
<p>Worker 恢复后启动旧 Coordinator。HA 集群等第一台 Coordinator 就绪后再启动备用节点。</p>
${code("Shell · Coordinator 主机", rollbackCoordinator)}
<p><strong>集群状态已不兼容。</strong>使用升级前匹配的二进制和已校验的检查点，在新集群命名空间和独立对象存储前缀恢复。在恢复主机使用旧工具验证异地副本，必要时将 <code>export_dir</code> 设为副本目录。</p>
${code("Shell", verifyRecoveryArchive)}
<p>优先按${link("recovery", "备份与恢复指南")}在隔离目标的 HTTPS <code>/recovery</code> 页面恢复。若走离线 CLI，先还原匹配的数据文件和数据库，准备包含全新集群名与存储前缀的 <code>recovery.yaml</code>，并将目标站凭据放入 <code>recovery.env</code>。所有目标 Coordinator 停止、且检查点目录已准备好时，导入控制归档及清单。</p>
${code("Shell", restoreClusterCheckpoint)}
<p>用 CLI 导入时，启动 Coordinator 前把 <code>GRAPHLAKE_RECOVERY_DIR</code> 指向 <code>restore_dir</code>，并配置目标站恢复令牌。完成目标站验收后再切流。按恢复要求重新分配角色并签发新的服务令牌。用旧构建和恢复的数据重新验证健康、权限及已知查询，通过后再开放流量。</p>`],
  ],
};
