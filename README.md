# Node MySQL 2

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![License][license-image]][license-url]

MySql client for node.js. Written in native JavaScript and aims to be mostly api compatible with [node-mysql](https://github.com/mysqljs/mysql)

[![NPM](https://nodei.co/npm/mysql2.png?downloads=true&stars=true)](https://nodei.co/npm/mysql2/)
[![NPM](https://nodei.co/npm-dl/mysql2.png?months=6)](https://nodei.co/npm/mysql2/)

## Features and Documentation

  - [Fast](https://gist.github.com/sidorares/ffe9ee9c423f763e3b6b)
  - Prepared Statements
  - Promise Wrapper
  - Authentication Switch
  - MySQL Server (API and Mocks)
  - Pooling
  - SSL
  - MySQL Compression
  - Binary Log Protocol Client

Please check [documentation](https://github.com/sidorares/node-mysql2/tree/master/documentation) to get started.

## Acknowledgements

  - Internal protocol is written by @sidorares [MySQL-Native](https://github.com/sidorares/nodejs-mysql-native)
  - Constants, SQL parameters interpolation, Pooling, `ConnectionConfig` class taken from [node-mysql](https://github.com/mysqljs/mysql)
  - SSL upgrade code based on @TooTallNate [code](https://gist.github.com/TooTallNate/848444)
  - Secure connection / compressed connection api flags compatible to [MariaSQL](https://github.com/mscdex/node-mariasql/) client.
  - [Contributors](https://github.com/sidorares/node-mysql2/graphs/contributors)

## Contributing

Want to improve something in `node-mysql2`. Please check [Contributing.md](https://github.com/sidorares/node-mysql2/blob/master/Contributing.md) for detailed instruction on how to get started.


[npm-image]: https://img.shields.io/npm/v/mysql2.svg
[npm-url]: https://npmjs.org/package/mysql2
[node-version-image]: http://img.shields.io/node/v/mysql2.svg
[node-version-url]: http://nodejs.org/download/
[travis-image]: https://img.shields.io/travis/sidorares/node-mysql2/master.svg?label=linux
[travis-url]: https://travis-ci.org/sidorares/node-mysql2
[appveyor-image]: https://img.shields.io/appveyor/ci/sidorares/node-mysql2/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/sidorares/node-mysql2
[downloads-image]: https://img.shields.io/npm/dm/mysql2.svg
[downloads-url]: https://npmjs.org/package/mysql2
[license-url]: https://github.com/sidorares/node-mysql2/blob/master/License
[license-image]: https://img.shields.io/npm/l/mysql2.svg?maxAge=2592000
