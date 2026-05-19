# Contributing

Thanks for your interest in improving `vite-plugin-bundle-report`.

## Development Setup

Requirements:

- Node.js 18+
- pnpm

Install dependencies:

```bash
pnpm install
```

Build the package:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

## Local Development Workflow

1. Create a branch for your change.
2. Implement your update.
3. Add or update tests when behavior changes.
4. Run `pnpm test`.
5. Open a pull request with a clear summary.

## Pull Request Guidelines

- Keep changes focused and small when possible.
- Include test coverage for logic changes.
- Update documentation when public behavior or options change.

## Release and Publishing (Maintainers)

Publish to npm:

```bash
npm publish --access public
```

Vite Plugin Registry notes:

- The package is picked up automatically from npm via the `vite-plugin` keyword in `package.json`.
- Registry indexing may take up to 24 hours after publishing.
