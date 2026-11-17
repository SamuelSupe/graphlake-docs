import {
  cypher, download, generateDemo, graphQuery, install, mapping, mcpConfig,
  packagesList, release, runDemo, start, workbench,
} from "./examples.mjs";
import operations from "./operations-zh.mjs";

const workbenchAlt = "GraphLake 查询工作台，展示 Parquet 示例中的三个账户及其转账关系";

export default {
  ui: {
    product: "只读图分析", overview: "产品概览", docs: "文档", language: "English",
    primary: "主导航", start: "入门", guides: "使用指南", operations: "运维",
    contents: "文档导航", onPage: "本页目录", previous: "上一篇", next: "下一篇",
    skip: "跳转到正文", copy: "复制", copied: "已复制", copyError: "请手动复制",
    footer: "资源", release: "发行说明",
  },
  home: {
    title: "在现有数据上<br class=\"wide-break\">做图分析",
    description: "将数据库和湖仓表中的实体与关系建成图，用 Cypher、SQL 或 Gremlin 查询，并在浏览器中探索结果。",
    cta: "运行第一条查询",
    workbenchAlt,
    workflow: "从数据表到图",
    steps: [
      ["sources", "连接数据", "读取现有数据库、数仓或湖仓文件。直接查询时，数据仍由原系统保存。"],
      ["model", "建立关系模型", "用表的主键和字段定义节点、边与属性，校验草稿后再发布。"],
      ["query", "查询与探索", "查找多跳路径，在工作台逐步展开邻居，或导出结果供下游分析。"],
    ],
    cases: {
      funds: "追踪账户间的转账，查看资金从发起方流向接收方的路径。",
      dependencies: "从待变更的服务出发，查找依赖它的下游服务。",
      lineage: "从报表追溯上游数据集和生成它们的任务。",
    },
    more: "进阶指南",
  },
  articles: {
    install: {
      title: "Linux 安装",
      description: "在 Debian 12 或兼容的 glibc Linux 主机上通过 systemd 运行 GraphLake 单机服务。",
      sections: [
        ["download", "1. 下载并校验", ({ code, releasePage }) => `
<p>准备具备 <code>sudo</code> 权限、glibc 2.36 或更高版本的主机。<a href="${releasePage}">${release} 发行包</a>包含命令行工具、管理服务、已构建的工作台和 systemd 配置。运行 <code>uname -m</code> 确认架构，下载对应的压缩包和校验文件。</p>
${packagesList("SHA-256 校验文件")}
<p>也可以在下载目录执行以下命令。校验输出 <code>OK</code> 后，在同一个终端会话继续安装。</p>
${code("Shell", download)}`],
        ["install", "2. 安装服务", ({ code, link }) => `
<p>以下命令适用于首次安装。已有服务请先查看${link("deploy", "升级步骤")}。如果手动下载了文件，请先将 <code>artifact</code> 设为去掉 <code>.tar.gz</code> 的文件名，并完成校验。版本目录存放二进制和网页，<code>/var/lib/graphlake</code> 下的 catalog 存放模型和服务状态。</p>
${code("Shell", install)}`],
        ["start", "3. 初始化并启动", ({ code }) => `
<p>按提示设置 <code>admin</code> 密码。每个 catalog 初始化一次认证。服务启动后执行两项探测。</p>
${code("Shell", start)}
<p><code>/healthz</code> 返回当前运行的构建版本，<code>/readyz</code> 返回服务就绪状态。启动失败时，用 <code>sudo journalctl -u graphlake -n 80 --no-pager</code> 查看日志。</p>`],
        ["open", "4. 打开工作台", ({ code, link }) => `
<p>在服务主机打开 <a href="http://127.0.0.1:7337/">http://127.0.0.1:7337</a>。从其他电脑访问时，将 <code>graph-host</code> 换成 SSH 主机名，执行下方命令后在本机打开同一地址。</p>
${code("Shell", "ssh -N -L 7337:127.0.0.1:7337 graph-host")}
<p>使用 <code>admin</code> 登录，创建模型并${link("sources", "接入第一个数据源")}。多人访问时，参见${link("deploy", "部署与运维")}配置 HTTPS 和权限。</p>`],
      ],
    },
    quickstart: {
      title: "快速开始",
      description: "用内置的 Parquet 数据运行第一条图查询，再到浏览器工作台查看转账关系。",
      sections: [
        ["generate", "1. 生成示例数据", ({ code }) => `
<p>安装 Git、Rust 1.95 或更高版本及 C/C++ 工具链。使用浏览器工作台还需 Node.js 24。内置示例会在临时 catalog 中生成三个账户、四笔转账和一份图映射。</p>
${code("Shell", generateDemo)}`],
        ["run", "2. 运行 Cypher 查询", ({ code }) => `
<p>在同一终端中，查找租户 <code>1</code> 内从账户 <code>10</code> 出发、经过两笔转账可到达的账户。金额为各条匹配路径上最后一笔转账的总和。</p>
${code("Shell", runDemo)}
<p class="note"><strong>预期结果</strong> 目标账户 <code>30</code>，共 <code>2</code> 条路径，金额合计 <code>600</code>。</p>`],
        ["workbench", "3. 打开工作台", ({ code }) => `
<p>构建网页、设置本地 <code>admin</code> 密码并启动服务。服务启动时会加载 catalog 中有效的模型。</p>
${code("Shell", workbench)}
<p>访问 <a href="http://127.0.0.1:7337/">http://127.0.0.1:7337</a>，使用 <code>admin</code> 登录。在<strong>图模型</strong>（Graph Models）中打开 <code>graph</code>，进入<strong>查询</strong>（Query）。</p>`],
        ["explore", "4. 探索转账关系", ({ code, image, link }) => `
<p>选择 Cypher 并执行下方查询，切换到<strong>图</strong>（Graph）结果页签。选中节点或边即可查看属性。</p>
${code("Cypher", graphQuery)}
<figure>${image("workbench", workbenchAlt)}<figcaption>在 GraphLake 工作台中查看转账图。</figcaption></figure>
<p>要查询自己的数据，可以继续${link("sources", "连接数据源")}并${link("model", "发布图模型")}。</p>`],
      ],
    },
    sources: {
      title: "连接数据",
      description: "为 GraphLake 提供只读访问，用已有的数据表、数仓视图或文件定义实体与关系。",
      sections: [
        ["choose", "选择连接器", ({ ref }) => `
<dl class="plain-list">
  <dt>数据库</dt><dd>PostgreSQL、MySQL、MariaDB、SQLite、SQL Server、Oracle、MongoDB、DuckDB、TiDB 和 OceanBase（MySQL 模式）。</dd>
  <dt>数仓与湖仓</dt><dd>Snowflake、BigQuery、ClickHouse、Trino、Spanner、SAP HANA、Databricks SQL、Apache Doris、StarRocks、Iceberg 和 Delta Lake。</dd>
  <dt>文件与对象存储</dt><dd>CSV、JSON Lines 和 Parquet。可配置 S3、MinIO、OSS、TOS、COS、Azure Blob Storage 或 GCS，浏览对象并映射文件。</dd>
</dl>
<p>Oracle 直连需要在服务端安装 Oracle Instant Client。也可以通过已配置的 Trino catalog 访问 SQL Server、Oracle、Hive、Hudi、MongoDB、Elasticsearch 和 Redshift。配置细节与支持的类型见${ref("docs/reference.zh-CN.md#图映射与连接器", "连接器参考")}。</p>`],
        ["configure", "在工作台添加数据源", () => `
<ol>
  <li>在模型草稿中打开<strong>数据源</strong>（Data Sources），选择连接器。</li>
  <li>填写连接设置，或将文件路径映射到表名。凭据填写 GraphLake 服务端已配置的环境变量名。</li>
  <li>选择<strong>添加到草稿</strong>（Add to draft）并保存。浏览表与字段，确认模型需要的列。</li>
</ol>
<p>为 GraphLake 分配目标表或视图的只读凭据。文件路径以服务端为准。CSV 和 JSON Lines 需显式声明列类型，Parquet 可读取文件本身的结构。</p>`],
        ["next", "确定实体和关系表", ({ link }) => `
<p>找出能稳定标识每种实体的键，以及将实体相连的列，再${link("model", "建立图模型")}。若查询可以接受定时刷新，也可以先把选定列加载为${link("local-tables", "本地 Parquet 副本")}。</p>`],
      ],
    },
    model: {
      title: "建立图模型",
      description: "把实体映射为节点，把关联映射为有向边，发布后团队即可查询。",
      sections: [
        ["keys", "定义节点和边的键", ({ code, ref }) => `
<p>为每个节点标签选择稳定的行标识。如果账号 ID 在不同租户中重复，将租户 ID 纳入复合键。边的起点和终点列必须按相同顺序对应完整的节点键。</p>
<p>下面的映射片段使用 PostgreSQL 中的账户表和 Parquet 中的转账表。查询可返回 <code>amount</code> 和 <code>event_time</code>，也可用它们做过滤。</p>
${code("YAML", mapping)}
<p>在${ref("examples/finance.yaml", "完整示例")}中查看数据源定义，并按实际环境替换连接设置。</p>`],
        ["publish", "保存、校验并发布", ({ link }) => `
<ol>
  <li>在<strong>图模型</strong>（Graph Models）中创建模型，${link("sources", "添加数据源")}后配置节点标签和边类型。</li>
  <li>保存草稿并校验。如果发现列缺失、类型不匹配、键重复或边端点无法解析，检查来源表和键映射。</li>
  <li>准备好后发布草稿，用<strong>查询</strong>（Query）在生效版本上运行一条结果已知的小查询。</li>
</ol>`],
        ["versions", "管理模型版本", ({ ref }) => `
<p>编辑草稿时，查询仍使用已发布的版本。有发布权限的用户可在版本历史比较变更、回退到归档版本或将模型下线。模型回退会切换映射。需要恢复源数据时，请使用独立的数据快照。</p>
<p>多表映射、过滤及业务时间规则见${ref("docs/reference.zh-CN.md#多表图映射与业务时间", "模型参考")}。</p>`],
      ],
    },
    query: {
      title: "查询与探索",
      description: "运行只读图查询，在浏览器中检查路径，需要完整结果时导出。",
      sections: [
        ["run", "选择已发布的模型", ({ code, link }) => `
<p>打开<strong>查询</strong>（Query），选择已发布模型和 Cypher、SQL 或 Gremlin。在${link("quickstart", "Parquet 示例")}中，下面的 Cypher 查询按目标账户汇总两跳转账。</p>
${code("Cypher", cypher)}
<p>查询选项支持超时和 Cypher 参数。结果中包含模型版本和来源版本，复现结果时可以据此核对。</p>`],
        ["graph", "查看路径与邻居", ({ code }) => `
<p>返回路径或图对象后，在图视图选择节点或边查看属性。展开节点可查看邻居，并按需加载更多批次。标量结果可在表格视图查看。</p>
${code("Cypher", graphQuery)}`],
        ["export", "处理大结果集", ({ ref }) => `
<p>工作台显示有界预览。无需继续的查询可以取消。需要完整结果时，使用具备查询和导出权限的账号开启完整结果捕获，下载 Arrow IPC。探索大图时使用过滤条件、跳数限制与资源限制。</p>
<p>应用可使用 HTTP、Bolt、Gremlin WebSocket、CLI 或嵌入式 Rust。更多信息见${ref("docs/reference.zh-CN.md#查询语义与资源控制", "查询语义与协议")}和${ref("docs/reference.zh-CN.md#整图算法", "整图算法")}，包括最短路径、PageRank、社区发现等。</p>`],
      ],
    },
    "local-tables": {
      title: "本地表与同步",
      description: "将选定列加载为受管理的 Parquet 副本，让可接受定时更新的查询读取本地表。",
      sections: [
        ["load", "加载副本并发布映射", ({ image }) => `
<ol>
  <li>管理员先在模型草稿中保存外部来源，再打开<strong>本地表</strong>（Local Tables）。</li>
  <li>选择源表和模型所需字段，包含主键与边端点，然后创建并加载。</li>
  <li>任务成功后将副本加入模型数据源。把映射指向 <code>local_&lt;名称&gt;.data</code>，校验草稿并发布。</li>
</ol>
<figure>${image("local-tables", "本地表面板展示转账表加载成功和下一次定时刷新")}<figcaption>切换模型映射前，确认副本就绪并检查加载历史。</figcaption></figure>`],
        ["refresh", "选择刷新方式", () => `
<dl class="plain-list">
  <dt>全量刷新</dt><dd>重新读取选定字段并发布新快照，可反映源表物理删除和主键变更。</dd>
  <dt>增量刷新</dt><dd>配置稳定、唯一、非空的主键，选择整数、日期或时间戳作为水位字段。每次插入或更新都要推进水位。GraphLake 重读水位边界并按主键覆盖。</dd>
  <dt>定时刷新</dt><dd>全量和增量都可以定时执行，可查看最近一次成功刷新和下次运行时间。首次加载为全量。</dd>
</dl>
<p class="note"><strong>数据新鲜度</strong> 增量刷新按水位读取。源表删除和低于已提交水位的迟到数据，需用全量刷新对账。</p>`],
        ["recovery", "维护快照", ({ ref }) => `
<p>加载在发布前失败时，上一份已提交副本仍可读取。备份完整 catalog，包括 <code>.graphlake-local/</code>。Worker 读取副本时必须能访问同一绝对路径。恢复、存储和并发限制见${ref("docs/local-tables.zh-CN.md", "本地表参考")}。</p>`],
        ["managed", "在 HA 集群使用托管快照", ({ code, link }) => `
<p>在${link("cluster", "启用 Coordinator 故障接管的集群")}中，通过共享集群配置开启托管本地表。Coordinator 和 Worker 使用同一 etcd 命名空间与 S3 兼容存储前缀，Worker 可直接从对象存储读取托管快照。</p>
${code("YAML", "managed_local_tables: true\nlocal_snapshot_retention_seconds: 86400\nlocal_snapshot_gc_grace_seconds: 300")}
<p>新建并加载托管表，将模型切换到 <code>local-table://&lt;表 UUID&gt;</code> 引用并发布。迁移期间已有映射可继续读取文件副本。GraphLake 回收符合条件的旧代次，并保留查询或备份仍在使用的快照。桶生命周期规则适用于未完成的分段上传和非当前对象版本，活跃对象由 GraphLake 管理。</p>`],
      ],
    },
    mcp: {
      title: "连接 AI 客户端",
      description: "通过模型上下文协议（MCP），让 AI 客户端查询已发布的模型，或执行获准的建模操作。",
      sections: [
        ["enable", "开启所需的 MCP 服务", () => `
<p>管理员在<strong>运行配置 → MCP 服务</strong>中分别启用查询和建模。两项服务默认关闭。需要通过客户端发布时，再开启发布权限。</p>
<dl class="plain-list">
  <dt><code>/mcp/query</code></dt><dd>列出可见模型，获取已发布的结构，执行有界的只读查询。</dd>
  <dt><code>/mcp/modeling</code></dt><dd>读取、校验、创建和保存获准的草稿。发布需要服务端开启且账号具备发布权限。</dd>
</dl>`],
        ["connect", "在客户端注册 GraphLake", ({ code }) => `
<p>在控制台打开 <strong>AI</strong>，生成个人令牌并存入客户端的凭据配置。按需为每个服务添加一项 Streamable HTTP MCP 配置。将示例域名替换为 GraphLake 对外的 HTTPS 地址，在 <code>Authorization</code> 请求头中使用令牌。</p>
${code("JSON", mcpConfig)}
<p>令牌沿用所属账号当前的模型权限与租户范围。管理员也可为允许接入 MCP 的成员签发令牌。在 AI 工作区测试连接，核对认证身份和可见工具。</p>`],
        ["use", "发起第一次请求", ({ ref }) => `
<p>请客户端先列出有权访问的模型，再查看其已发布结构并执行一条小查询。建模时先读取当前草稿和版本，校验并保存，审核后再发布。角色检查、令牌轮换和查询限制见${ref("docs/mcp.md", "MCP 参考")}。</p>`],
      ],
    },
    "use-cases": {
      title: "使用场景",
      description: "先明确要回答的关系问题，再决定映射哪些表、如何查询和检查结果。",
      sections: [
        ["funds", "交易调查", ({ code, link }) => `
<p><strong>问题</strong> 从一个账户出发，资金经过两笔转账到达了哪些账户？</p>
<p>把账户映射成 <code>Account</code> 节点，把转账映射成带金额和时间的 <code>Transfer</code> 边。使用包含租户的键，按路径数或金额找出重点账户，再检查每条转账路径和时间。</p>
${code("Cypher", cypher)}
<p>这条查询可在${link("quickstart", "内置 Parquet 示例")}中运行。</p>`],
        ["dependencies", "服务变更影响分析", ({ code, link }) => `
<p><strong>问题</strong> 哪些服务依赖即将变更的组件？</p>
<p>把服务清单映射为 <code>Service</code> 节点，把调用或声明的依赖映射为从调用方指向被依赖方的 <code>DEPENDS_ON</code> 边，保留归属团队和环境属性。以下查询使用示例模型查找距 <code>payments</code> 最多三跳的依赖路径。</p>
${code("Cypher", "MATCH p = (s:Service)-[:DEPENDS_ON*1..3]->(target:Service)\nWHERE target.name = 'payments'\nRETURN p LIMIT 100")}
<p>使用实际服务清单前，先${link("model", "配置节点和边的键映射")}。</p>`],
        ["lineage", "数据血缘", ({ code, link }) => `
<p><strong>问题</strong> 一张报表由哪些上游数据集生成？</p>
<p>把目录条目映射成 <code>Dataset</code> 节点，把血缘记录映射成从输出指向输入的 <code>DERIVED_FROM</code> 边，并保留作业或流水线标识。以下查询基于示例模型，从日报表向上追溯最多四跳。</p>
${code("Cypher", "MATCH p = (report:Dataset)-[:DERIVED_FROM*1..4]->(:Dataset)\nWHERE report.name = 'daily_revenue'\nRETURN p LIMIT 100")}
<p>在${link("query", "图视图")}检查每条路径，与数据集负责人核实结果。</p>`],
      ],
    },
    ...operations,
    deploy: {
      title: "部署与运维",
      description: "选择部署方式，并在接入业务流量前验证服务健康、访问权限和恢复流程。",
      sections: [
        ["topology", "选择部署方式", ({ link }) => `
<dl class="plain-list">
  <dt>单机服务</dt><dd>${link("install", "安装一个 graphlake-admin 进程")}，提供浏览器、HTTP 及可选的 Bolt、Gremlin 入口。</dd>
  <dt>分布式服务</dt><dd>使用 Coordinator 和私有 Worker 执行受支持的分布式操作。各节点保持相同构建版本，并能访问映射数据。</dd>
  <dt>Coordinator 故障接管</dt><dd>使用 etcd 选主、S3 兼容存储共享控制状态，在 TLS 入口探测当选的 Coordinator。</dd>
</dl>
<p>配置、启动、HA 和验收步骤见${link("cluster", "集群安装指南")}。</p>`],
        ["access", "配置入口与权限", ({ ref }) => `
<p>多人使用浏览器时，配置 HTTPS 反向代理，把 <code>--public-url</code> 设置为浏览器使用的确切源地址。按模型分配查询、导出、建模、发布和审计权限。应用驱动使用角色化服务账号，AI 客户端使用受权限约束的个人令牌。</p>
<p>数据库凭据保存在服务端环境配置。代理请求头和各协议的配置见${ref("deploy/README.md", "服务与客户端参考")}。</p>`],
        ["health", "检查健康与数据访问", ({ link }) => `
<p>通过 <code>/healthz</code> 查看运行构建，使用 <code>/readyz</code> 检查就绪状态。在运行健康界面探测已发布模型的来源和 Worker，并通过业务入口运行结果已知的查询。按需采集 Prometheus 指标、审计事件和 OpenTelemetry 信号。</p>
<p>探测及遥测配置见${link("monitoring", "监控指南")}。</p>`],
        ["recover", "升级、回退与恢复", ({ link, ref }) => `
<p>备份 catalog 和凭据配置，保留旧程序。停止单机服务，把新发行包解压到独立目录，按需切换 <code>current</code> 与 systemd 单元后启动。检查运行版本、模型版本和已知查询；回退时切回旧程序，必要时恢复配套的 catalog。</p>
<p>异地恢复点应绑定控制状态、PostgreSQL 和 Parquet 快照及预期查询结果。在目标站点的 <code>/recovery</code> 页面导入恢复点，通过验收后再接入流量。保留控制归档引用的本地表文件。单机部署另行备份 catalog。</p>
<p>详细步骤见${ref("docs/deployment.md#upgrade-and-rollback", "升级指南")}与${link("recovery", "备份与恢复指南")}。</p>`],
      ],
    },
  },
};
