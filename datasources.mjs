const groups = [
  ["databases", "Databases", "数据库", [
    ["postgres", "PostgreSQL", "postgres", "Read relational tables and views. Set the DSN environment variable and select a schema.", "读取关系表和视图。设置 DSN 环境变量，再选择 schema。"],
    ["mysql", "MySQL", "mysql", "Connect to a MySQL database with a DSN. Configure TLS and a private CA if needed.", "用 DSN 连接 MySQL 数据库，按需配置 TLS 和私有 CA。"],
    ["mariadb", "MariaDB", "mariadb", "Read InnoDB tables through the MySQL protocol using a read-only snapshot.", "通过 MySQL 协议以只读快照读取 InnoDB 表。"],
    ["tidb", "TiDB", "tidb", "Connect through the MySQL protocol. Reads are scoped to each remote statement.", "通过 MySQL 协议连接 TiDB，读取范围由各条远端语句决定。"],
    ["oceanbase", "OceanBase", "oceanbase", "Provide the DSN of an OceanBase tenant running in MySQL mode.", "填写 OceanBase MySQL 模式租户的 DSN。"],
    ["sqlserver_native", "SQL Server (direct)", "sqlserver", "Connect by TDS using the host, port, database, user, and password environment variable.", "通过 TDS 直连，填写主机、端口、数据库、用户名和密码环境变量。", "SQL Server（直连）"],
    ["oracle_native", "Oracle (direct)", "oracle", "Use Easy Connect or a TNS name. Install Oracle Instant Client on the GraphLake server.", "使用 Easy Connect 地址或 TNS 名称。GraphLake 服务端须安装 Oracle Instant Client。", "Oracle（直连）"],
    ["mongodb_native", "MongoDB (direct)", "mongodb", "Connect using a MongoDB URI. A schema sample identifies mapped fields, including nested fields addressed by dotted names.", "使用 MongoDB URI 连接。通过结构采样识别映射字段，嵌套字段使用点分名称。", "MongoDB（直连）"],
    ["sqlite", "SQLite", "sqlite", "Open a database file from the GraphLake server. Use this for lightweight local samples or existing embedded data.", "从 GraphLake 服务端打开数据库文件，适合轻量样例或已有嵌入式数据。"],
    ["duckdb", "DuckDB", "duckdb", "Open a server-side DuckDB database file in read-only mode and choose the source schema and table.", "以只读方式打开服务端 DuckDB 文件，再选择来源 schema 和表。"],
    ["spanner", "Cloud Spanner", "spanner", "Specify the database resource path. Reads for tables in the same source can share a read-only transaction.", "填写数据库资源路径。同一来源内的表可以在同一只读事务中读取。"],
    ["sap_hana", "SAP HANA", "sap_hana", "Connect to the tenant SQL port and map table and column names with their exact case.", "连接租户 SQL 端口，按实际大小写映射表名和列名。"],
  ]],
  ["analytics", "Warehouses and analytics", "数仓与分析", [
    ["snowflake", "Snowflake", "snowflake", "Use the SQL API with an API address, token, and compute warehouse. You can specify a Time Travel timestamp.", "通过 SQL API 接入，填写服务地址、令牌和计算仓库，可指定 Time Travel 时间。"],
    ["bigquery", "BigQuery", "bigquery", "Set the billing project, location, token, and maximum bytes billed per query.", "设置计费项目、数据位置、令牌和单次查询计费字节上限。"],
    ["databricks", "Databricks SQL", "databricks", "Provide the workspace URL, token, SQL Warehouse ID, and catalog. Use a view if the mapped data needs scalar columns.", "填写工作区地址、令牌、SQL Warehouse ID 和 catalog。需要标量字段时可通过视图转换。"],
    ["clickhouse", "ClickHouse", "clickhouse", "Connect to the HTTP interface with an address and user, then map columns from analytical tables.", "填写 HTTP 服务地址和用户，再映射分析表中的列。"],
    ["doris", "Apache Doris", "doris", "Connect with a MySQL-compatible DSN and map analytical tables or views.", "使用兼容 MySQL 的 DSN 连接，映射分析表或视图。"],
    ["starrocks", "StarRocks", "starrocks", "Connect to the MySQL-compatible endpoint and map columns in a table or view.", "连接兼容 MySQL 的端点，映射表或视图中的字段。"],
    ["trino", "Trino", "trino", "Connect to the coordinator. Reference tables using source.catalog.schema.table.", "连接 Trino Coordinator，按 source.catalog.schema.table 引用表。"],
  ]],
  ["files", "Files and lakehouse tables", "文件与湖仓表", [
    ["parquet", "Parquet", "parquet", "Map local files or object URLs to a table. GraphLake reads the schema from Parquet metadata.", "将本地文件或对象 URL 映射为表。GraphLake 从 Parquet 元数据读取结构。"],
    ["csv", "CSV", "", "Map UTF-8, comma-separated files with headers. Declare column names and types in file order.", "映射带表头的 UTF-8 逗号分隔文件，按文件顺序声明列名和类型。"],
    ["jsonl", "JSON Lines", "", "Read one JSON object per line. Declare the top-level fields and types the graph will use.", "逐行读取 JSON 对象，声明图模型所需的顶层字段和类型。"],
    ["iceberg", "Apache Iceberg", "iceberg", "Connect to a REST Catalog, select a namespace and table, and optionally pin a snapshot ID.", "连接 REST Catalog，选择命名空间和表，按需固定快照 ID。"],
    ["delta", "Delta Lake", "delta", "Map a Delta table’s storage path. Optionally select a table version for reproducible reads.", "映射 Delta 表的存储路径，按需指定表版本以复现读取结果。"],
  ]],
  ["object-storage", "Object storage", "对象存储", [
    ["object_storage", "Object Storage connector", "", "Choose a provider and bucket, then map object keys to a Parquet, CSV, or JSON Lines table.", "选择存储提供方和桶，再将桶内对象键映射为 Parquet、CSV 或 JSON Lines 表。", "对象存储连接器"],
    ["storage-s3", "Amazon S3", "storage-s3", "Use a bucket and region with the server’s default identity or named access-key variables.", "填写桶和区域，使用服务端默认身份或指定访问密钥的环境变量。", "", "storage.provider: s3"],
    ["storage-minio", "MinIO", "storage-minio", "Provide the MinIO endpoint, bucket, and access-key environment variables.", "填写 MinIO 端点、桶和访问密钥环境变量。", "", "storage.provider: minio"],
    ["storage-oss", "Alibaba Cloud OSS", "storage-oss", "Set the OSS region and endpoint. Use credentials with S3-compatible V4 signing enabled.", "填写 OSS 区域和端点，使用支持 S3 兼容 V4 签名的凭据。", "阿里云 OSS", "storage.provider: oss"],
    ["storage-tos", "Volcengine TOS", "storage-tos", "Select the region and use the region’s S3-compatible TOS endpoint.", "选择区域，并使用该区域的 TOS S3 兼容端点。", "火山引擎 TOS", "storage.provider: tos"],
    ["storage-cos", "Tencent Cloud COS", "storage-cos", "Set the region and COS endpoint. Include the APPID suffix in the bucket name.", "填写区域和 COS 端点，桶名包含 APPID 后缀。", "腾讯云 COS", "storage.provider: cos"],
    ["storage-azure", "Azure Blob Storage", "storage-azure", "Set the storage account and container. Use the default Azure credential chain or an account-key environment variable.", "填写存储账号和容器，使用 Azure 默认凭据链或指定账号密钥环境变量。", "", "storage.provider: azure"],
    ["storage-gcs", "Google Cloud Storage", "storage-gcs", "Set the bucket and use the default identity or an environment variable containing service-account JSON.", "填写桶，使用默认身份或引用含服务账号 JSON 的环境变量。", "", "storage.provider: gcs"],
  ]],
  ["through-trino", "Through Trino", "通过 Trino 接入", [
    ["sqlserver", "SQL Server via Trino", "sqlserver", "Configure the SQL Server catalog on the Trino coordinator and select it in the GraphLake connector.", "先在 Trino Coordinator 配置 SQL Server catalog，再在 GraphLake 连接器中选择。", "SQL Server（经 Trino）"],
    ["oracle", "Oracle via Trino", "oracle", "Use an Oracle catalog configured in Trino. The coordinator manages the remote database connection.", "使用 Trino 中已配置的 Oracle catalog，由 Coordinator 管理远端数据库连接。", "Oracle（经 Trino）"],
    ["mongodb", "MongoDB via Trino", "mongodb", "Use the coordinator’s MongoDB catalog and its schema definitions to map collection fields.", "使用 Coordinator 的 MongoDB catalog 和结构定义映射集合字段。", "MongoDB（经 Trino）"],
    ["elasticsearch", "Elasticsearch", "elasticsearch", "Configure an Elasticsearch catalog in Trino, then select the index and map scalar columns.", "在 Trino 配置 Elasticsearch catalog，再选择索引并映射标量字段。"],
    ["redshift", "Amazon Redshift", "redshift", "Connect through the Redshift catalog in Trino. Choose the remote schema and table.", "通过 Trino 的 Redshift catalog 接入，再选择远端 schema 和表。"],
    ["trino-hive", "Apache Hive", "", "Choose the Trino connector and reference a table in a configured Hive catalog.", "选择 Trino 连接器，引用已配置 Hive catalog 中的表。", "", "type: trino"],
    ["trino-hudi", "Apache Hudi", "", "Choose the Trino connector and reference a table in a configured Hudi catalog.", "选择 Trino 连接器，引用已配置 Hudi catalog 中的表。", "", "type: trino"],
  ]],
];

const rootIcons = new Set(["postgres", "parquet", "iceberg", "snowflake", "duckdb"]);

export function datasourcePage(zh) {
  return {
    title: zh ? "数据源目录" : "Data source catalog",
    description: zh
      ? "按连接方式浏览 GraphLake v1.1.8 支持的数据源，找到对应的连接器、配置方式和运行依赖。"
      : "Browse the data sources supported by GraphLake v1.1.8 and find the connector, settings, and prerequisites for each one.",
    sections: [
      ["start", zh ? "接入你的数据" : "Connect your data", ({ link, ref }) => zh
        ? `<p>先找到下方对应的卡片，再按${link("sources", "数据源接入教程")}在控制台添加连接并核对表结构。卡片中的 <code>type</code> 或 <code>storage.provider</code> 是模型 YAML 中对应的设置。</p><p>字段类型、认证配置和各协议的读取限制见${ref("docs/reference.zh-CN.md#图映射与连接器", "连接器参考")}。</p>`
        : `<p>Find the connector below, then follow the ${link("sources", "connection walkthrough")} to add it in the console and inspect its tables. The <code>type</code> or <code>storage.provider</code> on each card is the corresponding model YAML setting.</p><p>For field types, authentication, and protocol limits, see the ${ref("docs/reference.zh-CN.md#图映射与连接器", "connector reference")}.</p>`],
      ...groups.map(([id, en, cn, entries]) => [id, zh ? cn : en, ({ assets }) => `
<ul class="datasource-grid" role="list">
  ${entries.map(([key, name, icon, english, chinese, chineseName, config = "type: " + key]) => `
  <li class="datasource-card" id="source-${key}">
    ${icon ? `<img src="${assets}${rootIcons.has(icon) ? "" : "datasources/"}${icon}.svg" width="30" height="30" alt="" loading="lazy">` : ""}
    <h3>${zh && chineseName ? chineseName : name}</h3>
    <p>${zh ? chinese : english}</p>
    <code>${config}</code>
  </li>`).join("")}
</ul>`]),
    ],
  };
}
