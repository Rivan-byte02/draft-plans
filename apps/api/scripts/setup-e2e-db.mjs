import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const defaultTestDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5433/draft_plans?schema=e2e';

function resolveTestDatabaseUrl() {
  return process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl;
}

function isSafeTestDatabaseUrl(databaseUrl) {
  const parsedUrl = new URL(databaseUrl);
  const databaseName = parsedUrl.pathname.replace(/^\//, '');
  const schemaName = parsedUrl.searchParams.get('schema') ?? '';

  return (
    databaseName.includes('test') ||
    schemaName.includes('test') ||
    schemaName.includes('e2e')
  );
}

async function runStep(commandArguments, environmentOverrides = {}) {
  const apiDirectory = resolve(import.meta.dirname, '..');
  const runWithRootEnvScriptPath = resolve(import.meta.dirname, 'run-with-root-env.mjs');

  await new Promise((resolveStep, rejectStep) => {
    const childProcess = spawn(
      'node',
      [runWithRootEnvScriptPath, ...commandArguments],
      {
        cwd: apiDirectory,
        env: {
          ...process.env,
          ...environmentOverrides,
        },
        stdio: 'inherit',
      },
    );

    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolveStep();
        return;
      }

      rejectStep(new Error(`Command failed: ${commandArguments.join(' ')}`));
    });
  });
}

const databaseUrl = resolveTestDatabaseUrl();

if (!isSafeTestDatabaseUrl(databaseUrl)) {
  throw new Error(
    `Refusing to initialize a non-test database with the e2e setup script: ${databaseUrl}`,
  );
}

await runStep(
  ['npx', 'prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'],
  { DATABASE_URL: databaseUrl },
);

await runStep(['npx', 'tsx', 'prisma/seed.ts'], {
  DATABASE_URL: databaseUrl,
});
