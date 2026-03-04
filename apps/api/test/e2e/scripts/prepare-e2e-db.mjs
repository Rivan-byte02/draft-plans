import { spawnSync } from 'node:child_process';
import path from 'node:path';

const defaultTestDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5433/draft_plans?schema=e2e';

const databaseUrl = process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl;
const parsedUrl = new URL(databaseUrl);
const databaseName = parsedUrl.pathname.replace(/^\//, '');
const schemaName = parsedUrl.searchParams.get('schema') ?? '';

if (
  !databaseName.includes('test') &&
  !schemaName.includes('test') &&
  !schemaName.includes('e2e')
) {
  throw new Error(
    `Refusing to run backend E2E tests against a non-test database: ${databaseUrl}`,
  );
}

process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = 'test';

const prismaCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const apiRoot = path.resolve(import.meta.dirname, '../../..');

const commandResult = spawnSync(prismaCommand, ['prisma', 'migrate', 'deploy'], {
  cwd: apiRoot,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
  stdio: 'inherit',
});

if (commandResult.status !== 0) {
  process.exit(commandResult.status ?? 1);
}
