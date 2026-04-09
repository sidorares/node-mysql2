/**
 * Smoke test for mysql_query_attribute_string() with mysql2.
 *
 * Wire protocol: query attributes are only sent when the client sets
 * CLIENT_QUERY_ATTRIBUTES and uses the extended COM_QUERY layout documented at
 * https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_com_query.html
 *
 * mysql2 (as of current release in this project) does not implement that
 * extension — see node_modules/mysql2/lib/packets/query.js — so attribute
 * values are typically NULL unless the server/session sets them another way.
 */

const mysql = require('./promise');

process.env.MYSQL_PASSWORD = 'test';

const SQL = `
SELECT
  mysql_query_attribute_string('n1') AS \`attr 1\`,
  mysql_query_attribute_string('n2') AS \`attr 2\`,
  mysql_query_attribute_string('n3') AS \`attr 3\`
`.trim();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'mysql',
  });

  try {

    // const qa = await connection.query('INSTALL COMPONENT "file://component_query_attributes"');
    // console.log(qa);

    // const c = await connection.query('select * from mysql.component');
    // console.log(c);

    // const [rows, fields, extra] = await connection.query({
    //   sql: SQL,
    //   attributes: {
    //     n1: 123,
    //     n2: 'qqq',
    //     n3: new Date()
    //   }
    // });
    // console.log('columns:', fields.map((f) => f.name));
    // console.log('rows:', rows);
    // console.log('extra:', extra);

    const q = await connection.query('select 1+1 as sum');
    console.log(q);
    
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/*

docker command:

docker run -e MYSQL_ROOT_PASSWORD=test -p 3306:3306 mysql:8

*/