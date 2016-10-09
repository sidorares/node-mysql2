// get the client
var mysql = require('mysql2');

// create the connection to database
var connection = mysql.createConnection({host:'localhost', user: 'root', database: 'test'});

// simple query
connection.query('SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45', function (err, results, fields) {
  console.log(results); // results contains rows returned by server
  console.log(fields); // fields contains extra meta data about results, if available
});

// with placeholder
connection.query('SELECT * FROM `table` WHERE `name` = ? AND `age` > ?', ['Page', 45], function (err, results) {
  console.log(results);
});
