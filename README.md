# GraphLake documentation site

English and Simplified Chinese guides for GraphLake v1.1.0. [Live site](https://graphlake-docs.pages.dev/) · [中文文档](https://graphlake-docs.pages.dev/zh/). The English site starts at `/` and the Chinese site starts at `/zh/`. The output can also be served under a path prefix.

## Build and preview

Run from this directory with Node.js 24 and Python 3.

```sh
node build.mjs
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open [English](http://127.0.0.1:4173/) or [中文](http://127.0.0.1:4173/zh/). Deploy the contents of `dist/` on any static host with directory index support. The build requires no package install.

## Cloudflare Pages

The production site uses Cloudflare Pages Direct Upload. From a clean checkout of `main`, build and deploy with an authenticated Wrangler session that has Pages write access.

```sh
node build.mjs
npx --yes wrangler@4.163.0 pages deploy dist --project-name graphlake-docs --branch main
```

Deployments run when this command is invoked. GitHub pushes update the source repository.

## Update a guide

- Edit `en.mjs` and `zh.mjs` together. Keep the section IDs and their ordering matched so language switching preserves the section.
- Keep commands and version-specific download URLs in `examples.mjs`. Check them against the release artifacts before updating the documented version.
- `assets/` holds the site's styles, client script, and public product screenshots. The workbench and local-table images come from GraphLake's README on main after the v1.1.0 release. The connector artwork and its license come from `web/src/assets/connectors/`.
