export default {
  title: "故障排查",
  description: "按症状找到控制台报错和对应的服务日志，处理后用同一业务入口和已知结果复验。",
  sections: [
    ["logs", "定位报错和对应日志", ({ code, link }) => `
<p>先记下原始错误、发生时间和时区、模型与发布版本，以及界面显示的运行 ID、任务 ID 或恢复检查点。用发生问题的入口和账号复现，在对应组件的日志里按时间查找。</p>
<dl class="plain-list">
  <dt><a href="#source">数据源连接失败</a></dt><dd>数据源页面和发布模型的健康检查。</dd>
  <dt><a href="#sync">本地表同步失败</a></dt><dd>本地表与同步 → 加载历史，再查看活动 Coordinator 或单机服务日志。</dd>
  <dt><a href="#query">查询报错</a></dt><dd>查询工作台或客户端响应，再查看 Coordinator 和执行 Worker 的日志。</dd>
  <dt><a href="#worker">Worker 离线</a></dt><dd>模型健康明细，再查看对应 Worker 的日志和私网链路。</dd>
  <dt><a href="#backup-restore">备份或恢复失败</a></dt><dd>备份与恢复、备份任务日志及目标站的恢复进度。</dd>
</dl>
<p>使用安装包的 systemd 单元时，在负责运行进程的主机上执行对应命令。Coordinator 和 Worker 使用实际部署的单元名。前台运行时看进程的标准输出和标准错误。已启用日志导出时，在 Collector 下游的日志系统中按服务实例和时间检索。</p>
${code("Shell", "sudo journalctl -u graphlake.service --since '30 minutes ago' --no-pager\nsudo journalctl -u graphlake-backup.service --since '30 minutes ago' --no-pager")}
<p>分享诊断信息前，去掉口令、令牌、连接串和客户数据。探针及日志配置见${link("monitoring", "监控与遥测指南")}。</p>`],
    ["source", "数据源连接失败", ({ image, link }) => `
<ol>
  <li><strong>找出失败的数据源。</strong>在<strong>数据源（Data Sources）</strong>中选择模型，从来源卡片打开<strong>浏览表和字段（Browse tables and columns）</strong>。记录是列出表时失败，还是打开某个表时失败。再到<strong>运行配置 → 健康检查 → 模型健康（Model health）</strong>，点击<strong>检查（Check）</strong>并展开明细，核对发布版本的来源状态和当前草稿配置。</li>
  <li><strong>按报错修复依赖。</strong>网络或 TLS 报错时，从 GraphLake 服务所在主机检查地址、端口、DNS、防火墙、CA 信任和证书名称。认证报错时，核对服务进程中的 DSN 环境变量，以及账号对目标 schema 和表的读取权限。文件或对象存储报错时，以服务账号检查路径、挂载、桶、前缀和读取权限。如果某个 Worker 也报告来源不可用，在该节点做同样的检查。</li>
  <li><strong>从来源和查询两处复验。</strong>先确认能浏览预期的表和字段。若修改了草稿连接，保存、校验并发布修正后的模型。再次点击<strong>检查</strong>，确认已发布模型的来源可用，然后运行一条使用该来源的已知结果查询。</li>
</ol>
<figure>${image("trouble-source", "英文 Model health 面板显示 people 来源不可用，两个数据源中有一个可用")}<figcaption>展开发布模型的健康检查结果，查看失败的数据源和报告该问题的 Worker。</figcaption></figure>
<p>连接器参数见${link("sources", "连接与浏览数据源")}和${link("datasources", "数据源目录")}。</p>`],
    ["sync", "本地表同步失败", ({ image, link }) => `
<ol>
  <li><strong>打开单次运行记录。</strong>在<strong>数据源 → 本地表与同步（Local tables and sync）</strong>中选择模型，找到本地表，打开<strong>加载历史（Load history）</strong>。记录失败或中断的时间、模式、触发方式和错误，再到活动服务的日志里查相同时间段。已有已提交副本时，模型可能仍在读取旧数据。</li>
  <li><strong>修复原因再重跑。</strong>缺表或缺字段时，浏览上游表并与同步所选字段对照。增量失败时，检查主键是否为空或重复、水位是否为空或类型不兼容，以及最近一次成功后有哪些源数据变更。存储错误时，检查 catalog 可写空间及权限，或托管对象存储配置。进程中断后，先确认旧任务已进入结束状态。排查期间保留已提交的副本。</li>
  <li><strong>重试并确认数据已更新。</strong>首次加载用<strong>加载副本（Load copy）</strong>，后续按配置同步用<strong>立即同步（Sync now）</strong>。如存在源表物理删除或回看窗口之外的更正，用<strong>更多操作 → 运行全量加载（Run full load）</strong>对账。确认最新任务成功，对照<strong>提交后总计（Total after commit）</strong>和受影响的主键，再通过使用本地副本的模型查询这些记录。定时同步还要核对下一次执行时间。</li>
</ol>
<figure>${image("trouble-sync", "英文 Load history 显示 accounts_local 最近一次同步失败及之前的成功记录")}<figcaption>在<strong>加载历史</strong>中对照最新报错与上一次成功运行。</figcaption></figure>
<p>如需更换源表、列、主键或水位，按${link("local-tables", "本地表与同步")}中的流程创建新副本。</p>`],
    ["query", "查询报错", ({ image, link }) => `
<ol>
  <li><strong>记录报错和输入。</strong>在<strong>查询（Query）</strong>工作台记录错误消息、模型、查询语言和参数。API 客户端还应记录 HTTP 状态和错误码。用成功对照查询的<strong>执行明细（Execution details）</strong>查看模型与来源版本。请求已经到达服务时，按报错时间查看 Coordinator 和执行 Worker 的日志。</li>
  <li><strong>按错误类型处理。</strong>语法或不支持的操作报错时，核对语言并缩小到只读语句。Cypher 缺参时，打开<strong>Cypher 参数（Parameters）</strong>，传入键名与类型正确的 JSON 对象。权限问题检查当前账号的模型查询权限及租户范围。遇到 <code>active_revision_changed</code> 时重新加载发布版本。遇到 <code>503 source_unavailable</code> 或 <code>worker_unavailable</code> 时，分别按<a href="#source">数据源</a>或 <a href="#worker">Worker</a> 的步骤排查。</li>
  <li><strong>用相同输入复验。</strong>先按一个已知键运行小查询，再用原账号和原参数重跑原查询。在<strong>表格（Table）</strong>视图核对预期值和行数，并检查成功执行时使用的发布版本和来源版本。</li>
</ol>
<p>超时时先缩小过滤范围、限制跳数，用 <code>EXPLAIN</code> 检查执行计划再调整预算。结果为空时还应检查边方向、租户和时间过滤。预览被截断或邻居会话过期时，见${link("query", "查询与探索")}中的分页、重跑和导出说明。可用${link("query-recipes", "查询示例")}做已知结果的对照。</p>
<figure>${image("trouble-query", "英文 Query 工作台提示缺少 Cypher 参数 account_id")}<figcaption>查询使用了 <code>$account_id</code>。在 <strong>Cypher 参数</strong> 中填入对应参数后重跑。</figcaption></figure>`],
    ["worker", "Worker 离线", ({ image, link }) => `
<ol>
  <li><strong>锁定异常节点。</strong>打开<strong>运行配置 → 健康检查 → 模型健康</strong>，检查已发布模型并展开数据源和 Worker 明细。记录失败节点的地址和消息。<strong>Connection failed</strong> 时优先检查进程和私网链路。若 Worker 报告具体数据源不可用，检查该节点到来源的访问。</li>
  <li><strong>检查节点和私网路径。</strong>在故障节点核对服务单元、启动日志和监听端口。从 Coordinator 核对 Worker 地址、私网代理、mTLS CA 和客户端身份。再检查集群名、令牌配置、版本、etcd 与共享存储权限，以及 Worker 的数据源目录。Worker 内部接口应留在私网。修正配置后重启受影响的进程。</li>
  <li><strong>确认该节点恢复。</strong>重新运行模型健康检查，确认同一地址恢复健康且在线数达到预期，再从实际业务入口运行一条已知结果的 HTTP 查询。查询成功也可能由其他 Worker 完成，需同时核对节点状态。</li>
</ol>
<figure>${image("trouble-worker", "英文 Model health 面板显示两个数据源可用、两个 Worker 中一个健康，第二个 Worker 连接失败")}<figcaption>数据源可用，第二个 Worker 的私网端点连接失败。</figcaption></figure>
<p>Worker 启动参数和私网探针见${link("cluster", "集群安装")}。</p>`],
    ["backup-restore", "备份或恢复失败", ({ image, link }) => `
<ol>
  <li><strong>定位失败阶段。</strong>在活动 HA Coordinator 上打开<strong>运行配置 → 备份与恢复 → 刷新备份状态（Refresh backup status）</strong>。对照<strong>定时备份（Scheduled backup）</strong>和<strong>异地副本校验（Offsite copy verification）</strong>的最近尝试、最后成功和检查点时间。定时导出失败时查备份主机的定时器和 <code>graphlake-backup.service</code> 日志，手动备份失败时查活动 Coordinator 日志。状态不可读时，核对 <code>GRAPHLAKE_BACKUP_STATUS_DIR</code> 及文件权限。</li>
  <li><strong>修复导出或异地副本。</strong>检查磁盘空间、手动备份目录是否私有且可写，以及导出进程能否访问 etcd 和对象存储。保留上一个通过校验的检查点。异地副本校验失败时，重新复制控制归档和配套本地表文件，再在异地副本运行 <code>graphlake-admin backup verify --file control.json</code>，单独复核清单中外部数据文件的摘要。</li>
  <li><strong>在目标站查看导入进度。</strong>打开目标站的 HTTPS <code>/recovery</code> 页面，输入恢复令牌并点击<strong>读取状态（Read status）</strong>。列表为空时检查目标端接收目录、读取权限和检查点结构。用<strong>检查恢复点（Check recovery point）</strong>定位缺少归档、清单不匹配等问题。导入失败时读取<strong>恢复进度（Restore progress）</strong>中的失败阶段和目标 Coordinator 日志，检查恢复挂载是否可写、Parquet 摘要，以及涉及 PostgreSQL 时的目标 DSN、工具兼容性和数据库状态。</li>
  <li><strong>重试并验收后切流。</strong>已开始写入时，修复依赖后重试同一检查点。更换检查点或修正清单时，使用新的目标命名空间。导入后先<strong>校验恢复清单（Verify recovery manifest）</strong>，再<strong>验证恢复（Verify recovery）</strong>。查询结果不符时，核对恢复后的数据、生效模型版本和清单中的预期值。等到显示<strong>允许切流（Ready for cutover）</strong>，通过实际 HTTPS 入口检查 <code>/readyz</code>，并用业务账号重跑已知结果的查询。</li>
</ol>
<figure>${image("trouble-recovery", "英文目标站恢复控制台显示恢复检查点及校验报错")}<figcaption>检查恢复点时报错，先核对目标站接收目录里的文件，再开始导入。</figcaption></figure>
<p>HA 恢复点的完整文件结构及单机 catalog 步骤见${link("recovery", "备份与恢复")}。</p>`],
    ["startup", "控制台打不开", ({ link }) => `
<ol>
  <li>在服务主机检查 <code>systemctl status graphlake</code> 和<a href="#logs">服务日志</a>。</li>
  <li>用 <code>/healthz</code> 查看运行构建，用 <code>/readyz</code> 查看就绪情况。本机已就绪时，继续检查客户端路径上的 SSH 转发或反向代理。</li>
  <li>使用 HTTPS 时，确认实际源地址与 <code>--public-url</code> 一致，代理保留 <code>Host</code> 和 <code>Origin</code> 请求头。处理后用实际客户端 URL 复验两个探针和登录。</li>
</ol>
<p>集群和业务入口的探测见${link("monitoring", "监控与遥测指南")}。</p>`],
    ["model", "找不到模型或发布失败", ({ link }) => `
<p>找不到模型时，检查发布版本和用户角色。发布失败时，运行<strong>校验结构（Validate schema）</strong>及<strong>校验数据（Validate data）</strong>，检查字段，并核对关系两端的业务键类型、租户列和复合键顺序。版本冲突时先重新加载草稿，核对变更后再保存或发布。</p>
<p>发布后用受影响的账号检查模型可见性并运行已知结果的查询。可用${link("first-model", "小样例")}对照验证。</p>`],
    ["freshness", "本地表或 CSR 数据落后", ({ link }) => `
<p>检查最后一次成功加载及水位，并确认发布模型确实使用本地副本。加载落后或失败时，按<a href="#sync">同步排查步骤</a>处理。CSR 代次过旧时，重新构建或者查询相应的在线模型，再用修复后的版本或代次运行已知结果的查询。</p>
<p>参见${link("local-tables", "本地表与同步")}和${link("algorithms", "图算法")}。</p>`],
  ],
};
