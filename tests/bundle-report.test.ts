import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { build } from 'vite';
import type { Plugin } from 'vite';
import { bundleReportPlugin } from '../src/index';

type CombinedReport = {
    entryChunks: string[];
    dependencyPackages?: string[];
    sourceModules?: string[];
    shipped?: Array<Record<string, unknown>>;
    visualizer?: unknown;
};

const tempRoots: string[] = [];

async function createFixtureProject(): Promise<string> {
    const projectRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-bundle-report-'));
    tempRoots.push(projectRoot);

    const srcDir = path.join(projectRoot, 'src');
    await fsp.mkdir(srcDir, { recursive: true });
    await fsp.writeFile(
        path.join(srcDir, 'main.ts'),
        "export const answer = 42;\nconsole.log('bundle-report-test', answer);\n",
        'utf8',
    );

    return projectRoot;
}

afterEach(async () => {
    await Promise.all(
        tempRoots.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })),
    );
});

describe('bundleReportPlugin', () => {
    it('can be pushed into a plain inferred plugins array', async () => {
        const fixtureRoot = await createFixtureProject();

        const plugins = [{ name: 'seed-plugin' } as Plugin];
        plugins.push(
            bundleReportPlugin({ dependenciesOutputFile: 'dist/dependencies.json' }),
        );

        await build({
            configFile: false,
            logLevel: 'silent',
            root: fixtureRoot,
            plugins,
            build: {
                outDir: 'dist',
                emptyOutDir: true,
                minify: false,
                lib: {
                    entry: path.resolve(fixtureRoot, 'src/main.ts'),
                    formats: ['es'],
                    fileName: 'bundle',
                },
            },
        });

        const reportPath = path.join(fixtureRoot, 'dist', 'dependencies.json');
        expect(fs.existsSync(reportPath)).toBe(true);
    });

    it('uses default report sections when reportSections is omitted', async () => {
        const fixtureRoot = await createFixtureProject();

        await build({
            configFile: false,
            logLevel: 'silent',
            root: fixtureRoot,
            plugins: [
                bundleReportPlugin({
                    dependenciesOutputFile: 'dist/dependencies.json',
                }),
            ],
            build: {
                outDir: 'dist',
                emptyOutDir: true,
                minify: false,
                lib: {
                    entry: path.resolve(fixtureRoot, 'src/main.ts'),
                    formats: ['es'],
                    fileName: 'bundle',
                },
            },
        });

        const reportPath = path.join(fixtureRoot, 'dist', 'dependencies.json');
        const report = JSON.parse(
            await fsp.readFile(reportPath, 'utf8'),
        ) as CombinedReport;

        expect(report.entryChunks).toContain('bundle.mjs');
        expect(report.dependencyPackages).toEqual(expect.any(Array));
        expect(report.sourceModules).toEqual(expect.any(Array));
        expect(report.shipped).toEqual(expect.any(Array));
        expect(report.visualizer).not.toBeNull();
    });

    it('creates a combined dependencies report with shipped and visualizer data', async () => {
        const fixtureRoot = await createFixtureProject();

        await build({
            configFile: false,
            logLevel: 'silent',
            root: fixtureRoot,
            plugins: [
                bundleReportPlugin({
                    dependenciesOutputFile: 'dist/dependencies.json',
                }),
            ],
            build: {
                outDir: 'dist',
                emptyOutDir: true,
                minify: false,
                lib: {
                    entry: path.resolve(fixtureRoot, 'src/main.ts'),
                    formats: ['es'],
                    fileName: 'bundle',
                },
            },
        });

        const reportPath = path.join(fixtureRoot, 'dist', 'dependencies.json');

        expect(fs.existsSync(reportPath)).toBe(true);

        const report = JSON.parse(
            await fsp.readFile(reportPath, 'utf8'),
        ) as CombinedReport;

        expect(report.entryChunks).toContain('bundle.mjs');
        expect(report.dependencyPackages).toEqual(expect.any(Array));
        expect(report.sourceModules).toBeDefined();
        expect(
            report.sourceModules?.some((moduleId) => moduleId.endsWith('main.ts')),
        ).toBe(true);
        expect(report.shipped).toBeDefined();
        expect(report.shipped).toEqual(expect.any(Array));
        expect(report.shipped?.some((item) => item.type === 'chunk')).toBe(true);
        expect(report.visualizer).not.toBeNull();
    });

    it('omits unselected sections while always keeping entryChunks', async () => {
        const fixtureRoot = await createFixtureProject();

        await build({
            configFile: false,
            logLevel: 'silent',
            root: fixtureRoot,
            plugins: [
                bundleReportPlugin({
                    dependenciesOutputFile: 'dist/dependencies.json',
                    reportSections: ['shipped'],
                }),
            ],
            build: {
                outDir: 'dist',
                emptyOutDir: true,
                minify: false,
                lib: {
                    entry: path.resolve(fixtureRoot, 'src/main.ts'),
                    formats: ['es'],
                    fileName: 'bundle',
                },
            },
        });

        const reportPath = path.join(fixtureRoot, 'dist', 'dependencies.json');
        const report = JSON.parse(
            await fsp.readFile(reportPath, 'utf8'),
        ) as CombinedReport;

        expect(report.entryChunks).toContain('bundle.mjs');
        expect(report.shipped?.some((item) => item.type === 'chunk')).toBe(true);
        expect(report.dependencyPackages).toBeUndefined();
        expect(report.sourceModules).toBeUndefined();
        expect(report.visualizer).toBeUndefined();
    });

});
