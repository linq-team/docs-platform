# Vendored npm tarballs

The exact published versions this org depends on, packed from npm on 2026-09-02
while the registry was still serving them.

**These exist because the repo is behind npm.** Copybara stopped exporting
before the last few betas were published, so `main` does not contain the source
for what we actually run:

| package | this repo | npm (what we run) |
|---|---|---|
| `@stainless-api/docs` | 1.0.0-beta.140 | **1.0.0-beta.143** |
| `@stainless-api/docs-ui` | 1.0.0-beta.96 | **1.0.0-beta.98** |
| `@stainless-api/docs-search` | 1.0.0-beta.50 | **1.0.0-beta.52** |
| `@stainless-api/ui-primitives` | 1.0.0-beta.54 | **1.0.0-beta.55** |

Two more are not in this repo at all and have no public source:

- `@stainless-api/sdk@0.5.0`
- `@stainless/sdk-json@0.1.0-beta.11` — 8.1 MB, dist-only; its generator is a
  vendored `preview.worker.docs.js` blob with no accompanying source.

## What is recoverable

`@stainless-api/docs` ships **unbuilt TypeScript**, so its tarball *is* the
source for beta.143 — patchable and readable as-is. The other three ship
compiled `dist` only, so for those the repo (three betas behind) is the nearest
thing to source we have.

## Restoring from these

    pnpm add ./vendor/npm/stainless-api-docs-1.0.0-beta.143.tgz

Or publish them to a private registry and repoint the install.
