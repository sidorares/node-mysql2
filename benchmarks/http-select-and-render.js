'use strict';

const http = require('http');
const common = require('../test/common');
const url = require('url');

const conn = common.createConnection();
const render = common.createTemplate();
const port = process.env.PORT;

http
  .createServer((req, res) => {
    const q = url.parse(req.url, true);
    if (q.pathname == '/render') {
      const sql = q.query.q;
      const n = q.query.n;
      let rowsTotal = [];
      const doQueries = function(number) {
        if (number === 0) {
          const body = render({ records: rowsTotal });
          res.writeHead(200, {
            'Content-Length': body.length,
            'Content-Type': 'text/html'
          });
          res.end(body);
        } else {
          conn.query(sql, (err, rows) => {
            // TODO: handle error
            rowsTotal = rowsTotal.concat(rows);
            doQueries(number - 1);
          });
        }
      };
      doQueries(n);
    } else {
      res.writeHead(404);
      res.end();
    }
  })
  .listen(port || 1234);
