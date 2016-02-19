var core = require('./index.js');

function createConnection(opts) {
  console.log('here');
  var coreConnection = core.createConnection(opts);
  return new Promise(function(resolve, reject) {
    coreConnection.once('connect', function(connectParams) {
      resolve(new PromiseConnection(coreConnection));
    });
    coreConnection.once('error', reject);
  });
}

function PromiseConnection(connection) {
  this.connection = connection;
}

PromiseConnection.prototype.query = function(sql, values) {
  var c = this.connection;
  return new Promise(function(resolve, reject) {
    c.query(sql, values, function(err, rows, fields) {
      if (err)
        reject(err);
      else
        resolve([rows, fields]);
    });
  });
};

PromiseConnection.prototype.execute = function(query, params) {
  var c = this.connection;
  return new Promise(function(resolve, reject) {
    c.execute(query, params, function(err, rows, fields) {
      if (err)
        reject(err);
      else
        resolve([rows, fields]);
    });
  });
};

PromiseConnection.prototype.end = function() {
  var c = this.connection;
  return new Promise(function(resolve, reject) {
    c.end(function() {
      resolve();
    });
  });
};

module.exports.createConnection = createConnection;
