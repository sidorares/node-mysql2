var mysql = require('../../promise.js');

async function test() {
  const c = await mysql.createConnection({ port: 3306, user: 'testuser', namedPlaceholders: true, password: 'testpassword' });
  console.log('connected!');
  const [rows, fields] = await c.query('show databases');
  console.log(rows);

  try {
    const [rows, fields] = await c.query('some invalid sql here');
  } catch(e) {
    console.log('caught exception!', e);
  }


  console.log( await c.execute('select sleep(0.5)') );
  console.log('after first sleep');
  console.log( await c.execute('select sleep(0.5)') );
  console.log('after second sleep');
  var start = +new Date()
  console.log( await Promise.all([c.execute('select sleep(2.5)'), c.execute('select sleep(2.5)')]) );
  console.log('after 2+3 parallel sleep whitch is in fact not parallel because commands are queued per connection');
  var end = +new Date();
  console.log(end - start);
  await c.end();

  const p  = mysql.createPool({ port: 3306, user: 'testuser', namedPlaceholders: true, password: 'testpassword' });
  console.log( await p.execute('select sleep(0.5)') );
  console.log('after first pool sleep');
  var start = +new Date()
  console.log( await Promise.all([p.execute('select sleep(2.5)'), p.execute('select sleep(2.5)')]) );
  console.log('after 2+3 parallel pool sleep');
  var end = +new Date();
  console.log(end - start);
  await p.end();
}

test().then(() => {
  console.log('done');
}, (err) => {
  console.log('error!', err);
  throw err;
});
