import {
  cyberInvestigation, cyberParameters, cypher, download, generateDemo, graphQuery, install, mapping, mcpConfig,
  packagesList, release, runDemo, start, workbench,
} from "./examples.mjs";
import operations from "./operations-zh.mjs";
import handbook from "./handbook-zh.mjs";
import { datasourcePage } from "./datasources.mjs";
import { directTransfers, postgresSource, syncDemoSetup, syncDemoUpdate, workbenchPath } from "./handbook-examples.mjs";

const workbenchAlt = "GraphLake 查询工作台，展示 Parquet 示例中的三个账户及其转账关系";

export default {
  ui: {
    product: "只读图分析", overview: "产品概览", docs: "文档", language: "English",
    primary: "主导航", start: "入门", guides: "使用指南", integration: "应用接入与权限", operations: "运维",
    breadcrumb: "当前位置", contents: "文档导航", onPage: "本页目录", previous: "上一篇", next: "下一篇",
    search: "搜索文档", searchAction: "搜索", searchHint: "例如 CSR、Bolt 或 source_unavailable",
    searchEmpty: "未找到匹配指南。试试更短的关键词。", searchMatches: "找到 {count} 篇相关指南",
    skip: "跳转到正文", copy: "复制", copied: "已复制", copyError: "请手动复制",
    footer: "资源", release: "发行说明",
  },
  home: {
    title: "在现有数据上<br class=\"wide-break\"><span class=\"hero-accent\">做图分析</span>",
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
      "cyber-investigation": "从登录告警出发，关联同一会话的进程启动与网络连接。",
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
        ["generate", "1. 生成示例数据", ({ code, link }) => `
<p>安装 Git、Rust 1.95 或更高版本及 C/C++ 工具链。使用浏览器工作台还需 Node.js 24。内置示例会在临时 catalog 中生成三个账户、四笔转账和一份图映射。</p>
<p>如果已安装 Linux 发行包，也能${link("first-model", "用包内二进制运行文件样例")}。</p>
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
    datasources: datasourcePage(true),
    sources: {
      title: "连接数据",
      description: "为 GraphLake 提供只读访问，用已有的数据表、数仓视图或文件定义实体与关系。",
      sections: [
        ["choose", "选择连接器", ({ link }) => `
<p>在${link("datasources", "数据源目录")}查找数据库、数仓、湖仓表或文件存储对应的连接器，了解必填配置和运行依赖。</p>`],
        ["configure", "在工作台添加数据源", ({ image }) => `
<p>使用管理员账号登录。要跟着截图操作，先<a href="#sqlite-demo">准备 SQLite 样例</a>，再添加连接。</p>
<ol>
  <li>在控制台打开<strong>数据源</strong>（Data Sources），选中要配置的模型。点击<strong>添加数据源</strong>，搜索连接器，再点其卡片上的<strong>配置</strong>。模型尚未保存时，从建模指引中的<strong>添加数据源</strong>进入。</li>
  <li>填写模型内唯一且不含点号的数据源名称，再填写连接设置或将文件路径映射到表名。使用 SQLite 样例时，数据源名称填 <code>ledger</code>，<strong>数据库文件路径</strong>填 <code>ledger.db</code>。</li>
  <li>点击<strong>添加到草稿</strong>（Add to draft），再点击<strong>保存草稿</strong>。添加后若打开了配置面板，也可在面板内保存。要编辑已有连接，在数据源卡片点击<strong>配置</strong>。</li>
</ol>
<p>为 GraphLake 分配只读凭据，凭据字段填写服务端已配置的环境变量名。文件路径由 GraphLake 服务端解析。CSV 和 JSON Lines 需显式声明列类型，Parquet 文件自带结构。</p>
<figure>${image("source-add", "英文 SQLite 连接配置显示 ledger、ledger.db 和 Add to draft 按钮")}<figcaption>连接器配置完成后，点击 <strong>Add to draft</strong> 添加到模型草稿。</figcaption></figure>`],
        ["sqlite-demo", "准备 SQLite 样例", ({ code }) => `
<p>在 GraphLake 主机上，将 <code>catalog_dir</code> 设为练习环境启动时 <code>--catalog-dir</code> 指定的目录，并确认目录中还没有 <code>ledger.db</code>。安装 <code>sqlite3</code> 后执行下方命令，确保 GraphLake 服务账号有文件读取权限。</p>
${code("Shell", syncDemoSetup)}
<p>样例用 <code>id</code> 区分记录，用 <code>updated_seq</code> 跟踪变更。将 SQLite 数据源添加为 <code>ledger</code> 后，在同步教程中选择 <code>ledger.accounts</code>。</p>`],
        ["browse", "浏览表和字段", ({ image }) => `
<ol>
  <li>在数据源卡片上点击<strong>浏览表与字段</strong>（Browse tables and columns）。若连接器显示模式或命名空间选择器，先选择相应的范围，例如 PostgreSQL 的 <code>public</code>。</li>
  <li>选择<strong>来源表</strong>，在预览中核对<strong>字段</strong>、<strong>类型</strong>和<strong>可为空</strong>。本例中 <code>id</code> 和 <code>updated_seq</code> 都是不可为空的 <code>Int64</code> 字段。</li>
  <li>列表里找不到已知表时，展开<strong>手动查找</strong>，按连接器的命名格式填入<strong>完整表名</strong>，点击<strong>读取字段</strong>。从节点映射、边映射或本地表表单打开浏览器时，可以点击<strong>使用此表</strong>带回所选表。</li>
</ol>
<figure>${image("source-browser", "英文来源表浏览器显示 ledger.accounts 及其三个字段的类型和可空性")}<figcaption>建模或同步前，先核对业务键、端点和水位字段。</figcaption></figure>`],
        ["postgres", "接入 PostgreSQL", ({ code, link }) => `
<ol>
  <li>创建能连接数据库、读取目标表或视图的专用账号。先确认 GraphLake 主机可以访问数据库。</li>
  <li>使用 Linux 安装包时，在 root 持有的 <code>/etc/graphlake/graphlake.env</code> 设置 <code>GRAPHLAKE_LEDGER_DSN</code>，重启服务使环境配置生效。</li>
  <li>在<strong>数据源</strong>中添加 PostgreSQL，填写 DSN 对应的环境变量名。下方是等效的 catalog 配置。</li>
</ol>
${code("YAML", postgresSource)}
<p>浏览 <code>ledger.public.accounts</code> 一类的表，确认键字段和端点列的类型。保存草稿，再${link("model", "映射表并校验模型")}。</p>`],
        ["next", "确定实体和关系表", ({ link }) => `
<p>找出能稳定标识每种实体的键，以及将实体相连的列，再${link("model", "建立图模型")}。若查询可以接受定时刷新，也可以先把选定列加载为${link("local-tables", "本地 Parquet 副本")}。</p>`],
      ],
    },
    model: {
      title: "建立图模型",
      description: "在控制台从两个文件建立账户转账图，在画布上配置节点和有向边，发布后用查询核对结果。",
      sections: [
        ["ui-start", "1. 新建图模型", ({ asset, link }) => `
<p>本教程使用管理员账号登录已启动的 GraphLake 控制台。编辑已有模型时，可以在<strong>图模型</strong>列表直接打开它。能否编辑和发布由${link("access", "模型权限")}决定。尚未启动服务时，参见${link("install", "安装指南")}。</p>
<ol>
  <li>下载 ${asset("examples/transfer/accounts.csv", "accounts.csv")} 和 ${asset("examples/transfer/transfers.jsonl", "transfers.jsonl")}，放到服务启动参数 <code>--catalog-dir</code> 指定的目录。需要独立的练习环境时，可以使用${link("first-model", "第一个图模型教程")}中的样例目录，其中已有这两个文件。</li>
  <li>选择<strong>图模型 → 新建模型</strong>，<strong>名称</strong>填写 <code>Transfer demo</code>，<strong>模型标识</strong>填写 <code>transfer-demo</code>，点击<strong>继续</strong>。API 和客户端可通过模型标识访问该模型。</li>
</ol>`],
        ["ui-sources", "2. 接入两个样例文件", () => `
<p>在建模指引中选择<strong>添加数据源</strong>。添加第二个来源时，从建模工具栏打开<strong>更多工具 → 添加数据源</strong>。模型保存后，可通过<strong>数据源</strong>入口管理连接。</p>
<dl class="plain-list">
  <dt>CSV 账户表</dt><dd>选择 <strong>CSV</strong> 连接器，数据源名称填写 <code>people</code>。在<strong>表映射</strong>中新建 <code>accounts</code>，文件路径填 <code>accounts.csv</code>。按文件顺序声明两列，<code>id</code> 为 <code>Int64</code>，<code>name</code> 为 <code>Utf8</code>。</dd>
  <dt>JSON Lines 转账表</dt><dd>选择 <strong>JSON Lines</strong> 连接器，数据源名称填写 <code>payments</code>。在<strong>表映射</strong>中新建 <code>transfers</code>，文件路径填 <code>transfers.jsonl</code>。将 <code>id</code>、<code>src</code> 和 <code>dst</code> 声明为 <code>Int64</code>，<code>amount</code> 声明为 <code>Decimal128(18, 2)</code>。</dd>
</dl>
<p>使用<strong>添加列</strong>逐项补齐字段。两个表的 <code>id</code> 列都不勾选<strong>允许空值</strong>。每个连接器配置完成后，点击<strong>添加到草稿</strong>。文件路径由 GraphLake 服务端读取。</p>`],
        ["ui-node", "3. 映射 Account 节点标签", () => `
<ol>
  <li>在建模工具栏中选择<strong>添加节点</strong>，名称输入 <code>Account</code>，点击<strong>添加</strong>。</li>
  <li>在<strong>配置详情</strong>中，将<strong>来源表</strong>设为 <code>people.accounts</code>，<strong>业务键</strong>设为 <code>id</code>。业务键须能唯一标识 <code>Account</code> 标签下的账户。</li>
  <li>点击<strong>属性</strong>旁的 <strong>+</strong>，添加 <code>name</code>。需要核对列名或类型时，点击<strong>浏览表与字段</strong>。</li>
</ol>`],
        ["ui-edge", "4. 连线并配置 Transfer 边", ({ image }) => `
<ol>
  <li>选择<strong>连线建边</strong>，先后点击 <code>Account</code>，把它选为起点和终点标签。边类型名称输入 <code>Transfer</code>，点击<strong>创建边</strong>。</li>
  <li>把<strong>来源表</strong>设为 <code>payments.transfers</code>。点击<strong>业务键</strong>旁的 <strong>+</strong> 添加 <code>id</code>，用它唯一标识每笔转账。</li>
  <li>在<strong>端点映射</strong>中，<strong>起点</strong>填写 <code>src</code>，<strong>终点</strong>填写 <code>dst</code>。两处箭头右侧的 <code>id</code> 表示匹配 <code>Account</code> 的业务键列。最后在<strong>属性</strong>中添加 <code>amount</code>。</li>
</ol>
<p>画布显示的是节点标签和边类型。回环表示两端都是 <code>Account</code> 标签。每条转账记录的 <code>src</code> 和 <code>dst</code> 值决定它实际连接哪两个账户。</p>
<figure>${image("model-editor", "英文版 GraphLake 建模画布选中了 Transfer 边，src 和 dst 两个端点字段均映射到 Account.id")}<figcaption>点击画布上的节点或边即可再次打开映射详情，也可以从工具栏的<strong>节点</strong>和<strong>边</strong>列表定位目标。</figcaption></figure>
<p>模型较大时，可以拖动节点，或选中节点后用方向键移动。通过<strong>布局</strong>和缩放按钮调整视图。这些操作只调整画布上的显示位置和比例。</p>`],
        ["publish", "5. 保存、校验并发布", ({ code, link }) => `
<ol>
  <li>点击<strong>保存草稿</strong>。在<strong>更多工具</strong>中，<strong>校验结构</strong>检查映射配置，<strong>校验数据</strong>读取源数据，检查业务键重复、边端点找不到对应账户等问题。</li>
  <li>点击<strong>校验并发布</strong>。发布会校验当前数据，成功后显示<strong>生效</strong>版本号。按钮不可用时，按建模指引补齐映射并保存修改，再确认自己的${link("access", "发布权限")}。</li>
  <li>打开<strong>查询</strong>，选择 <code>Transfer demo</code> 和 <strong>Cypher</strong>，粘贴并运行以下查询。</li>
</ol>
${code("Cypher", directTransfers.replace("$account_id", "1"))}
<p class="note"><strong>预期结果</strong> 表格返回一行，转出方是 Alice，收款方是 Bob，金额为 12.25。</p>`],
        ["keys", "将业务键和映射用于自己的数据", ({ code, ref }) => `
<p>为每个节点标签选择稳定的行标识。如果账号 ID 在不同租户中重复，将租户 ID 纳入复合键。边的起点和终点列必须按相同顺序对应完整的节点键。</p>
<p>下面的映射片段使用 PostgreSQL 中的账户表和 Parquet 中的转账表。查询可返回 <code>amount</code> 和 <code>event_time</code>，也可用它们做过滤。</p>
${code("YAML", mapping)}
<p>通过<strong>更多工具 → 查看 YAML</strong>可以查看或下载当前草稿。有建模权限时，也可以直接编辑。${ref("examples/finance.yaml", "完整示例")}包含数据源定义。</p>`],
        ["versions", "管理模型版本", ({ ref }) => `
<p>编辑草稿时，查询继续使用生效版本。在<strong>更多工具 → 版本历史</strong>中选择已发布版本，可与当前草稿对照。拥有发布权限的用户可以回退到已发布的映射，也可以下线模型。恢复源数据需要单独的备份。</p>
<p>多表映射、过滤及业务时间规则见${ref("docs/reference.zh-CN.md#多表图映射与业务时间", "模型参考")}。</p>`],
      ],
    },
    query: {
      title: "查询与探索",
      description: "在控制台运行带参数的查询，切换结果视图，并沿关系逐跳探索。",
      sections: [
        ["run", "选择已发布的模型", ({ code, link }) => `
<p>打开<strong>查询</strong>（Query），选择已发布的模型。本教程使用${link("model", "画布建模教程")}中的 <code>Transfer demo</code>。也可以在${link("first-model", "第一个图模型教程")}发布的 <code>graph</code> 模型中运行同一条查询。</p>
<p>在<strong>运行查询</strong>旁选择 <strong>Cypher</strong>，将下面的语句粘贴到<strong>查询语句</strong>编辑器。路径 <code>p</code> 用于绘图，转出方、收款方和金额可在表格中核对。SQL 和 Gremlin 的用法见${link("query-recipes", "查询示例")}。</p>
${code("Cypher", workbenchPath)}`],
        ["parameters", "设置 Cypher 查询参数", ({ code, image }) => `
<ol>
  <li>在编辑器下方打开<strong>查询选项 → Cypher 参数（JSON）</strong>，粘贴下方的 JSON 对象。键名写 <code>account_id</code>，省略 <code>$</code>。样例的账户 ID 是 <code>Int64</code>，因此值 <code>1</code> 用数字填写。</li>
  <li>点击<strong>运行查询</strong>，切换到<strong>表格</strong>核对一行结果。Alice 向 Bob 转账 <code>12.25</code>。</li>
  <li>把参数值改为 <code>2</code> 并再次运行，结果变为 Bob 向 Carol 转账 <code>25.50</code>。练习展开邻居前，把参数改回 <code>1</code> 并再运行一次。</li>
</ol>
${code("JSON", '{"account_id":1}')}
<p>遇到参数错误时，检查输入是否为 JSON 对象，键名是否用双引号包裹并与语句中 <code>$</code> 后的名称一致。参数框在选择 Cypher 后显示。<strong>超时（毫秒）</strong>留空时使用服务端默认值。</p>
<figure>${image("query-parameters", "英文查询工作台将 account_id 设为 1，表格显示 Alice、Bob 和金额 12.25")}<figcaption>在编辑器中输入查询语句，在 <strong>Query options</strong> 中填写 JSON 参数。</figcaption></figure>`],
        ["views", "切换查询结果视图", () => `
<p>通过结果区域上方的标签页查看查询结果或已发布的图结构。</p>
<dl class="plain-list">
  <dt>图（Graph）</dt><dd>查看返回的节点、边和路径。点选图元素可以检查业务键和属性。只返回标量值时用<strong>表格</strong>查看。需要画图时，让语句返回节点、边或路径，例如 <code>RETURN p</code>。</dd>
  <dt>表格（Table）</dt><dd>查看返回的行和列类型。本例中 <code>p</code> 是路径，其余列是转账明细。</dd>
  <dt>图结构（Graph schema）</dt><dd>查看已发布模型的节点标签、边类型、业务键和已映射属性。</dd>
  <dt>原始响应（Raw response）</dt><dd>查看最近一次查询返回的 JSON。展开结果下方的<strong>执行详情</strong>，可核对模型版本和数据源版本。</dd>
</dl>`],
        ["graph", "展开一跳邻居", ({ image }) => `
<ol>
  <li>将 <code>account_id</code> 设为 <code>1</code> 并运行查询，切换到<strong>图</strong>。选择业务键为 <code>2</code> 的 <code>Account</code> 节点，属性面板会显示名称 Bob。</li>
  <li>在节点属性面板点开<strong>展开筛选</strong>（Expansion filters），<strong>方向</strong>选<strong>出边</strong>（Outgoing），<strong>边类型</strong>选 <code>Transfer</code>。要沿指向当前节点的边探索，选择<strong>入边</strong>（Incoming）。要查两个方向，选择<strong>双向</strong>（Both directions）。选定有已映射属性的边类型后，还可以添加属性条件。</li>
  <li>点击<strong>展开邻居</strong>（Expand neighbors），画布会加入 Carol 以及 Bob 指向 Carol 的转账边，此时共有 3 个节点、2 条边。如果新节点在可视区域外，点击<strong>适配结果图</strong>（Fit graph to view）。</li>
</ol>
<p>每次展开查找选中节点的一跳邻居。若还有匹配项，点击<strong>加载下一页</strong>可为同一节点加入下一批。要向外再走一跳，请选中新加入的节点再展开。<strong>表格</strong>和<strong>原始响应</strong>读取的是查询执行结果。模型版本切换后，重新运行查询再继续探索。</p>
<figure>${image("query-neighbors", "英文图探索画布显示 Alice 到 Bob 到 Carol，选中 Bob 后可看到出边和 Transfer 展开筛选")}<figcaption>展开 Bob 的转账出边后，Carol 加入画布。标签页上方的行数统计对应查询执行结果。</figcaption></figure>`],
        ["export", "处理大结果集", ({ ref }) => `
<p>工作台显示有界预览。无需继续的查询可以取消。需要完整结果时，使用具备查询和导出权限的账号开启完整结果捕获，下载 Arrow IPC。探索大图时使用过滤条件、跳数限制与资源限制。</p>
<p>应用可使用 HTTP、Bolt、Gremlin WebSocket、CLI 或嵌入式 Rust。更多信息见${ref("docs/reference.zh-CN.md#查询语义与资源控制", "查询语义与协议")}和${ref("docs/reference.zh-CN.md#整图算法", "整图算法")}，包括最短路径、PageRank、社区发现等。</p>`],
      ],
    },
    "local-tables": {
      title: "本地表与同步",
      description: "为外部表创建 Parquet 副本，在控制台配置全量或增量刷新，并跟踪同步任务。",
      sections: [
        ["load", "创建并加载本地表", ({ link }) => `
<ol>
  <li>使用管理员账号${link("sources", "添加外部数据源并保存模型草稿")}。从<strong>数据源 → 本地表与同步</strong>或<strong>图模型 → 本地表</strong>进入管理页。</li>
  <li>点击<strong>创建本地表</strong>并填写名称。在<strong>外部源表</strong>中浏览来源，选中表，再点击<strong>使用此表</strong>。</li>
  <li>在<strong>加载字段与主键</strong>中保留模型所需的业务键、边端点和属性。跟练 SQLite 样例时，本地表名填 <code>accounts_local</code>，选择 <code>ledger.accounts</code>，保留 <code>id</code>、<code>name</code> 和 <code>updated_seq</code>。</li>
  <li>按下一节设置更新方式。保留<strong>创建后立即加载</strong>的勾选，再点击<strong>创建本地表</strong>，首次加载会在后台执行。也可以稍后在表卡片上点击<strong>加载副本</strong>。</li>
</ol>`],
        ["refresh", "配置全量或增量刷新", ({ image }) => `
<dl class="plain-list">
  <dt>全量替换（Full replacement）</dt><dd>在<strong>更新方式</strong>中选择<strong>全量替换</strong>。每次读取源表中所选字段的全部记录，成功后替换副本，可反映物理删除和主键变更。</dd>
  <dt>增量更新（Incremental refresh）</dt><dd>创建本地表时，在要用作键的字段右侧勾选<strong>主键</strong>，选择<strong>增量更新</strong>，再将<strong>增量字段</strong>设为非空的整数、日期或时间戳字段。样例用 <code>id</code> 作主键，用 <code>updated_seq</code> 作水位。</dd>
  <dt>定时刷新（Scheduled refresh）</dt><dd>在<strong>运行计划</strong>中勾选<strong>启用定时刷新</strong>，填写刷新间隔，单位为秒，至少 <code>30</code> 秒。例如填 <code>3600</code> 每小时刷新一次。增量模式下，可以另填<strong>全量对账间隔</strong> <code>86400</code>，每天全量加载一次。也可设置单次加载超时。</dd>
</dl>
<p>首次加载会读取全表，即使选择了增量更新。后续增量会重读已提交的水位边界，再按主键合并。主键须稳定、唯一且非空。每次插入或更新都要推进水位。源表物理删除和重读窗口外的变更需要全量对账。</p>
<p>创建增量表时，可以按增量字段的单位设置<strong>重读窗口</strong>，让任务重新读取更早的记录。来源用非空布尔列或整数列记录删除时，可选择<strong>软删除字段</strong>，让增量刷新移除标记为已删除的主键。</p>
<p>已创建的表可以通过<strong>刷新配置 → 保存配置</strong>调整下一次任务使用的方式、间隔或超时。只有创建时配置了主键和增量字段的表才提供增量模式。更换来源、加载字段、主键或增量字段时应新建本地表。临时执行一次全量可选择<strong>更多操作 → 从源表全量加载</strong>。<strong>立即同步</strong>使用当前配置的刷新方式。</p>
<figure>${image("local-sync-settings", "英文创建本地表界面显示 id 被选为主键，增量水位为 updated_seq")}<figcaption>左侧勾选要加载的列，右侧为 <code>id</code> 勾选主键。</figcaption></figure>`],
        ["status", "查看同步状态与加载历史", ({ code, image }) => `
<p>进入当前模型的<strong>本地表与同步</strong>，按表名或来源找到表。卡片显示最新任务状态、最近成功行数、刷新策略、下次刷新时间和最近全量对账时间。顶部的<strong>副本已就绪</strong>统计已有可用快照的表。</p>
<figure>${image("local-tables", "英文同步面板显示 accounts_local 的同步状态、下次刷新以及加载历史入口")}<figcaption>在表卡片上查看当次状态和下次运行时间，也可以打开刷新配置与加载历史。</figcaption></figure>
<p>点击表卡片上的<strong>加载历史</strong>（Load history），查看最近 20 次任务的刷新方式、触发来源、状态、耗时和行数。<strong>本次读取</strong>可能包含重读的水位边界行，<strong>提交后总计</strong>是副本合并后的行数。任务失败时，在表卡片或历史中查看报错，修复后再重试。</p>
<details class="example-details"><summary>用 SQLite 样例试一次增量更新</summary>
<p>首次加载显示三行后，在样例数据库上执行以下命令。对 <code>accounts_local</code> 点击<strong>立即同步</strong>，再打开<strong>加载历史</strong>。重读窗口为默认值零时，本次读取两行（水位 <code>3</code> 和 <code>4</code>），提交后副本共有三行。</p>
${code("Shell", syncDemoUpdate)}
</details>
<figure>${image("local-sync-history", "英文加载历史显示 accounts_local 的全量和增量任务，以及本次读取与提交后总行数")}<figcaption>最近一次全量加载捕获了样例中的一条物理删除。此前的增量更新读取两行，提交后三行。</figcaption></figure>`],
        ["use-copy", "让图模型读取本地副本", () => `
<p>副本就绪后，选择<strong>更多操作 → 加入模型数据源</strong>，再在节点或边的来源映射中选择 <code>local_&lt;名称&gt;.data</code>。若已有映射直接使用同一张外部表，可以点<strong>切换映射到本地</strong>。核对映射字段，保存草稿，再校验并发布，查询即可使用副本。</p>`],
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
        ["enable", "开启 MCP 查询和建模服务", ({ image, link }) => `
<ol>
  <li>管理员先在${link("access", "权限管理")}为目标账号勾选<strong>允许接入 MCP</strong>，并授予所需的模型操作权限。</li>
  <li>打开<strong>运行配置 → MCP 服务</strong>，按需打开<strong>启用查询服务</strong>和<strong>启用建模服务</strong>。两项默认关闭。可在查询区域设置返回行数上限和超时。</li>
  <li>点击<strong>保存 MCP 配置</strong>，设置立即生效。如果需要让客户端发布模型，还要单独开启<strong>允许发布模型</strong>，并给账号授予目标模型的<strong>发布</strong>权限。</li>
</ol>
<dl class="plain-list">
  <dt><code>/mcp/query</code></dt><dd>列出可见模型，获取已发布的结构，执行有界的只读查询。</dd>
  <dt><code>/mcp/modeling</code></dt><dd>读取、校验、创建和保存获准的草稿。创建草稿需要现有模板模型和预授权目标标识上的建模权限。</dd>
</dl>
<figure>${image("mcp-settings", "英文 MCP Services 页面分别开启查询与建模服务，发布开关未勾选")}<figcaption>按客户端需要分别开启查询、建模服务。</figcaption></figure>`],
        ["token", "生成个人令牌", ({ image }) => `
<ol>
  <li>使用 AI 客户端要代表的成员账号登录，打开侧栏<strong>AI</strong>，在<strong>我的权限</strong>核对模型范围。</li>
  <li>在<strong>个人令牌</strong>区域点击<strong>生成个人令牌</strong>，再点击<strong>复制令牌</strong>。令牌明文在签发时显示，离开或刷新页面前将它保存到客户端的凭据设置。</li>
</ol>
<p>每位用户有一个有效的个人令牌，有效期为 90 天。通过<strong>管理令牌</strong>可以重新生成或撤销令牌，重新生成后旧令牌失效。对于只允许 MCP 接入的成员，管理员可在<strong>权限管理 → 成员</strong>中勾选<strong>签发 MCP 令牌</strong>，再保存成员。</p>
<figure>${image("mcp-client-setup", "英文 AI 工作区显示 Generate personal token、MCP 服务选择和 Streamable HTTP 连接信息")}<figcaption>用客户端将代表的成员身份生成令牌。</figcaption></figure>`],
        ["connect", "在客户端注册 GraphLake", ({ code }) => `
<ol>
  <li>在<strong>AI → 添加到 Agent</strong>中选择<strong>查询 MCP</strong>或<strong>建模 MCP</strong>。两个服务都可用时会显示选择器。复制<strong>MCP 地址</strong>。</li>
  <li>在客户端 MCP 设置里新建 <strong>Streamable HTTP</strong> 服务，粘贴地址，认证方式选择 <strong>Bearer Token</strong>，或配置请求头 <code>Authorization: Bearer &lt;token&gt;</code>。同时使用两个端点时，各添加一项。</li>
  <li>使用 JSON 配置的客户端可展开<strong>使用 JSON 配置</strong>，也可改用下方示例。远程客户端应使用 GraphLake 配置的对外 HTTPS 地址，并在客户端凭据配置中替换令牌占位符。</li>
</ol>
${code("JSON", mcpConfig)}
<p>两个端点可以使用同一个个人令牌。每次调用按令牌所属账号当前的模型操作权限和租户范围执行。</p>`],
        ["verify", "验证 MCP 连接", ({ image }) => `
<ol>
  <li>在 GraphLake 的<strong>AI</strong>工作区选好服务，展开<strong>验证连接</strong>，点击<strong>测试 MCP 连接</strong>。如页面提示需要令牌，粘贴已保存的个人令牌。</li>
  <li>核对认证用户名，展开<strong>查看模型与工具</strong>，对照角色检查模型标识和可用工具。同时添加两个端点时，对另一端点重复测试。</li>
  <li>回到 AI 客户端，重新连接或刷新该服务的工具列表，调用 <code>list_models</code>。看到账号有权访问的模型，即可确认客户端的地址、传输、凭据和权限配置。</li>
</ol>
<p>客户端返回 <code>401</code> 时，检查 Bearer 请求头和令牌是否过期、轮换或撤销。返回 <code>403</code> 时，检查账号的<strong>允许接入 MCP</strong>设置和模型角色。返回 <code>404</code> 时，核对地址及对应服务是否已开启。客户端的传输方式应为 Streamable HTTP。</p>
<figure>${image("mcp-verify", "英文 AI 连接测试显示认证身份 demo-analyst、一个可见模型和三个查询工具")}<figcaption>连接成功后，核对认证用户、可见模型和工具，再开始查询或编辑草稿。</figcaption></figure>`],
        ["use", "发起第一次请求", ({ code, ref }) => `
<p>在查询端点，让客户端先调用 <code>list_models</code>，再对已发布模型调用 <code>get_schema</code> 和 <code>query</code>。转账样例运行下面的只读查询会返回 <code>3</code>。</p>
${code("Cypher", "MATCH (n:Account) RETURN count(n) AS accounts")}
<p>在建模端点，用 <code>get_model</code> 确认能读取草稿。需要修改时，先读取草稿版本、校验变更，保存后审核再发布。工具参数、令牌轮换和查询限制见${ref("docs/mcp.md", "MCP 参考")}。</p>`],
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
        ["cyber-investigation", "安全事件调查", ({ code, link }) => `
<p><strong>问题</strong> 登录告警指向某个账号。该会话启动了哪些进程，事件时间窗口内这些进程连接了哪些端点？</p>
<p>用登录日志映射 <code>Identity → Host</code>，用终端进程日志映射 <code>Host → Process</code>，用网络连接记录映射 <code>Process → NetworkEndpoint</code>。账号和主机使用包含租户的键，进程使用可区分 PID 重用的实例标识。每条边保留源事件 ID 和 UTC 毫秒时间戳，登录与进程启动边映射同一主机范围内的会话标识。</p>
<p>发布模型后执行下方 Cypher 查询，在<strong>查询选项</strong>中填入告警的账号和时间窗口。</p>
${code("Cypher", cyberInvestigation)}
${code("JSON", cyberParameters)}
<p>在${link("query", "图视图")}打开返回路径，选择边取得源事件 ID，再回查原始日志，核对账号、进程和目标端点。</p>`],
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
    ...handbook,
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
