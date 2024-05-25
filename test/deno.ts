import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mysql = require('../index.js');

const connection = mysql.createConnection({
  host: Deno.env.MYSQL_HOST,
  port: Deno.env.MYSQL_PORT,
  username: Deno.env.MYSQL_USER,
  password: Deno.env.MYSQL_PASSWORD,
  database: Deno.env.MYSQL_DATABASE,
});

connection.on('error', (err) => {
  console.error(err);
  Deno.exit(1);
});

connection.on('connect', () => {
  connection.query('SELECT 1 + 1 AS solution', (err) => {
    if (err) {
      console.error(err);
      Deno.exit(1);
    }
    connection.end();
  });
});
