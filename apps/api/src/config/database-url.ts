function normalizeDatabaseName(value: string | undefined) {
  return value && value.length > 0 ? value : 'draft_plans';
}

function normalizeDatabaseUser(value: string | undefined) {
  return value && value.length > 0 ? value : 'postgres';
}

function normalizeDatabasePassword(value: string | undefined) {
  return value && value.length > 0 ? value : 'postgres';
}

function normalizeDatabaseHost(value: string | undefined) {
  return value && value.length > 0 ? value : 'localhost';
}

function normalizeDatabasePort(value: string | undefined) {
  return value && value.length > 0 ? value : '5432';
}

function normalizeDatabaseSchema(value: string | undefined) {
  return value && value.length > 0 ? value : 'public';
}

export function ensureDatabaseUrlEnvironment() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const databaseName = normalizeDatabaseName(process.env.POSTGRES_DB);
  const databaseUser = normalizeDatabaseUser(process.env.POSTGRES_USER);
  const databasePassword = normalizeDatabasePassword(process.env.POSTGRES_PASSWORD);
  const databaseHost = normalizeDatabaseHost(process.env.POSTGRES_HOST);
  const databasePort = normalizeDatabasePort(process.env.POSTGRES_PORT);
  const databaseSchema = normalizeDatabaseSchema(process.env.DATABASE_SCHEMA);

  process.env.DATABASE_URL =
    `postgresql://${databaseUser}:${databasePassword}` +
    `@${databaseHost}:${databasePort}/${databaseName}?schema=${databaseSchema}`;

  return process.env.DATABASE_URL;
}

