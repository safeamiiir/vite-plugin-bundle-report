# vite-plugin-bundle-report

A Vite plugin that generates two JSON reports after every build:

- **shipped report** — every emitted asset and chunk with its byte size.
- **dependencies report** — resolved npm dependency packages, source modules, and entry chunks.

## Install

```bash
npm install -D vite-plugin-bundle-report
# or
pnpm add -D vite-plugin-bundle-report
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { bundleReportPlugin } from 'vite-plugin-bundle-report';

export default defineConfig({
  plugins: [
    bundleReportPlugin({
      shippedOutputFile: 'dist/shipped.json',
      dependenciesOutputFile: 'dist/dependencies.json',
    }),
  ],
});
```

The plugin only runs during `build` (`apply: 'build'`) so it has no effect on dev server startup.

## Options

| Option                  | Type     | Required | Description                                                                 |
|-------------------------|----------|----------|-----------------------------------------------------------------------------|
| `shippedOutputFile`     | `string` | ✓        | Path (relative to `projectRoot`) to write the emitted assets/chunks report. |
| `dependenciesOutputFile`| `string` | ✓        | Path (relative to `projectRoot`) to write the dependencies report.          |
| `projectRoot`           | `string` | —        | Absolute path to the project root. Defaults to `process.cwd()`.            |

## Output shapes

### shipped report (`shippedOutputFile`)

```json
[
  { "type": "chunk", "fileName": "my-lib.es.js", "isEntry": true, "imports": [], "dynamicImports": [], "exports": ["default"], "size": 12345 },
  { "type": "asset", "fileName": "style.css", "size": 678 }
]
```

### dependencies report (`dependenciesOutputFile`)

```json
{
  "entryChunks": ["my-lib.es.js"],
  "dependencyPackages": ["react", "react-dom", "three"],
  "sourceModules": ["src/index.ts", "src/utils.ts"]
}
```

## Using only when analyzing

You can conditionally add the plugin the same way you would with any Vite plugin:

```ts
if (process.env.ANALYZE) {
  plugins.push(
    bundleReportPlugin({
      shippedOutputFile: 'dist/shipped.json',
      dependenciesOutputFile: 'dist/dependencies.json',
    })
  );
}
```

## Publishing to the Vite Plugin Registry

The [Vite Plugin Registry](https://registry.vite.dev/) picks up packages automatically from npm based on the `vite-plugin` keyword in `package.json` (already included). After publishing to npm the package will appear in the registry within 24 hours.

```bash
npm publish --access public
```

## License

MIT
