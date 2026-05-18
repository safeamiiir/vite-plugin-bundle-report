import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

type EmittedAsset = {
    type: 'asset';
    fileName: string;
    source: string | Uint8Array;
};

type EmittedChunk = {
    type: 'chunk';
    fileName: string;
    isEntry: boolean;
    imports: string[];
    dynamicImports: string[];
    exports: string[];
    code: string;
    modules?: Record<string, unknown>;
};

type EmittedItem = EmittedAsset | EmittedChunk;

export interface BundleReportOptions {
    /**
     * Output file path for the shipped (emitted assets + chunks) report.
     * @example 'dist/shipped.json'
     */
    shippedOutputFile: string;

    /**
     * Output file path for the dependency packages + source modules report.
     * @example 'dist/dependencies.json'
     */
    dependenciesOutputFile: string;

    /**
     * Absolute path to the project root, used to compute relative source module paths.
     * Defaults to process.cwd().
     */
    projectRoot?: string;
}

export function bundleReportPlugin(options: BundleReportOptions): Plugin {
    const {
        shippedOutputFile,
        dependenciesOutputFile,
        projectRoot = process.cwd(),
    } = options;

    return {
        name: 'vite-plugin-bundle-report',
        apply: 'build',
        generateBundle(_options: unknown, bundle: Record<string, EmittedItem>) {
            const emitted = Object.values(bundle).map((item) => {
                if (item.type === 'asset') {
                    const sourceSize =
                        typeof item.source === 'string'
                            ? Buffer.byteLength(item.source)
                            : item.source.byteLength;
                    return {
                        type: 'asset',
                        fileName: item.fileName,
                        size: sourceSize,
                    };
                }

                return {
                    type: 'chunk',
                    fileName: item.fileName,
                    isEntry: item.isEntry,
                    imports: item.imports,
                    dynamicImports: item.dynamicImports,
                    exports: item.exports,
                    size: Buffer.byteLength(item.code),
                };
            });

            fs.mkdirSync(path.dirname(path.resolve(projectRoot, shippedOutputFile)), { recursive: true });
            fs.writeFileSync(
                path.resolve(projectRoot, shippedOutputFile),
                JSON.stringify(emitted, null, 2),
            );

            const chunks = Object.values(bundle).filter(
                (item): item is EmittedChunk => item.type === 'chunk',
            );
            const moduleIds = chunks.flatMap((chunk) =>
                Object.keys(chunk.modules ?? {}),
            );

            const dependencyPackages = Array.from(
                new Set(
                    moduleIds
                        .map((moduleId) => {
                            const marker = '/node_modules/';
                            const markerIndex = moduleId.lastIndexOf(marker);
                            if (markerIndex === -1) {
                                return null;
                            }

                            const pathAfterNodeModules = moduleId.slice(
                                markerIndex + marker.length,
                            );
                            const nestedNodeModulesIndex =
                                pathAfterNodeModules.lastIndexOf('/node_modules/');
                            const dependencyPath =
                                nestedNodeModulesIndex === -1
                                    ? pathAfterNodeModules
                                    : pathAfterNodeModules.slice(
                                          nestedNodeModulesIndex + '/node_modules/'.length,
                                      );

                            if (dependencyPath.startsWith('@')) {
                                const [scope, name] = dependencyPath.split('/');
                                return scope && name ? `${scope}/${name}` : null;
                            }

                            const [name] = dependencyPath.split('/');
                            return name ?? null;
                        })
                        .filter((dep): dep is string => Boolean(dep)),
                ),
            ).sort();

            const sourceModules = Array.from(
                new Set(
                    moduleIds
                        .filter((moduleId) => moduleId.includes('/src/'))
                        .map((moduleId) =>
                            path.relative(projectRoot, moduleId).replaceAll('\\', '/'),
                        ),
                ),
            ).sort();

            const dependenciesReport = {
                entryChunks: chunks
                    .filter((chunk) => chunk.isEntry)
                    .map((chunk) => chunk.fileName),
                dependencyPackages,
                sourceModules,
            };

            fs.mkdirSync(path.dirname(path.resolve(projectRoot, dependenciesOutputFile)), { recursive: true });
            fs.writeFileSync(
                path.resolve(projectRoot, dependenciesOutputFile),
                JSON.stringify(dependenciesReport, null, 2),
            );
        },
    };
}
