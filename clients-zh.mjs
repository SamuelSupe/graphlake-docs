import { boltRun, clientEnvironment, clientScript, clientVenv, clientWorkbench, downloadSample, gremlinRun } from "./handbook-examples.mjs";

export default {
  title: "开发者接入",
  description: "用服务账号连接已发布的 GraphLake 模型，通过 HTTP、Bolt 或 Gremlin 执行同一项只读查询并核对结果。",
  sections: [
    ["prepare", "准备已发布的模型", ({ code, image, link }) => `
<p>示例使用 GraphLake v1.1.1 和 Python 3.11 或更新版本。已有模型 ID 为 <code>graph</code> 的转账样例时，直接使用并检查下面的监听配置。首次运行时，先安装 ${link("install", "GraphLake 安装包")}，将样例下载到新目录，再初始化管理员密码并启动服务。</p>
${code("Shell", downloadSample)}
${code("Shell", clientWorkbench)}
<p>打开 <code>http://127.0.0.1:7347</code>，以 <code>admin</code> 登录，进入<strong>图模型（Graph Models）</strong>。样例的显示名称是 <strong>text-files</strong>，模型 ID 为 <code>graph</code>。连接前确认状态是<strong>已发布（Published）</strong>。如果使用控制台创建的模型，先点击<strong>校验并发布（Validate and publish）</strong>，再将它的 ID 填入示例。</p>
<figure>${image("clients-published-model", "英文 Graph Models 列表显示已发布的 text-files，模型 ID 为 graph")}<figcaption>在显示名称下方读取模型 ID。模型发布后，拥有相应查询权限的客户端即可访问。</figcaption></figure>
<p>HTTP 使用控制台监听端口。<code>--driver-model graph</code> 启用 Gremlin 并设置驱动的默认模型。<code>--bolt-port 7687</code> 启用独立的 Bolt 监听端口。已有部署可在启动命令中加上所需参数后重启服务。</p>`],
    ["auth", "创建服务账号并授予查询权限", ({ code, image, link }) => `
<ol>
  <li>运行 <code>openssl rand -hex 32</code> 生成应用专用令牌，保存到应用的密钥存储。打开<strong>权限管理 → 成员 → 新建成员（New member）</strong>，选择<strong>服务账号（Service account）</strong>。账号名称填 <code>analytics</code>，在<strong>初始令牌（Initial token）</strong>和<strong>确认令牌（Confirm token）</strong>中输入同一令牌。该账号只用于驱动和 API，取消勾选<strong>允许接入 MCP（Allow MCP access）</strong>，再点击<strong>保存成员（Save member）</strong>。</li>
  <li>打开<strong>角色列表 → 新建角色（New role）</strong>，命名为 <code>analytics-reader</code>。加入成员 <code>svc/analytics</code>，在<strong>按模型授权（Permissions by model）</strong>中为模型 <code>graph</code> 勾选<strong>查询（Query）</strong>并保存。回到<strong>成员（Members）</strong>，确认账号为<strong>启用（Enabled）</strong>，拥有 <strong>Drivers / API</strong> 接入权限，并已分配该角色。</li>
  <li>另开一个终端执行下面的配置，在不回显的提示中输入同一令牌。三个示例使用同一个服务账号及模型查询权限。如果使用自己的模型，将 <code>GRAPHLAKE_MODEL</code> 改为该模型的 ID，并调整查询和预期结果。</li>
</ol>
<figure>${image("clients-service-account", "英文 Access Control 成员列表显示 svc/analytics 已启用，拥有 Drivers / API 接入权限和 analytics-reader 角色")}<figcaption>测试连接前，核对成员列表里的客户端用户名和已分配角色。</figcaption></figure>
${code("Shell", clientEnvironment)}
<p>在服务所在主机或通过 SSH 端口转发使用这些回环地址。生产接入时，把客户端变量分别改成实际的 <code>https://</code> 地址、直连的 <code>bolt+s://</code> 监听地址，以及以 <code>/gremlin</code> 结尾的 <code>wss://</code> 地址。HTTPS 代理应保留 <code>Host</code> 和 <code>Origin</code>、转发 WebSocket 升级请求，并与服务的 <code>--public-url</code> 匹配。参见${link("deploy", "部署与 HTTPS")}和${link("access", "模型权限")}。</p>
<p>使用 Bolt 或 Gremlin 时，先创建并激活 Python 虚拟环境，再安装相应驱动。HTTP 示例只使用 Python 标准库。</p>
${code("Shell", clientVenv)}`],
    ["http", "HTTP API", ({ asset, code }) => `
<p>用 <code>svc/analytics</code> 和令牌进行 <strong>HTTP Basic</strong> 认证。<code>GET /api/v1/models</code> 返回该账号可见的已发布模型。读取目标模型的 <code>active_revision</code>，在 <code>POST /api/v1/models/{id}/query</code> 中将其作为 <code>model_revision</code>，并为 <code>request_id</code> 生成一个新 UUID。示例把 Cypher 参数编码成 JSON 字符串，放在 <code>parameters_json</code> 字段。</p>
<p>${asset("examples/clients/http_query.py", "下载 http_query.py")}</p>
${code("Python", clientScript("http_query.py"))}
${code("Shell", "python3 http_query.py")}
<p><strong>验证结果</strong> 脚本确认返回恰好一行 <code>[["Alice"]]</code>、预览未截断，且响应版本与所选版本一致，然后打印 <code>['Alice']</code> 和已验证的版本。HTTP 预览的单元格是字符串或 null。完整结果导出需要该模型单独授予<strong>导出（Export）</strong>权限。</p>`],
    ["bolt", "Bolt", ({ asset, code }) => `
<p>本地示例使用 <code>bolt://</code> 直连。远程 TLS 监听使用 <code>bolt+s://</code>。将同一个服务账号用户名和令牌交给 Neo4j 驱动，通过 <code>session(database="graph")</code> 指定已发布的模型。示例运行只读的自动提交查询，支持这里的 CSV 数据源。</p>
<p>${asset("examples/clients/bolt_query.py", "下载 bolt_query.py")}</p>
${code("Python", clientScript("bolt_query.py"))}
${code("Shell", boltRun)}
<p><strong>验证结果</strong> 预期输出 <code>['Alice']</code>。成功读取记录，说明客户端已连到 Bolt 监听端口、通过认证、选中正确的数据库并读到映射数据。GraphLake 支持 Bolt 5.1–5.4 直连。</p>`],
    ["gremlin", "Gremlin WebSocket", ({ asset, code }) => `
<p>连接 <code>/gremlin</code>，以同一服务账号用户名和令牌做 SASL PLAIN 认证。传入 <code>graph</code> 作为遍历源，以显式选择该模型。GraphLake 将别名 <code>g</code> 映射到默认模型。示例使用 GraphSON 3 和只读字节码遍历。</p>
<p>${asset("examples/clients/gremlin_query.py", "下载 gremlin_query.py")}</p>
${code("Python", clientScript("gremlin_query.py"))}
${code("Shell", gremlinRun)}
<p><strong>验证结果</strong> 预期输出 <code>['Alice']</code>。成功完成遍历，说明 WebSocket 升级、认证、遍历源选择及模型读取均已通过。</p>`],
    ["errors", "排查连接与查询失败", ({ link, ref }) => `
<dl class="plain-list">
  <dt>认证失败</dt><dd>核对用户名的 <code>svc/</code> 前缀、令牌以及账号是否启用。令牌或角色变化后，新建连接再重试。</dd>
  <dt>找不到模型或访问被拒绝</dt><dd>确认模型已发布、使用的是模型 ID，并核对当前账号的角色、查询权限及租户范围。用同一服务账号测试 HTTP 模型发现。</dd>
  <dt>HTTP 提示版本已变更</dt><dd>遇到 <code>active_revision_changed</code> 时重新读取 <code>/api/v1/models</code>。确认新版本符合预期后，用该版本和新的请求 ID 重新提交查询。</dd>
  <dt>Bolt 或 Gremlin 连接被拒绝</dt><dd>检查监听端口、协议前缀和 TLS 证书信任。Gremlin 还需确认代理允许 <code>/gremlin</code> 的 WebSocket 升级。修复后从实际部署入口重跑已知结果查询。</dd>
</dl>
<p>驱动能力见${ref("deploy/README.md#客户端接入", "协议参考")}。服务就绪或数据源问题见${link("troubleshoot", "故障排查")}。</p>`],
  ],
};
