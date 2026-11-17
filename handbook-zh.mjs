import troubleshoot from "./troubleshooting-zh.mjs";
import {
  boltClient, components, downloadSample, followPath, gremlinClient,
  httpClient, outgoingCounts, pageRank, route, runSample, sampleCatalog, sampleWorkbench, transferTotals,
  twoHopTraversal,
} from "./handbook-examples.mjs";

export default {
  docs: {
    title: "文档指南",
    description: "从样例图开始，再接入数据、发布模型，在控制台或应用中运行查询。",
    sections: [
      ["start-here", "先试用 GraphLake", ({ link }) => `
<ul class="task-list">
  <li><strong>${link("first-model", "构建第一个图")}</strong> 用 Linux 命令行读取小型 CSV 和 JSON Lines 文件，并核对查询结果。</li>
  <li><strong>${link("quickstart", "体验 Parquet 工作台")}</strong> 从源码构建，在浏览器里查看转账图。</li>
  <li><strong>${link("install", "安装 Linux 服务")}</strong> 校验安装包、启动服务并登录。</li>
</ul>`],
      ["model-and-query", "建模与查询", ({ link }) => `
<ul class="task-list">
  <li><strong>${link("concepts", "理解图模型")}</strong> 了解数据源、业务键、关系与发布版本之间的联系。</li>
  <li><strong>${link("sources", "接入自己的数据")}</strong> 选择连接器、查看字段，决定直接查询或加载本地副本。</li>
  <li><strong>${link("datasources", "浏览数据源目录")}</strong> 查找直连、经 Trino 接入和对象存储的配置方式。</li>
  <li><strong>${link("local-tables", "同步本地副本")}</strong> 配置全量或增量刷新，并查看加载历史。</li>
  <li><strong>${link("model", "在控制台建立图模型")}</strong> 跟着画布教程配置业务键和端点，再发布模型。</li>
  <li><strong>${link("query", "使用查询与图探索工作台")}</strong> 设置 Cypher 参数、切换结果视图，并展开节点的邻居。</li>
  <li><strong>${link("query-recipes", "运行查询示例")}</strong> 用 Cypher 查路径、用 SQL 汇总、用 Gremlin 遍历。</li>
  <li><strong>${link("algorithms", "运行图算法")}</strong> 比较路径成本、排序节点或识别连通群组。</li>
</ul>`],
      ["integrate-and-operate", "应用接入与运维", ({ link }) => `
<ul class="task-list">
  <li><strong>${link("clients", "接入应用")}</strong> 通过 HTTP 查询指定模型版本，或使用 Bolt 和 Gremlin 驱动。</li>
  <li><strong>${link("access", "配置权限")}</strong> 为分析人员、服务账号或 AI 客户端授予所需权限。</li>
  <li><strong>${link("mcp", "连接 AI 客户端")}</strong> 开启 MCP 服务、签发个人令牌，并验证客户端可用的工具。</li>
  <li><strong>${link("cluster", "安装集群")}</strong> 启动 Worker，配置 Coordinator 故障接管并验证业务入口。</li>
  <li><strong>${link("monitoring", "监控运行状态")}</strong> 检查模型、数据源和 Worker，配置日志与遥测。</li>
  <li><strong>${link("recovery", "备份和恢复")}</strong> 创建恢复点，在目标站恢复并核对业务结果后切流。</li>
  <li><strong>${link("troubleshoot", "定位故障")}</strong> 排查数据源连接、同步、查询、Worker 和备份恢复故障。</li>
</ul>`],
    ],
  },
  concepts: {
    title: "核心概念",
    description: "理解图模型如何映射数据、发布后何时生效，以及一次查询读取的是哪一份数据。",
    sections: [
      ["sources", "来源、表与图模型", ({ link }) => `
<p><strong>数据源</strong>是 GraphLake 可读取的连接或文件集合。<strong>表</strong>是来源中具名的输入。<strong>图模型</strong>将一个或多个输入表中的行映射成节点和有向关系。</p>
<p>例如，PostgreSQL 的账户表定义 <code>Account</code> 节点，Parquet 中的转账表定义 <code>Transfer</code> 边。边的来源列和目标列引用账户的业务键，把两份数据连接起来。</p>
<p>需要直接查询时参见${link("sources", "连接数据")}，需要定时刷新 Parquet 副本时参见${link("local-tables", "本地表与同步")}。</p>`],
      ["identity", "键、端点和属性", ({ link }) => `
<dl class="plain-list">
  <dt>节点标签</dt><dd>用于区分节点类型，例如 <code>Account</code>。业务键在同一标签内标识一个节点。</dd>
  <dt>关系类型</dt><dd>用于区分有向连接，例如 <code>Transfer</code>。起点和终点列按顺序对应两端节点的完整业务键。</dd>
  <dt>属性</dt><dd>用于展示、筛选和汇总的映射列，例如 <code>amount</code>。不同转账号能区分同一对账户间的多笔转账。</dd>
</dl>
<p>账号 ID 在各租户间重复时，使用 <code>[tenant_id, account_id]</code> 这样的复合键。边的两端都应包含租户列，类型也要一致。可在${link("first-model", "第一个图模型")}中试用这套映射方法。</p>`],
      ["versions", "草稿、已发布版本与数据新鲜度", ({ link }) => `
<p>草稿用于编辑和校验。发布后，客户端才能查询生效版本。响应会记录模型版本和来源信息。回退仅切换已发布的映射，源数据仍由来源系统管理。</p>
<p>本地表读取最近成功发布的副本。CSR 索引对应构建时的图范围和来源状态。查询需要最新数据时，先核对本地表和 CSR 的新鲜度，再选择执行范围。</p>
<p>发布步骤见${link("model", "建立图模型")}，CSR 的使用见${link("algorithms", "图算法")}。</p>`],
    ],
  },
  "first-model": {
    title: "构建第一个图",
    description: "用已安装的 Linux 命令行和两个小文件，把账户和转账映射成图，并核对查询结果。",
    sections: [
      ["files", "1. 获取样例文件", ({ code, link, asset }) => `
<p>先完成${link("install", "Linux 安装")}。本例将三个文件放在同一个目录，无需准备数据库。</p>
<ul class="task-list">
  <li>${asset("examples/transfer/accounts.csv", "accounts.csv")} 包含 Alice、Bob、Carol 三个账户。</li>
  <li>${asset("examples/transfer/transfers.jsonl", "transfers.jsonl")} 包含两笔有方向的转账。</li>
  <li>${asset("examples/transfer/graph.yaml", "graph.yaml")} 将文件定义为一个节点标签与一个关系类型。</li>
</ul>
${code("Shell", downloadSample)}`],
      ["mapping", "2. 读懂映射", ({ code }) => `
<p><code>files</code> 按 <code>graph.yaml</code> 所在目录解析。业务键和端点声明为 <code>Int64</code>，金额用 <code>Decimal128(18, 2)</code>。CSV 列的声明顺序与表头一致。</p>
<details class="example-details"><summary>查看完整 graph.yaml</summary>
${code("YAML", sampleCatalog)}
</details>
<p><code>src</code> 和 <code>dst</code> 都指向 <code>Account.id</code>。转账本身的 <code>id</code> 标识这条边。同一对账户可以有多条边，只要每笔转账的 ID 不同。</p>`],
      ["verify", "3. 核对已知结果", ({ code, link }) => `
<p>在样例目录中查询账户 <code>1</code> 的转出记录。将账户 ID 作为参数，方便复用同一查询。</p>
${code("Shell", runSample)}
<p class="note"><strong>预期结果</strong> Alice 向 Bob 转了 <code>12.25</code>。把 <code>account_id</code> 改成 <code>3</code>，应看到 Carol 没有转出记录。</p>
<p>成功后，继续用这套数据运行${link("query-recipes", "查询示例")}。</p>`],
      ["publish", "4. 在控制台查看模型", ({ code, link }) => `
<p>继续在同一个终端中，把样例目录用作独立 catalog。初始化一次管理员密码，再将安装包自带的控制台启动在 <code>7347</code> 端口。</p>
${code("Shell", sampleWorkbench)}
<ol>
  <li>打开 <a href="http://127.0.0.1:7347/">http://127.0.0.1:7347</a>，以 <code>admin</code> 登录。服务在远程主机时，通过 SSH 转发 <code>7347</code> 端口。</li>
  <li>在<strong>图模型</strong>中确认 <code>graph</code> 已发布。打开<strong>查询</strong>，粘贴前面的 Cypher，在<strong>查询选项</strong>中填入 <code>{"account_id":1}</code>。</li>
</ol>
<p>可以继续阅读${link("model", "画布建模教程")}，手动完成同一套映射，也可以${link("sources", "连接自己的数据")}。发布生产映射前，先核对业务键的类型和样例行。</p>`],
    ],
  },
  "query-recipes": {
    title: "查询示例",
    description: "在同一个转账图上运行 Cypher、SQL 和 Gremlin，并用已知结果确认每种查询的行为。",
    sections: [
      ["setup", "准备样例模型", ({ link }) => `
<p>使用${link("first-model", "第一个图模型")}的 CSV 和 JSON Lines 文件，在发布模型的<strong>查询</strong>工作区运行示例。使用命令行时，通过 <code>--language</code> 选择语言，通过 <code>--parameters</code> 提供 Cypher 参数。</p>
<p>遇到 <code>$account_id</code> 时，在<strong>查询选项</strong>填入 <code>{"account_id":1}</code>。</p>`],
      ["paths", "用 Cypher 查两跳路径", ({ code }) => `
<p>指定起始账户，返回一个命名路径。在图视图中可以展开路径并查看每一条边的属性。</p>
${code("Cypher", followPath)}
<p class="note"><strong>预期结果</strong> Alice → Bob → Carol，共两条转账边。</p>`],
      ["counts", "保留没有转出记录的账户", ({ code }) => `
<p>用 <code>OPTIONAL MATCH</code> 保留没有匹配到出边的账户。统计关系变量，空匹配就不会计为一条转账。</p>
${code("Cypher", outgoingCounts)}
<p class="note"><strong>预期结果</strong> Alice 1 笔，Bob 1 笔，Carol 0 笔。</p>`],
      ["sql", "用 SQL 汇总映射后的边", ({ code }) => `
<p>选择 SQL，直接查询映射的关系类型。用双引号保留图表名的大小写。</p>
${code("SQL", transferTotals)}
<p class="note"><strong>预期结果</strong> 2 笔转账，合计 <code>37.75</code>。</p>`],
      ["gremlin", "用 Gremlin 向外遍历", ({ code, link }) => `
<p>选择 Gremlin，从完整业务键 <code>1</code> 开始，沿出方向的 <code>Transfer</code> 边走两步。</p>
${code("Gremlin", twoHopTraversal)}
<p class="note"><strong>预期结果</strong> Carol。</p>
<p>如何查看图结果、继续加载和导出 Arrow，参见${link("query", "查询与探索")}。</p>`],
    ],
  },
  algorithms: {
    title: "图算法",
    description: "选择图范围，在样例上运行算法，并理解结果和资源占用。",
    sections: [
      ["choose", "按问题选择算法和图范围", ({ link }) => `
<dl class="plain-list">
  <dt>最短路径</dt><dd>寻找两个已知端点之间成本较低的路线，成本可以是跳数，也可以是映射后的数值边属性。</dd>
  <dt>PageRank</dt><dd>在有向图上综合入边和对应源节点的分配权重，对节点进行排序。</dd>
  <dt>弱连通分量</dt><dd>忽略边方向，找出彼此连通的节点组。</dd>
  <dt>社区与向量</dt><dd>用 Louvain 或 Leiden 划分社区，用 Node2Vec 为节点生成向量特征。</dd>
</dl>
<p>执行前确定边类型、方向和权重。使用权重时，各候选边类型都要映射该字段且取值满足算法要求。以下示例使用${link("first-model", "三个账户的样例图")}。</p>`],
      ["rank", "用 PageRank 排序账户", ({ code }) => `
${code("Cypher", pageRank)}
<p>应返回三个账户及其分数。比较同一个图投影里的分数。选择另一种边或方向时，计算所用的图也会改变。</p>`],
      ["components", "找出连通群组", ({ code }) => `
${code("Cypher", components)}
<p>Alice、Bob 和 Carol 属于同一个连通分量。对比分量标识即可判断节点是否同组。如需判断某个方向是否可达，再执行路径查询。</p>`],
      ["route", "查找加权路线", ({ code }) => `
<p>在样例目录执行下方命令。此处用转账金额演示如何指定成本字段。</p>
${code("Shell", route)}
<p class="note"><strong>预期结果</strong> 从账户 <code>1</code> 到 <code>3</code> 有一条两跳路线，精确成本为 <code>37.75</code>。</p>`],
      ["csr", "选择在线数据或 CSR 代次", ({ link, ref }) => `
<p>重复遍历时，管理员或具备发布权限的成员可为已发布模型构建 CSR 代次，也就是压缩后的邻接快照。在<strong>查询选项</strong>中选择代次前，核对它的图范围和来源状态。需要反映数据或范围的变更时，重新构建。</p>
<p>${link("cluster", "集群")}上的部分 PageRank 和弱连通分量任务可使用分区 CSR。社区检测和 Node2Vec 在执行节点上使用完整投影。支持的操作、内存预算和权重约束见${ref("docs/reference.zh-CN.md#整图算法", "算法参考")}。</p>`],
    ],
  },
  clients: {
    title: "接入应用",
    description: "通过 HTTP API、Bolt 驱动或 Gremlin WebSocket 客户端运行只读查询。",
    sections: [
      ["prepare", "为应用准备身份", ({ link }) => `
<ol>
  <li>发布目标模型并记下 ID。下方代码使用${link("first-model", "样例")}中的 <code>graph</code>。</li>
  <li>在<strong>权限管理</strong>中创建专用服务账号，例如 <code>analytics</code>，用 <code>openssl rand -hex 32</code> 生成令牌，再分配该模型的查询权限。参见${link("access", "用户与权限")}。</li>
  <li>在客户端进程中从密钥存储读取 <code>GRAPHLAKE_TOKEN</code>，并将 <code>GRAPHLAKE_ORIGIN</code> 设为服务的 HTTPS 源地址。本机样例使用 <code>http://127.0.0.1:7347</code>。</li>
</ol>`],
      ["http", "通过 HTTP 查询指定版本", ({ code }) => `
<p>保存下方 Python 3 脚本，在已配置环境变量的客户端运行。它先读取模型的 <code>active_revision</code>，再带上唯一请求 ID、该版本和查询语句。<code>parameters_json</code> 是包含 Cypher 参数的 JSON 字符串。</p>
${code("Python", httpClient)}
<p class="note"><strong>预期结果</strong> 样例返回 <code>[['Alice']]</code>。HTTP 预览以字符串或 null 表示单元格，响应还包含模型版本、来源信息和截断状态。</p>
<p>需要完整结果时，同时授予查询和导出权限。把 <code>capture_result</code> 设为 <code>true</code>，确认 <code>snapshot_complete</code> 后，在快照有效期内访问 <code>GET /api/v1/models/{id}/results/{snapshot}</code>。</p>`],
      ["bolt", "通过 Bolt 驱动读取", ({ code, ref }) => `
<p>用 <code>--driver-model graph --bolt-port 7687</code> 启用监听，并按${ref("deploy/README.md#客户端接入", "客户端配置")}设置 TLS。生产连接使用 <code>bolt+s://</code> 直连 URI，通过驱动的数据库参数选择已发布模型。</p>
${code("Python · neo4j", boltClient)}
<p>发行版驱动验证使用 <code>neo4j==5.28.2</code>。已支持的来源可以使用自动提交。显式只读事务支持 PostgreSQL 和 Parquet。客户端版本按发行版协议参考选择。</p>`],
      ["gremlin", "通过 Gremlin WebSocket 读取", ({ code }) => `
<p>用 <code>--driver-model graph</code> 启用 Gremlin 并选定默认模型。HTTPS 代理须转发 <code>/gremlin</code> 上的 WebSocket 升级请求。遍历源名称可指定获准的模型。</p>
${code("Python · gremlinpython", gremlinClient)}
<p>本例使用 <code>gremlinpython==3.7.4</code>，打印 Alice、Bob 和 Carol。使用支持的只读遍历，以及 GraphSON 3 或 GraphBinary 1.0 编码器。</p>`],
      ["errors", "处理版本与权限错误", ({ link }) => `
<p>如果模型在发现后已重新发布，先读取当前的生效版本，确认映射符合预期后再用新的请求 ID 执行只读查询。收到 <code>401</code> 时检查账号和令牌。收到 <code>403</code> 时检查模型权限和租户范围。长查询失败时，先确定服务是否就绪、来源是否可读，再重试。</p>
<p>AI 客户端使用 ${link("mcp", "MCP")}。服务或来源异常参见${link("troubleshoot", "故障排查")}。</p>`],
    ],
  },
  access: {
    title: "用户与权限",
    description: "为控制台用户、应用服务账号和 AI 客户端配置它们实际需要的模型权限。",
    sections: [
      ["identities", "按接入方式选择身份", ({ link }) => `
<dl class="plain-list">
  <dt>成员</dt><dd>使用个人账号操作控制台。控制台登录和 MCP 接入可以单独管理。</dd>
  <dt>服务账号</dt><dd>为每个应用分配独立令牌和模型角色。${link("clients", "HTTP、Bolt 和 Gremlin 客户端")}使用 <code>svc/&lt;名称&gt;</code> 作为用户名。</dd>
  <dt>个人 MCP 令牌</dt><dd>${link("mcp", "AI 客户端")}沿用令牌所有者的模型权限与租户范围。</dd>
</dl>`],
      ["roles", "给用户分配指定模型的权限", ({ image, link }) => `
<ol>
  <li>用管理员账号登录，在<strong>权限管理 → 成员</strong>点击<strong>新建成员</strong>，或编辑已有成员。新建时选<strong>人工账号</strong>，填写用户名和初始密码。按需要设置<strong>允许登录控制台</strong>和<strong>允许接入 MCP</strong>，点击<strong>保存成员</strong>。</li>
  <li>进入<strong>角色列表 → 新建角色</strong>，或编辑已有角色。填写角色名称，在<strong>加入角色的成员</strong>中勾选目标用户。</li>
  <li>在<strong>按模型授权</strong>区域按模型标识找到目标，勾选所需操作。截图中的 <code>demo-analyst</code> 获得 <code>transfer-demo</code> 的<strong>查询</strong>和<strong>建模</strong>权限。点击<strong>保存角色</strong>。</li>
  <li>在角色列表核对成员、模型和操作，再用该成员登录，在${link("query", "查询工作台")}运行一条小查询。启用 MCP 后，也可在<strong>AI → 我的权限</strong>核对可访问的模型与能力。角色变更后，受影响的控制台成员需要重新登录。</li>
</ol>
<figure>${image("access-model-role", "英文角色配置界面为 demo-analyst 勾选 transfer-demo 的 Query 和 Modeling 权限")}<figcaption>在同一角色内勾选成员和该模型允许的操作。</figcaption></figure>`],
      ["actions", "选择模型允许的操作", ({ link }) => `
<dl class="plain-list">
  <dt>查询和导出</dt><dd>查询权限允许查看结构、查询和探索。完整 Arrow 导出要求同一模型同时具备查询和导出权限。</dd>
  <dt>建模和发布</dt><dd>建模者在已批准的数据源范围内编辑和校验草稿。发布权限控制激活、回退或下线模型。管理员负责连接器配置和物理表范围。</dd>
  <dt>只读审计</dt><dd>查看模型配置和版本历史。</dd>
</dl>
<p>成员需要通过 MCP 创建模型时，在<strong>预授权新模型标识</strong>填入目标标识并点击<strong>添加模型授权</strong>。目标标识和现有模板模型都需要建模权限。工具发现与授权的关系见${link("mcp", "MCP 指南")}。</p>`],
      ["tenants", "按租户限制可读数据", () => `
<p>勾选模型的<strong>查询</strong>权限后，展开<strong>限定租户范围</strong>。例如将<strong>租户字段</strong>填为 <code>tenant_id</code>，将<strong>租户值（JSON）</strong>填为 <code>1</code>，再保存角色。相关节点、边的业务键以及边的两端都须包含同一字段，且类型一致。GraphLake 在受支持的查询、探索和导出入口应用该范围。</p>
<p>同一模型出现相互冲突的租户值时会拒绝查询。需要隔离敏感字段时，使用数据库视图或独立的模型投影。共享 CSR 代次供无租户范围限制的查询使用。</p>`],
      ["rotate", "轮换凭据并验证", ({ ref }) => `
<p>在服务账号设置中轮换应用令牌。更新密钥存储并重新连接，再确认旧令牌无法访问。角色变更可能使已有会话、连接和下载票据失效。</p>
<p>旧版服务账号文件、企业登录和审计说明见${ref("deploy/README.md#用户与角色", "权限管理参考")}。</p>`],
    ],
  },
  troubleshoot,
};
