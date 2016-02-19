var mysql = require('./promise.js');

async function test() {
  const c = await mysql.createConnection({ port: 3307, user: 'root', namedPlaceholders: true });
  const [rows, fields] = await c.query('show databases');
  console.log(rows)
  console.log( await c.execute('select 1+:toAdd as qqq', {toAdd: 10}) );
  console.log( await c.execute('select 1+:toAdd as qqq', {toAdd: 10}) );
  console.log( await c.execute('select 1+:toAdd as qqq', {toAdd: 10}) );
  console.log( await c.execute('select 1+:toAdd as qqq', {toAdd: 10}) );
  await c.end();
}

test().then(function() {
  console.log('done');
}, function(err) {
  console.log(err);
  throw err;
});
