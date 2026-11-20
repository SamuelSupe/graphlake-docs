# GraphLake documentation site

English and Simplified Chinese guides for GraphLake v1.1.6. [Live site](https://graphlake-docs.pages.dev/) · [中文文档](https://graphlake-docs.pages.dev/zh/). The English site starts at `/` and the Chinese site starts at `/zh/`. The output can also be served under a path prefix.

## Build and preview

Run from this directory with Node.js 24 and Python 3.

```sh
node build.mjs
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open [English](http://127.0.0.1:4173/) or [中文](http://127.0.0.1:4173/zh/). Deploy the contents of `dist/` on any static host with directory index support. The build requires no package install.

## Publish to Cloudflare Pages from Codex

Push the documentation changes to `main`. To release them, open this repository in Codex, select the **Cloudflare** plugin and give it this request.

> Publish the latest GitHub `main` to the production `graphlake-docs` Pages project using `./scripts/publish-pages.sh`. Verify the English and Chinese home pages and report the commit and deployment URL.

The [release script](scripts/publish-pages.sh) builds the fetched commit in a fresh directory and uses the plugin’s Wrangler Pages Direct Upload workflow. The production deployment records the full Git commit. Publishing is an explicit step after a push.

The release machine needs Git, npm and a Wrangler login with deployment access to the existing project. If signing in for the first time, run `npx --yes wrangler@4.163.0 login`. Builds use Node.js 24 on Linux or a Node.js 24 container in OrbStack on macOS. [Cloudflare Direct Upload documentation](https://developers.cloudflare.com/pages/get-started/direct-upload/)

## Update a guide

- Edit corresponding English and Chinese guides together. Operations guides live in `operations-en.mjs` and `operations-zh.mjs`. The troubleshooting guides live in `troubleshooting-en.mjs` and `troubleshooting-zh.mjs`. Keep the section IDs and their ordering matched so language switching preserves the section.
- Keep commands and version-specific download URLs in `examples.mjs`. Check them against the release artifacts before updating the documented version.
- `assets/` holds the site's styles, client script, and English GraphLake v1.1.1 screenshots. The workbench uses the Parquet example. The model editor and query walkthrough use the CSV and JSON Lines transfer example. The source browser and sync walkthrough use the SQLite fixture in `handbook-examples.mjs`. The connector artwork and its license come from `web/src/assets/connectors/`.
- The home page uses the GraphLake console’s cobalt palette and responsive, decorative glass-layer artwork in `assets/graph-layers.webp` and `assets/graph-layers-small.webp`. Landing-page styles live in `assets/home.css`; shared navigation and article styles live in `assets/site.css`. Geist and Geist Mono are served locally under `assets/LICENSE-geist.txt`.
- `assets/graphlake-logo.png` is the [official GraphLake mark](https://github.com/SamuelSupe/graphlake/blob/6857b723de2f7cdad5955a8ddb0afc5719e494d3/docs/images/graphlake-logo.png). The header and favicon use this same image.
- The bilingual handbook and documentation index live in `handbook-en.mjs` and `handbook-zh.mjs`. The build generates the search index from the guide content.
- The `ops-*.jpg` screenshots show the English v1.1.1 console for model health, telemetry settings, and backup and recovery. The health screenshot uses a two-Worker lab and the backup panel shows a standalone instance.
- The upgrade guides live in `upgrade-en.mjs` and `upgrade-zh.mjs`. They use the shared commands in `upgrade-examples.mjs`, the release helper in `assets/examples/upgrade/`, and English v1.1.2 console captures in `assets/upgrade-*.jpg`.
- The graph algorithm and CSR guides live in `algorithms-en.mjs` and `algorithms-zh.mjs`. They use the transfer sample with an added isolated account, the runnable `assets/examples/algorithms/csr_demo.py` script, and English cluster screenshots in `assets/csr-*.jpg`.
- The developer integration guides live in `clients-en.mjs` and `clients-zh.mjs`. Their code blocks and downloads share the runnable Python files in `assets/examples/clients/`. The `clients-*.jpg` screenshots show the published sample and its query-only service account in the English console.
- The `trouble-*.jpg` screenshots show actual error states in the English console using isolated sample data.
- `datasources.mjs` holds the bilingual catalog cards. Compare connector types and object-storage providers against the documented GraphLake release before changing the list. Logos come from the product’s [connector assets](https://github.com/SamuelSupe/graphlake/tree/v1.1.1/web/src/assets/connectors).
- The transfer sample in `assets/examples/transfer/` comes from [GraphLake v1.1.1 examples/text](https://github.com/SamuelSupe/graphlake/tree/v1.1.1/examples/text). Keep the sample queries and expected results in sync with it.
