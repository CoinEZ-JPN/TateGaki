const esbuild = require('esbuild');

const buildOptions = {
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node14',
};

esbuild.build(buildOptions).catch(() => process.exit(1));