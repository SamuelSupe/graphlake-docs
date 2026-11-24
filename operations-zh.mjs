import upgrade from "./upgrade-zh.mjs";
import {
  coordinatorOverride, fingerprintPostgres, haFlags, installClusterConfig, installMonitor,
  labCluster, productionCluster, recoveryManifest, serviceChecks, setupBackupTimer,
  startCluster, verifyBackup, workerUnit,
} from "./operations-examples.mjs";

export default {
  upgrade,
  cluster: {
    title: "集群安装",
    description: "部署 Coordinator 和 Worker，验证分布式查询，再扩展到跨主机和故障接管。",
    sections: [
      ["prepare", "1. 准备主机", ({ link }) => `
<p>Coordinator 提供控制台、发布模型，并把符合条件的 HTTP 查询、预览和导出任务派发给 Worker。Bolt 和 Gremlin 驱动会话在 Coordinator 执行。Worker 获取已发布模型并读取来源，因此这两类进程都需要访问对应的数据和凭据。</p>
<p>首次部署可用一台运行 systemd 的 Debian 12 主机，准备监听 <code>127.0.0.1:2379</code> 的 etcd v3 HTTP/JSON 网关。每台主机完成${link("install", "Linux 安装")}的下载校验和安装服务两节，解包并安装 systemd 单元，再按下文启动集群。所有节点使用相同的 GraphLake 构建。</p>`],
      ["configure", "2. 配置单主机集群", ({ code }) => `
<p>将下方配置保存为 <code>cluster.yaml</code>。示例使用两个回环 Worker 和一个私有的本地存储目录。Coordinator 的工作台端口为 <code>7337</code>，进程状态端口为 <code>7338</code>。</p>
${code("YAML", labCluster)}
<p><code>memory_mib</code> 控制单次 Worker 执行或 CSR 构建预算，<code>process_memory_mib</code> 控制进程查询准入总预算。需为远端阶段、运行时开销及文件缓存留出空间。Delta 快照共享同一准入控制器的有界元数据缓存；同步及来源探测采用独立的准入限额。</p>
<p>安装配置，在环境文件中设置 <code>GRAPHLAKE_CLUSTER_TOKEN</code>，值可用 <code>openssl rand -hex 32</code> 生成。Coordinator 与 Worker 使用相同令牌，并从该文件载入模型引用的源凭据变量。</p>
${code("Shell", installClusterConfig)}`],
      ["start", "3. 启动 Worker 和 Coordinator", ({ code, link }) => `
<p>将 Worker 模板保存为 <code>/etc/systemd/system/graphlake-worker@.service</code>。实例名决定回环端口。把来源文件放在示例的 catalog 路径下，或将 <code>--source-dir</code> 改为实际挂载目录。</p>
${code("systemd", workerUnit)}
<p>执行 <code>systemctl edit graphlake</code> 时填入下方配置。空的 <code>ExecStart=</code> 清除随安装包提供的单机启动命令。</p>
${code("systemd", coordinatorOverride)}
<p>首次使用的 catalog 需初始化一次管理员密码。若已有管理员，从第二条命令开始。</p>
${code("Shell", startCluster)}
<p>打开 <code>http://127.0.0.1:7337/</code>，远程访问可用 SSH 隧道。${link("model", "发布模型")}后，在<strong>运行配置 → 健康检查</strong>中检查模型，再运行一条结果已知的查询。实际采用分布式阶段的查询会在原始响应的 <code>distributed</code> 字段显示参与 Worker 和阶段数量。小规模探测查询可能只在一个 Worker 上执行。</p>`],
      ["production", "4. 扩展到多台主机", ({ code, ref }) => `
<p>同步各主机时钟，准备具备多数派的 etcd 集群，以及使用独立前缀的 S3 兼容存储。各节点使用同一份集群配置。为运行账号授予该前缀所需权限，并为来源数据使用只读凭据。Parquet 可放到共享对象存储，也可在所有读取节点挂载同一份文件。</p>
${code("YAML", productionCluster)}
<p>替换示例中的地址和存储前缀。<code>metadata</code> 最多配置同一个 etcd 集群的三个成员入口。集群 CA 必须信任私有 TLS 端点。每台主机在 <code>identity_file</code> 对应路径部署包含证书和私钥的 PEM 文件，确保服务账号可读。</p>
<p>每台 Worker 主机启动一个实例，Worker 仍仅监听 IPv4 回环地址。通过 mTLS 反向代理校验客户端证书，仅转发 <code>/internal/v1/jobs</code>、<code>/internal/v1/stages</code>、<code>/internal/v1/csr</code>、<code>/internal/v1/identity</code> 和 <code>/internal/v1/readiness/{model}/{revision}</code>。把代理的私有 HTTPS 地址写入 <code>workers</code>，逐节点检查 etcd、共享存储和来源访问。</p>
<p>将 <code>distributed_partitions</code> 设为 2 至 8，可让符合条件的查询使用分布式阶段。设为 0 时，每条查询派给一个 Worker。调优参数及内存语义见${ref("deploy/cluster.md#单条查询跨节点执行", "分布式执行参考")}。</p>`],
      ["failover", "5. 启用 Coordinator 故障接管", ({ code, link, ref }) => `
<p>两台 Coordinator 使用相同构建、集群命名空间和启动用的 catalog，管理员密码哈希也保持一致。在两台 Coordinator 的服务命令中加入下方参数，并将公开地址设为浏览器访问的正式 HTTPS 源地址。</p>
${code("Shell flags", haFlags)}
<p>先启动一台 Coordinator 并等待首次导入完成，再启动备用实例。TLS 入口通过私有转发访问 Coordinator，只将 HTTP 请求路由至通过 <code>/coordinator/active</code> 检查的实例。随包的 ${ref("deploy/haproxy.cfg", "HAProxy 配置")}包含 HTTPS、Gremlin WebSocket、Bolt 握手和恢复路由。仅在客户端需要 Bolt 时启用并验证 Bolt 监听。</p>
<p>通过真实入口检查 HTTPS 就绪并运行结果已知的查询。故障接管演练中停止当前活动 Coordinator，确认备用节点接管并重新执行同一查询，再验证各启用的驱动能重连。使用独立状态端口观察两个节点。Worker 升级顺序与恢复检查点见${link("upgrade", "版本升级与回滚指南")}。使用 HAProxy 与 Keepalived 双入口时，参见${ref("deploy/cluster.md#冗余入口", "冗余入口参考")}。</p>`],
    ],
  },
  monitoring: {
    title: "监控与排障",
    description: "在运行配置中检查已发布模型、数据源和 Worker，配置本地日志与 OpenTelemetry，再设置持续监控。",
    sections: [
      ["ui-health", "检查模型、数据源和 Worker", ({ image, link }) => `
<ol>
  <li>用管理员账号打开<strong>运行配置 → 健康检查</strong>。在<strong>模型健康</strong>中，对单个已发布模型点击<strong>检查</strong>，或点击<strong>检查全部</strong>。</li>
  <li>查看检查结果、发布版本和检查时间。展开显示数据源可用数量的一行可查看逐项结果。集群还会显示 Worker 正常数量、每个 Worker 的状态，以及 Worker 报告的不可用来源。</li>
  <li>勾选<strong>只看需处理</strong>可聚焦已发现的问题。修复后重新检查，并从实际业务入口运行一条结果已知的查询。</li>
</ol>
<dl class="plain-list">
  <dt>尚未检查 / 未发布</dt><dd>检查已发布的模型。草稿校验和运行健康分别显示。</dd>
  <dt>来源不可用</dt><dd>点击<strong>配置数据源</strong>，检查连通性、凭据环境变量和文件路径。参见${link("sources", "数据源接入指南")}。</dd>
  <dt>映射不兼容</dt><dd>根据异常位置核对表、字段、业务键及边端点类型，修正草稿后校验并发布。</dd>
  <dt>Worker 异常 / 无法连接</dt><dd>检查列出的 Worker 进程和私有网络路由。如果该 Worker 列出了不可用来源，从 Worker 所在主机核对读取权限、文件挂载和凭据。</dd>
</dl>
<figure>${image("ops-health", "英文 Health Checks 页面显示 Transfer demo 的两个可用来源和两个正常 Worker")}<figcaption>展开模型摘要可查看每个来源和 Worker 的检查结果。</figcaption></figure>
<p>节点离线时，参见<a href="../troubleshoot/#worker">Worker 排查步骤</a>。</p>`],
      ["telemetry", "配置日志和 OpenTelemetry", ({ image, ref }) => `
<ol>
  <li>单机及未启用故障接管的 Coordinator 默认使用 catalog 中的 <code>.graphlake-telemetry.yaml</code>。为启用故障接管的 Coordinator 配置各主机本地文件，可复制随包的${ref("deploy/telemetry.yaml", "遥测配置模板")}，通过 <code>--telemetry-config /etc/graphlake/telemetry.yaml</code> 或服务环境变量 <code>GRAPHLAKE_TELEMETRY_CONFIG</code> 指定并重启。命令行参数优先。服务用户需要配置文件及其父目录的写入权限。</li>
  <li>在<strong>运行配置 → 日志与遥测</strong>中，为<strong>本地日志</strong>选择<strong>纯文本</strong>或<strong>结构化 JSON</strong>。本地日志格式可独立设置。</li>
  <li>在<strong>OpenTelemetry 上报</strong>中勾选<strong>启用 OTLP 上报</strong>，填写 Collector 的 OTLP/HTTP 基址并选择信号。GraphLake 会追加 <code>/v1/metrics</code>、<code>/v1/logs</code> 和 <code>/v1/traces</code>。</li>
  <li>在<strong>高级上报设置</strong>中填写服务名称、实例标识、链路采样率、上报间隔和超时。Collector 需要认证时，在<strong>Collector 请求头</strong>中将请求头绑定到服务端环境变量，例如 <code>GRAPHLAKE_OTLP_AUTHORIZATION</code>。新增凭据绑定时，通过 <code>GRAPHLAKE_OTLP_ALLOWED_ORIGINS</code> 设置允许的 Collector 源地址。</li>
  <li>点击<strong>保存配置</strong>。如显示待重启，重启刚修改配置的进程，然后重新打开页面核对<strong>当前 OTLP</strong>、<strong>当前本地日志</strong>与生效接收端。其他 Coordinator、Worker 和备份进程使用各自的配置文件。</li>
</ol>
<p>运行一条结果已知的查询生成活动，再到<strong>健康检查 → 上报状态</strong>点击<strong>刷新状态</strong>。查看已启用信号的<strong>最近完整接收</strong>时间。失败和拒收从进程启动起累计。计数增加时，检查网络、Collector 的响应与认证，以及 Collector 的下游处理链路。</p>
<figure>${image("ops-telemetry", "英文 Logging and telemetry 页面已选择 Structured JSON 和 OTLP，上方提示保存后需要重启")}<figcaption>保存后按提示重启进程，再用页面顶部显示的当前值确认配置生效。</figcaption></figure>`],
      ["probes", "检查服务和业务入口", ({ code, link }) => `
<p>前两项探测走客户端使用的正式 HTTPS 地址。在每台 Coordinator 主机上访问独立的回环状态端口，核对当前角色。按${link("cluster", "集群安装指南")}使用 <code>--status-port</code> 启用端口。</p>
${code("Shell", serviceChecks)}
<dl class="plain-list">
  <dt><code>/healthz</code> 有响应，但 <code>/readyz</code> 失败</dt><dd>检查 Coordinator 角色、etcd、共享存储、Worker 可达性和入口转发。</dd>
  <dt>服务已就绪，但模型失败</dt><dd>在<strong>运行配置 → 健康检查</strong>中探测已发布模型，查看来源和 Worker 检查结果，再通过业务入口重跑查询。</dd>
  <dt>只有某个客户端协议失败</dt><dd>通过入口发起实际的 Bolt 握手或 Gremlin WebSocket 升级，与私有路径上的 Coordinator 监听对照。</dd>
</dl>`],
      ["monitor", "配置持续探测", ({ code, ref }) => `
<p>在具备 Python 3、可访问真实客户端入口的主机上运行随包的 <code>graphlake-monitor</code>。从 ${ref("deploy/monitor.json", "monitor.json")} 模板开始，在 <code>ingress</code> 中配置实际启用的协议，为 Coordinator 和 Worker 指定固定名称，通过私有转发读取状态和身份端点。</p>
<p>为探测创建专用的只读查询服务账号，授予目标已发布模型的查询权限。每个模型配置一条结果已知、返回有界的只读查询，多行结果显式排序，期望单元格使用 API 返回的文本或 null。把服务账号和 Worker 探测令牌写入 root 所有、权限为 <code>0600</code> 的 <code>/etc/graphlake/monitor.env</code>。</p>
<p>在包含已配置 <code>monitor.json</code> 的目录执行下列命令，启动随包监控服务并查看指标。</p>
${code("Shell", installMonitor)}`],
      ["alerts", "跟踪数据新鲜度、资源和恢复", ({ ref, link }) => `
<p>用 Prometheus 任务 <code>graphlake-monitor</code> 抓取 <code>127.0.0.1:9337</code>。若同时抓取活动入口的生产指标，使用任务名 <code>graphlake-active</code>。加载随包的${ref("deploy/prometheus-rules.yaml", "告警规则")}并配置 Alertmanager 路由，跟踪本地表观测与全量对账时间、CSR 代次、剩余磁盘及异地备份校验时间。</p>
<p>发生排队饱和时，先检查查询槽位、延迟和溢写量。出现新鲜度告警时，核对最近一次加载和当前 CSR 代次，修复后再跑结果已知的查询。${link("recovery", "备份与恢复指南")}包含控制状态导出和验收步骤。各节点可通过 ${ref("deploy/telemetry.yaml", "telemetry.yaml")} 配置 OTLP 日志、指标和链路。</p>`],
    ],
  },
  recovery: {
    title: "备份与恢复",
    description: "了解单机备份方式，使用 HA 控制台创建备份，在目标站恢复并验证业务结果。",
    sections: [
      ["backup-ui", "在控制台创建手动备份", ({ image, link }) => `
<ol>
  <li>在每台${link("cluster", "启用故障接管的 Coordinator")}上创建私有绝对路径目录，权限设为 <code>0700</code>，并确保 GraphLake 服务用户可写。在服务环境中将 <code>GRAPHLAKE_MANUAL_BACKUP_DIR</code> 指向该目录，然后重启。</li>
  <li>在活动 Coordinator 上用管理员打开<strong>运行配置 → 备份与恢复</strong>，在<strong>手动备份</strong>中点击<strong>立即备份</strong>。备份写入服务器，页面显示文件名和检查点时间。包含本地表时，将配套目录和控制归档一起保管。</li>
  <li>点击<strong>刷新备份状态</strong>，查看<strong>定时备份</strong>和<strong>异地副本校验</strong>。核对最近尝试、失败时的最近成功时间以及数据检查点。状态文件放在独立目录时，设置 <code>GRAPHLAKE_BACKUP_STATUS_DIR</code> 并为服务用户授权读取。</li>
</ol>
<p>控制归档含密码哈希等凭据数据，应将归档和相关文件保存在私有存储中，并校验异地副本。外部源数据按下文说明保存到同一检查点。</p>
<figure>${image("ops-backups", "英文 Backup and Recovery 页面显示手动备份前提、定时备份、异地副本校验和恢复入口")}<figcaption>截图展示单机控制台。在启用故障接管并配置备份目录的 Coordinator 上，同一面板会提供<strong>立即备份</strong>。</figcaption></figure>`],
      ["standalone", "备份与还原单机部署", ({ link }) => `
<p>停止服务后，以私有权限复制完整 catalog，包含隐藏的发布归档、认证文件和本地表。模型引用的外部文件、数据库以及服务配置需要分别备份。还原时先停止目标服务，恢复 catalog、文件权限与匹配的源数据，再启动。在${link("monitoring", "监控指南")}中按步骤核对就绪状态、发布版本和结果已知的查询。</p>`],
      ["backup", "1. 导出控制状态并校验副本", ({ code, link }) => `
<p>HA ${link("cluster", "集群")}随包提供 systemd 定时器，每小时从共享集群配置导出模型、已发布版本、角色等控制状态。在指定备份主机安装发行包，配置同一份集群配置及读取控制状态的凭据。使用 catalog 本地表时，备份服务的 <code>GRAPHLAKE_BACKUP_CATALOG_DIR</code> 应指向实际 catalog。</p>
${code("Shell", setupBackupTimer)}
<p>将完整恢复点及相关文件同步到独立站点，按照含凭据的数据保护备份。在异地对完成同步的副本执行校验。如需在控制台记录结果，可加上 <code>--status-file /var/lib/graphlake-backups/verify-status.json</code>，并将该状态文件放到控制台读取的目录。</p>
${code("Shell", verifyBackup)}`],
      ["manifest", "2. 绑定同一业务时点的数据", ({ code, ref }) => `
<p>当恢复点包含外部来源时，在同一业务时点暂停控制状态与来源数据写入。导出控制备份，使用 PostgreSQL 时执行 <code>pg_dump -Fc</code>，并复制模型引用的确切 Parquet 文件。对清单中的每张 PostgreSQL 表使用下方命令计算内容摘要。</p>
${code("Shell", fingerprintPostgres)}
<p>把 <code>manifest.json</code> 与 <code>control.json</code> 放在同一目录。清单引用 PostgreSQL 时放入 <code>postgres.dump</code>，Parquet 使用相对于恢复点的路径。本地表导出的 <code>local-&lt;id&gt;</code> 目录也放在同级。填入真实的小写 SHA-256 与发布版本 <code>active_revision</code>，记录至少一条验收查询及恢复后应返回的完整结果。</p>
${code("JSON", recoveryManifest)}
<p>没有对应外部源时，可省略 <code>postgres</code> 或 <code>parquet</code> 项。只使用本地副本的模型可从控制归档取得本地表文件清单。详细约定见${ref("deploy/cluster.md#绑定恢复点并开放入口", "恢复清单参考")}。</p>`],
      ["import", "3. 在目标站的 HTTPS 控制台恢复", ({ image, link }) => `
<p>目标站使用新的集群名和 S3 前缀，独立初始化管理员凭据。备用 Coordinator 采用相同的恢复配置。将 <code>GRAPHLAKE_RESTORE_INBOX</code> 指向可信的只读目录，每个恢复点占一个子目录。准备可写的来源目录，按需准备版本兼容的空 PostgreSQL 数据库。<code>GRAPHLAKE_RESTORE_POSTGRES_DSN_ENV</code> 填写清单指定的目标站 DSN 变量名。</p>
<p>为目标站各 Coordinator 配置同一个恢复专用 <code>GRAPHLAKE_RECOVERY_TOKEN</code>，启动${link("cluster", "目标集群")}和 TLS 恢复路由。</p>
<ol>
  <li>从<strong>运行配置 → 备份与恢复</strong>点击<strong>恢复备份</strong>，输入目标站 HTTPS 地址，再点击<strong>打开目标站</strong>。也可直接访问目标站的 <code>/recovery</code> 页面。</li>
  <li>填写目标站的<strong>恢复令牌</strong>并点击<strong>读取状态</strong>。在<strong>异地备份</strong>中选择<strong>恢复检查点</strong>，点击<strong>检查恢复点</strong>，核对检查点时间、表数和文件数。</li>
  <li>点击<strong>开始恢复 → 确认恢复</strong>，查看<strong>恢复进度</strong>。依次检查备份校验、文件与本地表恢复、适用时的 PostgreSQL 恢复以及控制状态导入。开始写入后若中断，使用同一个恢复点重试。</li>
</ol>
<figure>${image("ops-restore-target", "英文 Restore backup 对话框显示目标站 HTTPS 地址和 Open target site 按钮")}<figcaption>先打开独立的目标站，再选择并检查恢复点。</figcaption></figure>
<p>备份或恢复报错时，参见<a href="../troubleshoot/#backup-restore">备份与恢复故障排查</a>。</p>`],
      ["cutover", "4. 通过验收后接入流量", ({ link }) => `
<ol>
  <li>导入后在目标站 <code>/recovery</code> 点击<strong>校验恢复清单</strong>，核对摘要、表数、文件数和验收查询数量。</li>
  <li>在<strong>业务查询验收</strong>中点击<strong>执行恢复验收 → 开始验收</strong>。目标站验证恢复后的数据、清单列出的发布版本，以及查询返回的完整结果行。</li>
  <li>等到页面显示<strong>允许切流</strong>，表示验收通过且同一个 HTTPS 入口的 <code>/readyz</code> 已就绪。再通过真实业务入口运行一条结果已知的查询。在验收和切流完成前保持来源写入暂停。</li>
</ol>
<p>${link("quickstart", "Parquet 样例")}的转账计数返回一行，值为 <code>4</code>。切流前，对照清单核对实际结果和模型发布版本。</p>
<p>恢复后按身份目录重新分配成员权限，为应用签发新凭据。旧用户及服务账号访问会停用，历史会话会清空。核对旧凭据已拒绝、新权限生效，且各启用协议和${link("monitoring", "监控探测")}能通过生产入口运行。使用本地表定时任务时，重新保存刷新配置，以恢复定时刷新与对账。</p>`],
    ],
  },
};
