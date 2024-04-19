'use strict';

const createConnection = require('../test/common.test.cjs').createConnection;
const connection = createConnection();
const NUM_SAMPLES = 10000;

function typeCastRaw(field, next) {
  if (field.type === 'VARCHAR') {
    return field.string();
  }

  if (field.type === 'BINARY') {
    return field.buffer().toString('ascii');
  }

  return next();
}

function typeCastValue(field, next) {
  if (field.type === 'VARCHAR') {
    return field.value();
  }

  if (field.type === 'BINARY') {
    return field.value().toString('ascii');
  }

  return next();
}

async function benchmark(iterations, executor, typeCast) {
  await new Promise((resolve, reject) => {
    connection.query(
      'TRUNCATE benchmark_typecast',
      (err) => {
        if (err) reject(err);
        resolve();
      },
    );
  });

  await new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO benchmark_typecast VALUES ("hello", 0x1234)',
      (err) => {
        if (err) reject(err);
        resolve();
      },
    );
  });

  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await new Promise((resolve, reject) => {
      connection[executor]({ sql: `SELECT * FROM benchmark_typecast`, typeCast }, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    samples.push(Date.now() - start);
  }

  console.log(
    `${executor} ${typeCast ? typeCast : 'raw'}: AVG ${samples.reduce((a, b) => a + b, 0) / samples.length}ms`,
  );
}

connection.query(
  'CREATE TEMPORARY TABLE benchmark_typecast (v1 VARCHAR(16), v2 BINARY(4))',
  async (err) => {
    if (err) throw err;
    await benchmark(NUM_SAMPLES, 'query');
    await benchmark(NUM_SAMPLES, 'query', typeCastRaw);
    await benchmark(NUM_SAMPLES, 'query', typeCastValue);

    connection.end();
  },
);
