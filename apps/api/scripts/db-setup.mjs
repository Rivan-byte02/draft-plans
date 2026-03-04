import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const apiDirectory = resolve(import.meta.dirname, '..');
const runWithRootEnvScriptPath = resolve(import.meta.dirname, 'run-with-root-env.mjs');

async function runStep(commandArguments) {
  await new Promise((resolveStep, rejectStep) => {
    const childProcess = spawn('node', [runWithRootEnvScriptPath, ...commandArguments], {
      cwd: apiDirectory,
      env: process.env,
      stdio: 'inherit',
    });

    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolveStep();
        return;
      }

      rejectStep(new Error(`Command failed: ${commandArguments.join(' ')}`));
    });
  });
}

await runStep(['npx', 'prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
await runStep(['npx', 'tsx', 'prisma/seed.ts']);

