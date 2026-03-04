import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, 'utf8');
  const lines = fileContents.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = normalizedValue;
    }
  }
}

function ensureDatabaseUrlEnvironment() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const databaseName = process.env.POSTGRES_DB || 'draft_plans';
  const databaseUser = process.env.POSTGRES_USER || 'postgres';
  const databasePassword = process.env.POSTGRES_PASSWORD || 'postgres';
  const databaseHost = process.env.POSTGRES_HOST || 'localhost';
  const databasePort = process.env.POSTGRES_PORT || '5432';
  const databaseSchema = process.env.DATABASE_SCHEMA || 'public';

  process.env.DATABASE_URL =
    `postgresql://${databaseUser}:${databasePassword}` +
    `@${databaseHost}:${databasePort}/${databaseName}?schema=${databaseSchema}`;
}

const apiDirectory = resolve(import.meta.dirname, '..');
const workspaceDirectory = resolve(apiDirectory, '..', '..');

loadEnvFile(resolve(workspaceDirectory, '.env'));
loadEnvFile(resolve(apiDirectory, '.env'));
ensureDatabaseUrlEnvironment();

const [command, ...commandArguments] = process.argv.slice(2);

if (!command) {
  console.error('Missing command to execute.');
  process.exit(1);
}

const childProcess = spawn(command, commandArguments, {
  cwd: apiDirectory,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

childProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
