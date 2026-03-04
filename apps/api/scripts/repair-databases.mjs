import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const apiDirectory = resolve(import.meta.dirname, '..');

async function runScript(scriptName) {
  await new Promise((resolveStep, rejectStep) => {
    const childProcess = spawn('npm', ['run', scriptName], {
      cwd: apiDirectory,
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolveStep();
        return;
      }

      rejectStep(new Error(`Script failed: ${scriptName}`));
    });
  });
}

await runScript('db:setup');
await runScript('db:setup:e2e');

