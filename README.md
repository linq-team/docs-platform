# Stainless API Docs Monorepo

## Getting started
1. Login via the cli: `stl auth login`
   2. Instructions for installing the cli can be [found here](https://www.stainless.com/docs/getting-started/quickstart-cli/)
2. Install dependencies: `pnpm install`
3. Create a `.env` file within the `docs-ui` package.
   - Set `STAINLESS_ROOT` to the path to your stainless monorepo.
4. Verify you can build the app: `pnpm build`
5. Run the dev server: `pnpm run dev`

## Running the app

### Running all apps
```pnpm run dev```

### Running just a single app
```pnpm run dev --filter dev-docs```

### Using custom specs

1. Create a `test-specs` folder within `apps/dev-docs`. This folder is ignored by git and can house any test specs you want to use
2. Set the following environment variables
   - OPENAPI_PATH="./test-specs/PATH_TO_YOUR_OPENAPI_SPEC"
   - STAINLESS_CONFIG_PATH="./test-specs/PATH_TO_YOUR_STAINLESS_CONFIG"
3. Run the dev server. `@stainless-api/docs` will respect those env vars while running development.

## Publishing to npm

We use [changesets](https://github.com/changesets/changesets) to handling publishing
