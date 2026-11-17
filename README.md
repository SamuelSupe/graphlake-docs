# GraphLake documentation site

English and Simplified Chinese guides for GraphLake v1.1.1. [Live site](https://graphlake-docs.pages.dev/) · [中文文档](https://graphlake-docs.pages.dev/zh/). The English site starts at `/` and the Chinese site starts at `/zh/`. The output can also be served under a path prefix.

## Build and preview

Run from this directory with Node.js 24 and Python 3.

```sh
node build.mjs
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open [English](http://127.0.0.1:4173/) or [中文](http://127.0.0.1:4173/zh/). Deploy the contents of `dist/` on any static host with directory index support. The build requires no package install.

## Cloudflare Pages

The [deployment workflow](.github/workflows/deploy.yml) builds each push to `main` with Node.js 24, then uploads `dist/` to the existing `graphlake-docs` Pages project. Production deployments run serially.

Configure these repository settings before running the workflow:

- Actions variable `CLOUDFLARE_ACCOUNT_ID` for the account that owns the Pages project.
- Actions secret `CLOUDFLARE_API_TOKEN` with **Account → Cloudflare Pages → Edit** on that account.

After setting both values, rerun the failed deployment job or push another commit to `main`. To deploy the same build manually from a clean checkout with a local Wrangler login:

```sh
node build.mjs
npx --yes wrangler@4.163.0 pages deploy dist --project-name graphlake-docs --branch main --commit-hash "$(git rev-parse HEAD)"
```

## Update a guide

- Edit corresponding English and Chinese guides together. Operations guides live in `operations-en.mjs` and `operations-zh.mjs`. Keep the section IDs and their ordering matched so language switching preserves the section.
- Keep commands and version-specific download URLs in `examples.mjs`. Check them against the release artifacts before updating the documented version.
- `assets/` holds the site's styles, client script, and public product screenshots. The workbench and local-table screenshots show the English GraphLake v1.1.1 console with the Parquet example. `model-editor.jpg` shows the same console with the CSV and JSON Lines transfer example. The connector artwork and its license come from `web/src/assets/connectors/`.
- The home page uses `assets/graph-background.webp` for the decorative artwork and serves Geist and Geist Mono locally. Their license is in `assets/LICENSE-geist.txt`.
- `assets/graphlake-logo.png` is the [official GraphLake mark](https://github.com/SamuelSupe/graphlake/blob/6857b723de2f7cdad5955a8ddb0afc5719e494d3/docs/images/graphlake-logo.png). The header and favicon use this same image.
- The bilingual handbook and documentation index live in `handbook-en.mjs` and `handbook-zh.mjs`. The build generates the search index from the guide content.
- The transfer sample in `assets/examples/transfer/` comes from [GraphLake v1.1.1 examples/text](https://github.com/SamuelSupe/graphlake/tree/v1.1.1/examples/text). Keep the sample queries and expected results in sync with it.
