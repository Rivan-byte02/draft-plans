const defaultTestDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5433/draft_plans?schema=e2e';

function isSafeTestDatabaseUrl(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl);
  const databaseName = parsedUrl.pathname.replace(/^\//, '');
  const schemaName = parsedUrl.searchParams.get('schema') ?? '';

  return (
    databaseName.includes('test') ||
    schemaName.includes('test') ||
    schemaName.includes('e2e')
  );
}

export function resolveTestDatabaseUrl() {
  return process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl;
}

export function applyTestEnvironment() {
  const databaseUrl = resolveTestDatabaseUrl();

  if (!isSafeTestDatabaseUrl(databaseUrl)) {
    throw new Error(
      `Refusing to run backend E2E tests against a non-test database: ${databaseUrl}`,
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';

  return databaseUrl;
}
