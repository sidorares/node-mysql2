import mysql from '../../promise.js';

export const DRIVERS = ['mysql2-query', 'mysql2-execute', 'bun-sql'];

export function connectionConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bench',
  };
}

function bindRunner(target, mode) {
  return mode === 'execute'
    ? (sql, params) => target.execute(sql, params).then(([rows]) => rows)
    : (sql, params) => target.query(sql, params).then(([rows]) => rows);
}

async function createMysql2Single(mode, extraOptions) {
  const config = connectionConfig();
  const connection = await mysql.createConnection({
    ...config,
    ...extraOptions,
  });
  const run = bindRunner(connection, mode);
  return {
    kind: 'mysql2',
    mode,
    run,
    async transaction(work) {
      await connection.beginTransaction();
      try {
        await work(run);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    },
    async connectOnce() {
      throw new Error('connect scenario needs pool mode');
    },
    async warm() {
      await connection.query('SELECT 1');
    },
    close: () => connection.end(),
  };
}

function createMysql2(mode, poolSize, extraOptions) {
  const config = connectionConfig();
  const pool = mysql.createPool({
    ...config,
    connectionLimit: poolSize,
    maxIdle: poolSize,
    waitForConnections: true,
    ...extraOptions,
  });
  return {
    kind: 'mysql2',
    mode,
    pool,
    run: bindRunner(pool, mode),
    async transaction(work) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await work(bindRunner(connection, mode));
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async connectOnce() {
      const connection = await mysql.createConnection({
        ...config,
        ...extraOptions,
      });
      await bindRunner(connection, mode)('SELECT 1');
      await connection.end();
    },
    async warm() {
      await Promise.all(
        Array.from({ length: poolSize }, () => pool.query('SELECT 1'))
      );
    },
    close: () => pool.end(),
  };
}

async function createBunSql(poolSize) {
  const { SQL } = await import('bun');
  const config = connectionConfig();
  const options = {
    adapter: 'mysql',
    hostname: config.host,
    port: config.port,
    username: config.user,
    password: config.password,
    database: config.database,
  };
  const sql = new SQL({ ...options, max: poolSize });
  return {
    kind: 'bun',
    sql,
    async connectOnce() {
      const single = new SQL({ ...options, max: 1 });
      await single`SELECT 1`;
      await single.close();
    },
    async warm() {
      await Promise.all(Array.from({ length: poolSize }, () => sql`SELECT 1`));
    },
    close: () => sql.close(),
  };
}

export async function createDriver(
  name,
  poolSize,
  extraOptions = {},
  single = false
) {
  if (single && name !== 'bun-sql') {
    return createMysql2Single(
      name === 'mysql2-execute' ? 'execute' : 'query',
      extraOptions
    );
  }
  switch (name) {
    case 'mysql2-query':
      return createMysql2('query', poolSize, extraOptions);
    case 'mysql2-execute':
      return createMysql2('execute', poolSize, extraOptions);
    case 'bun-sql':
      return createBunSql(poolSize);
    default:
      throw new Error(`unknown driver: ${name}`);
  }
}
