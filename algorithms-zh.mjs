import { components, csrRefreshDemo, csrSample, pageRank, route, shortestPath } from "./handbook-examples.mjs";

export default {
  title: "图算法与 CSR",
  description: "构建分区图快照，查看已发布的 CSR 代次，并在四账户样例上运行和验证最短路径、PageRank 与弱连通分量。",
  sections: [
    ["choose", "准备样例图", ({ code, link }) => `
<p>最短路径找出跳数最少的路线。PageRank 根据有向关系为节点打分。弱连通分量（WCC）忽略边的方向，将彼此相连的节点分组。样例包含三个相连账户和一个孤立账户。</p>
<p>把${link("first-model", "转账样例")}下载到新目录，并添加账号 <code>4</code>（Dana）。两笔转账为 Alice → Bob → Carol。实时查询和 CSR 示例使用同一组文件。</p>
${code("Shell", csrSample)}
<p>实时 Cypher 可在单机工作台或集群上运行，需先发布样例模型。分区 CSR 需要 GraphLake v1.1.1、etcd 网关、共享存储及 Worker，参见${link("cluster", "集群安装")}。使用样例集群配置里的 <code>distributed_partitions: 4</code>。启动新的测试集群前，将三个文件放入其 catalog 目录，确保 Coordinator 与 Worker 可读。在<strong>图模型（Graph Models）</strong>中确认模型 ID 为 <code>graph</code>，状态为<strong>已发布（Published）</strong>。</p>
<p>CSR（压缩稀疏行）将图的邻接关系保存为一个已发布的代次，同时记录构建时的图范围、数据源版本及模型发布版本。发布新代次前，快照内容保持固定。</p>`],
    ["build", "创建 CSR 代次", ({ asset, code }) => `
<p>${asset("examples/algorithms/csr_demo.py", "下载 csr_demo.py")}，用 Python 3 运行。脚本提示输入内置 <code>admin</code> 密码，输入内容不回显。它通过 HTTP 会话认证，并发送同源的 <code>Origin</code> 请求头。用 <code>GRAPHLAKE_ORIGIN</code> 设置实际的 HTTPS 地址或转发后的回环地址，用 <code>GRAPHLAKE_MODEL</code> 设置已发布模型的 ID。默认值分别为 <code>http://127.0.0.1:7337</code> 和 <code>graph</code>。</p>
${code("Shell", "python3 csr_demo.py build")}
<ol>
  <li>脚本先从 <code>GET /api/v1/models</code> 读取 <code>active_revision</code>，再把它作为 <code>model_revision</code> 提交到 <code>POST /api/v1/models/graph/csr</code>。首次创建和后续刷新使用同一接口。请使用管理员或对该模型拥有发布权限的已登录成员。</li>
  <li>成功后，响应包含 <code>generation</code>、构建使用的 <code>model_revision</code> 和 <code>sources</code>、构建时间及节点边数。样例预期为 <strong>4 个节点、2 条边</strong>。构建成功后会自动发布新代次。</li>
</ol>
<p>脚本按模型的默认范围构建。若要刷新指定逻辑分区或历史时间的快照，在 API 请求中提供相应的 <code>graph_options</code>。示例的构建超时为 60 秒。大规模图可通过接口设置更长的超时，上限为 <code>600000</code> 毫秒。</p>`],
    ["status", "查看构建状态和实际使用的代次", ({ code, image, link }) => `
${code("Shell", "python3 csr_demo.py status")}
<dl class="plain-list">
  <dt>构建记录</dt><dd><code>GET /api/v1/models/{id}/freshness</code> 的 <code>refresh.status</code> 可能为 <code>building</code>、<code>succeeded</code> 或 <code>failed</code>。失败原因在 <code>refresh.error</code>。当前进程没有构建记录时，<code>refresh</code> 可能为空。<code>csr: null</code> 表示当前模型版本还没有已发布代次。</dd>
  <dt>已发布快照</dt><dd><code>GET /api/v1/models/{id}/csr</code> 返回当前代次、构建时间、节点边数、图范围和来源版本。一次构建失败后，旧代次仍可能处于发布状态。结合两个接口判断。</dd>
  <dt>控制台健康检查</dt><dd>打开<strong>运行配置 → 健康检查 → 模型健康</strong>，对目标模型点击<strong>检查（Check）</strong>。启用了 CSR 刷新或已有快照时，可在这里查看刷新提示及构建时间。<strong>CSR matches the current local copy</strong> 检查的是本地表副本的新鲜度。外部 CSV、JSON Lines 或数据库变更后，应再核对快照构建时间和记录的来源版本。</dd>
  <dt>查询实际使用的代次</dt><dd>在<strong>查询（Query）</strong>中选 Cypher，打开<strong>查询选项 → 使用已发布 CSR（Use published CSR）</strong>。运行后展开<strong>执行详情（Execution details）</strong>，将 <strong>CSR version</strong> 与当前代次 ID 对照。用<strong>切换至实时来源（Switch to live sources）</strong>恢复实时查询。</dd>
</dl>
<figure>${image("csr-model-health", "英文 Health Checks 页面显示模型健康和 CSR 的构建时间")}<figcaption>模型健康检查会显示已发布 CSR 的新鲜度信息和构建时间。</figcaption></figure>
<p>构建失败时，按尝试时间查 Coordinator 日志，检查来源访问、共享存储和可用内存，修复后重试。参见${link("monitoring", "健康检查与日志")}。</p>`],
    ["route", "运行最短路径", ({ code, image }) => `
<p>从 Alice（<code>1</code>）到 Carol（<code>3</code>）查找有向路径，限定最多四跳 <code>Transfer</code>。CSR 示例使用节点标签和业务键定位起点及终点。</p>
${code("Shell", "python3 csr_demo.py shortest")}
<p><strong>验证结果</strong> 预期 <code>hops: 2</code>，依次经过账号 <code>1 → 2 → 3</code> 和转账 <code>10、11</code>。这里按跳数求最短。在控制台选择<strong>使用已发布 CSR</strong>后运行下面的 Cypher，也可以切换到实时来源对照。</p>
${code("Cypher", shortestPath)}
<p>在<strong>表格（Table）</strong>核对 <code>[Alice, Bob, Carol]</code> 及 <code>2</code> 跳，在<strong>图（Graph）</strong>中检查两条转账关系。</p>
<figure>${image("csr-shortest-result", "英文 Query 工作台表格显示 Alice、Bob、Carol、两跳及执行使用的 CSR version")}<figcaption>表格显示路径和跳数，执行详情显示本次查询实际使用的代次。</figcaption></figure>
<details class="example-details"><summary>用 CLI 按转账金额求路径</summary>
<p>在样例目录中运行以下命令，预期路径成本为 <code>37.75</code>。<code>shortestPath()</code> 按跳数计算，这条命令使用映射的金额作为边权重。</p>
${code("Shell", route)}
</details>`],
    ["rank", "运行 PageRank", ({ code }) => `
<p>根据四个账号的转账出边计算排名。CSR 示例使用阻尼系数 <code>0.85</code>、收敛容差 <code>1e-8</code>，最多迭代 100 次。</p>
${code("Shell", "python3 csr_demo.py pagerank")}
<p><strong>验证结果</strong> 账号 <code>3</code>（Carol）排第一，约 <code>0.400545</code>。<code>2</code>（Bob）排第二，约 <code>0.288050</code>。Alice 与孤立节点 Dana 并列，约为 <code>0.155703</code>。舍入前总和约为 1。</p>
<p>要在控制台对照实时结果，若当前选中了 CSR，先点击<strong>切换至实时来源</strong>，然后运行这段 Cypher。</p>
${code("Cypher", pageRank)}`],
    ["components", "运行弱连通分量", ({ code }) => `
<p>只要账户能通过转账关系连在一起，就归为同一组。CSR 示例使用无向邻接，最多迭代 20 次。</p>
${code("Shell", "python3 csr_demo.py wcc")}
<p><strong>验证结果</strong> 预期两个分量。代表键 <code>1</code> 对应账号 <code>1、2、3</code>，代表键 <code>4</code> 只有 Dana。分量 ID 用于标识分组。要确认沿某一方向能否到达，使用最短路径查询。</p>
<p>在控制台选择实时来源后，可以用下面的 Cypher 对照。</p>
${code("Cypher", components)}`],
    ["csr", "刷新 CSR 并验证变化", ({ code, link, ref }) => `
<ol>
  <li>先运行 <code>python3 csr_demo.py status</code>，记录当前代次 ID 和节点边数。演练时，在样例集群的 catalog 目录中向 <code>transfers.jsonl</code> 追加下面的记录一次。这会将 Carol 连到 Dana，模型映射保持原样。</li>
</ol>
${code("Shell", csrRefreshDemo)}
<ol start="2">
  <li>再次运行 <code>python3 csr_demo.py build</code>。用 <code>status</code> 确认代次 ID 已变化、<code>transfers.jsonl</code> 的来源版本已更新、模型版本相同，节点边数为 <strong>4 个节点、3 条边</strong>。</li>
  <li>运行 <code>python3 csr_demo.py wcc</code>，四个账号应位于同一个分量。每个算法请求都会固定当前代次，脚本也会核对响应中的代次。在控制台执行新查询前，先切换至实时来源，再选<strong>使用已发布 CSR</strong>，并在结果中检查新的 <strong>CSR version</strong>。</li>
</ol>
<p>来源数据或查询所需的图范围变化后，重新构建 CSR。发布新模型版本后，按新的生效版本构建。已经接单的查询可以继续使用原代次。新查询遇到 <code>409 csr_generation_conflict</code> 时，重新读取已发布代次，再重跑已知结果的查询。</p>
<p>使用${link("local-tables", "本地表")}的模型，可以在发布配置中启用 <code>freshness.auto_refresh_csr: true</code>，在本地副本提交新代次后刷新 CSR。外部文件和数据库的变更用本页的手动构建流程。完整请求格式和其他算法见${ref("deploy/cluster.md#分区图执行", "分区图 API 参考")}与${ref("docs/reference.zh-CN.md#整图算法", "算法参考")}。</p>`],
  ],
};
