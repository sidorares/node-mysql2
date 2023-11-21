import { mysql, mysqlp } from '../index.js';

// Callback
(() => {
  const poolOptions: mysql.PoolOptions = {
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }

  const connectionOptions: mysql.ConnectionOptions = {
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }

  mysql.createConnection(connectionOptions);
  mysql.createPool(poolOptions);
  mysql.createPoolCluster().add(poolOptions);
})();

// Promise
(() => {
  const poolOptions: mysqlp.PoolOptions = {
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }

  const connectionOptions: mysqlp.ConnectionOptions = {
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }

  mysqlp.createConnection(connectionOptions);
  mysqlp.createPool(poolOptions);
  mysqlp.createPoolCluster().add(poolOptions);
})();
