// TODO: fix "[warn] Code style issues found in the above file. Run Prettier to fix." error
/* eslint-disable */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const mysql = require('../index.js');

const connection = mysql.createConnection({
  host: Deno.env.get('MYSQL_HOST'),
  port: Deno.env.get('MYSQL_PORT'),
  user: Deno.env.get('MYSQL_USER'),
  password: Deno.env.get('MYSQL_PASSWORD'),
  database: Deno.env.get('MYSQL_DATABASE'),
});

connection.on('error', (err: Error) => {
  console.error(err);
  Deno.exit(1);
});

connection.on('connect', () => {
  connection.query('SELECT 1 + 1 AS solution', (err: Error) => {
    if (err) {
      console.error(err);
      Deno.exit(1);
    }
    connection.end();
  });
});
