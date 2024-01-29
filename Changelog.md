# Changelog

## [3.9.1](https://github.com/sidorares/node-mysql2/compare/v3.9.0...v3.9.1) (2024-01-29)


### Bug Fixes

* **types:** support encoding for string type cast ([#2407](https://github.com/sidorares/node-mysql2/issues/2407)) ([1dc2011](https://github.com/sidorares/node-mysql2/commit/1dc201144daceab0b12193ada0f13dbb25e917f6))

## [3.9.0](https://github.com/sidorares/node-mysql2/compare/v3.8.0...v3.9.0) (2024-01-26)


### Features

* introduce typeCast for `execute` method ([#2398](https://github.com/sidorares/node-mysql2/issues/2398)) ([baaa92a](https://github.com/sidorares/node-mysql2/commit/baaa92a228d32012f7da07826674f7a736e3791d))

## [3.8.0](https://github.com/sidorares/node-mysql2/compare/v3.7.1...v3.8.0) (2024-01-23)


### Features

* **perf:** cache iconv decoder ([#2391](https://github.com/sidorares/node-mysql2/issues/2391)) ([b95b3db](https://github.com/sidorares/node-mysql2/commit/b95b3dbe4bb34e36d0d1be6948e4d8a169d28eed))


### Bug Fixes

* **stream:** premature close when using `for await` ([#2389](https://github.com/sidorares/node-mysql2/issues/2389)) ([af47148](https://github.com/sidorares/node-mysql2/commit/af4714845603f70e3c1ef635f6c0750ff1987a9e))
* The removeIdleTimeoutConnectionsTimer did not clean up when the … ([#2384](https://github.com/sidorares/node-mysql2/issues/2384)) ([18a44f6](https://github.com/sidorares/node-mysql2/commit/18a44f6a0a0b7ef41cc874d7a7bb2d3db83ea533))
* **types:** add missing types to TypeCast ([#2390](https://github.com/sidorares/node-mysql2/issues/2390)) ([78ce495](https://github.com/sidorares/node-mysql2/commit/78ce4953e9c66d6cf40ffc2d252fa3701a2d4fe2))

## [3.7.1](https://github.com/sidorares/node-mysql2/compare/v3.7.0...v3.7.1) (2024-01-17)


### Bug Fixes

* add condition which allows code in callback to be reachable ([#2376](https://github.com/sidorares/node-mysql2/issues/2376)) ([8d5b903](https://github.com/sidorares/node-mysql2/commit/8d5b903f5c24ef6378d4aa98d3fd4e13d39be4db))

## [3.7.0](https://github.com/sidorares/node-mysql2/compare/v3.6.5...v3.7.0) (2024-01-07)


### Features

* **docs:** release documentation website ([#2339](https://github.com/sidorares/node-mysql2/issues/2339)) ([c0d77c0](https://github.com/sidorares/node-mysql2/commit/c0d77c02d2f4ad22b46a712d270fc2654d26de4e))

## [3.6.5](https://github.com/sidorares/node-mysql2/compare/v3.6.4...v3.6.5) (2023-11-22)


### Bug Fixes

* add decodeuricomponent to parse uri encoded special characters in host, username, password and datbase keys ([#2277](https://github.com/sidorares/node-mysql2/issues/2277)) ([fe573ad](https://github.com/sidorares/node-mysql2/commit/fe573addffa64a842ae37994fcd8879cefa933f2))

## [3.6.4](https://github.com/sidorares/node-mysql2/compare/v3.6.3...v3.6.4) (2023-11-21)


### Bug Fixes

* malformed FieldPacket ([#2280](https://github.com/sidorares/node-mysql2/issues/2280)) ([8831e09](https://github.com/sidorares/node-mysql2/commit/8831e092024f8d26fe9272adec8e1a5f115735aa))
* move missing options to `ConnectionOptions ` ([#2288](https://github.com/sidorares/node-mysql2/issues/2288)) ([5cd7639](https://github.com/sidorares/node-mysql2/commit/5cd76396d962da070452800597a6f86829b35bd4))

## [3.6.3](https://github.com/sidorares/node-mysql2/compare/v3.6.2...v3.6.3) (2023-11-03)


### Bug Fixes

* correctly pass values when used with sql-template-strings library ([#2266](https://github.com/sidorares/node-mysql2/issues/2266)) ([6444f99](https://github.com/sidorares/node-mysql2/commit/6444f9953ddb08b1b98cd0d7eb0d939d25d3971a))

## [3.6.2](https://github.com/sidorares/node-mysql2/compare/v3.6.1...v3.6.2) (2023-10-15)


### Bug Fixes

* sql-template-strings/tag compatibility ([#2238](https://github.com/sidorares/node-mysql2/issues/2238)) ([f2efe5a](https://github.com/sidorares/node-mysql2/commit/f2efe5a2ddf9e10a83bf24da2af744061b2ae597))

## [3.6.1](https://github.com/sidorares/node-mysql2/compare/v3.6.0...v3.6.1) (2023-09-06)


### Bug Fixes

* EventEmitter on method signatures to use spread syntax ([#2200](https://github.com/sidorares/node-mysql2/issues/2200)) ([5d21b81](https://github.com/sidorares/node-mysql2/commit/5d21b8127b8b6aa4b0308b6482d707d150403990))

## [3.6.0](https://github.com/sidorares/node-mysql2/compare/v3.5.2...v3.6.0) (2023-08-04)


### Features

* add conn-level `infileStreamFactory` option ([#2159](https://github.com/sidorares/node-mysql2/issues/2159)) ([5bed0f8](https://github.com/sidorares/node-mysql2/commit/5bed0f8f195f615844d5dbe322ebfe47b76ba2f5))

## [3.5.2](https://github.com/sidorares/node-mysql2/compare/v3.5.1...v3.5.2) (2023-07-14)


### Bug Fixes

* Update events that are propagated from pool cluster to include remove ([#2114](https://github.com/sidorares/node-mysql2/issues/2114)) ([927d209](https://github.com/sidorares/node-mysql2/commit/927d20945d664c55209fd95b05b2c68904f51acc))

## [3.5.1](https://github.com/sidorares/node-mysql2/compare/v3.5.0...v3.5.1) (2023-07-10)


### Bug Fixes

* improvements to allow to use Bun and tls  ([#2119](https://github.com/sidorares/node-mysql2/issues/2119)) ([fd44a2a](https://github.com/sidorares/node-mysql2/commit/fd44a2ab9c08961a898edcfef5ba0035467a28ce))
* missing `ResultSetHeader[]` to `query` and `execute` ([f649486](https://github.com/sidorares/node-mysql2/commit/f649486fdd0e95ad9f46c002e385986b52224f68))

## [3.5.0](https://github.com/sidorares/node-mysql2/compare/v3.4.5...v3.5.0) (2023-07-06)


### Features

* improved inspection of columns ([#2112](https://github.com/sidorares/node-mysql2/issues/2112)) ([69277aa](https://github.com/sidorares/node-mysql2/commit/69277aa0430d951d61c485d2cd228c3cd9d4a33c))

## [3.4.5](https://github.com/sidorares/node-mysql2/compare/v3.4.4...v3.4.5) (2023-07-05)


### Bug Fixes

* handle prepare response with actual number of parameter definition less than reported in the prepare header. Fixes [#2052](https://github.com/sidorares/node-mysql2/issues/2052) ([b658be0](https://github.com/sidorares/node-mysql2/commit/b658be0cfbfdec378d71a9d9e70de4a52180cd2d))

## [3.4.4](https://github.com/sidorares/node-mysql2/compare/v3.4.3...v3.4.4) (2023-07-04)


### Bug Fixes

* add `ProcedureCallPacket` to `execute` overloads ([3566ef7](https://github.com/sidorares/node-mysql2/commit/3566ef77a1a45d2cb18b1e32e0a5f4fc325a26cd))
* add `ProcedureCallPacket` to `query` overloads ([352c3bc](https://github.com/sidorares/node-mysql2/commit/352c3bc5504d6cb8d9837771a2fa8673db7eb001))
* add `ProcedureCallPacket` to promise-based `execute` overloads ([8292416](https://github.com/sidorares/node-mysql2/commit/829241604cfd4cd45b6f5bfd7c36082287da5ca0))
* add `ProcedureCallPacket` to promise-based `query` overloads ([0f31a41](https://github.com/sidorares/node-mysql2/commit/0f31a41dcfe65d2953447c7f1a8b5c892f2ceed9))
* create `ProcedureCallPacket` typings ([09ad1d2](https://github.com/sidorares/node-mysql2/commit/09ad1d276fcad6c9e3963d54b56c39c26a57b690))

## [3.4.3](https://github.com/sidorares/node-mysql2/compare/v3.4.2...v3.4.3) (2023-06-30)


### Bug Fixes

* remove acquireTimeout invalid option ([#2095](https://github.com/sidorares/node-mysql2/issues/2095)) ([eb311db](https://github.com/sidorares/node-mysql2/commit/eb311dbb988a4d3adada9774d43a79806a453745))

## [3.4.2](https://github.com/sidorares/node-mysql2/compare/v3.4.1...v3.4.2) (2023-06-26)


### Bug Fixes

* changing type files to declaration type files ([98e6f3a](https://github.com/sidorares/node-mysql2/commit/98e6f3a0b1f2d523dc8cb62c67e49d9589c469eb))

## [3.4.1](https://github.com/sidorares/node-mysql2/compare/v3.4.0...v3.4.1) (2023-06-24)


### Bug Fixes

* `createPool` uri overload ([98623dd](https://github.com/sidorares/node-mysql2/commit/98623dd7fc82cfbe556fc4b92828d382b86625d8))
* `PoolCluster` typings ([3902ca6](https://github.com/sidorares/node-mysql2/commit/3902ca6534fd64a798c5b2dc29402fe396d4a67c))
* create promise-based `PoolCluster` typings ([7f38496](https://github.com/sidorares/node-mysql2/commit/7f38496097fa6d9cfbced604fe0ddc392b1b1979))
* missing `parserCache` in `promise.js` ([7f35cf5](https://github.com/sidorares/node-mysql2/commit/7f35cf5f6e69cc8aa3d2008bf5b0434c4d7ee5ac))
* missing constants in `promise.js` ([4ce2c70](https://github.com/sidorares/node-mysql2/commit/4ce2c70313ecbe2c4c5fd73f34b4ce7d32a9c83c))
* missing keys for `Types` constant ([86655ec](https://github.com/sidorares/node-mysql2/commit/86655ec6ad8ab8deae11a3c4919ae2ee553f4120))
* missing typings for `Charsets` constants ([01f77a0](https://github.com/sidorares/node-mysql2/commit/01f77a0db471682e7c4f523bde1189fc5d11d43d))
* missing typings for `CharsetToEncoding` constants ([609229a](https://github.com/sidorares/node-mysql2/commit/609229a973031615cb93b5678b5932cf3714480f))
* missing typings for `parserCache` ([891a523](https://github.com/sidorares/node-mysql2/commit/891a523939120666e8d85db634262889657aff45))
* missing typings for `Types` constant ([04601dd](https://github.com/sidorares/node-mysql2/commit/04601ddbd1430b37a7a7ab8d8d63ad27bd00bb54))
* rename file of typings `Charsets` constants ([51c4196](https://github.com/sidorares/node-mysql2/commit/51c4196d50472eb18e440ea0291f2b571a3e7585))

## [3.4.0](https://github.com/sidorares/node-mysql2/compare/v3.3.5...v3.4.0) (2023-06-19)


### Features

* support STATE_GTIDS session track information ([2b1520f](https://github.com/sidorares/node-mysql2/commit/2b1520f4c5c11cda30d69e8b8b20ff03ec469099))

## [3.3.5](https://github.com/sidorares/node-mysql2/compare/v3.3.4...v3.3.5) (2023-06-12)


### Bug Fixes

* `createPool` `promise` as `PromisePool` ([#2060](https://github.com/sidorares/node-mysql2/issues/2060)) ([ff3c36c](https://github.com/sidorares/node-mysql2/commit/ff3c36ca8b092f8ab16fc81400f6c63524cd971d))
* keepAliveInitialDelay not taking effect ([#2043](https://github.com/sidorares/node-mysql2/issues/2043)) ([585911c](https://github.com/sidorares/node-mysql2/commit/585911c5d5d4b933e32e5a646574af222b63f530))

## [3.3.4](https://github.com/sidorares/node-mysql2/compare/v3.3.3...v3.3.4) (2023-06-11)


### Bug Fixes

* `PromisePoolConnection` import name ([76db54a](https://github.com/sidorares/node-mysql2/commit/76db54a91e2f9861605d5975158701233879d02c))
* `releaseConnection` types and promise ([4aac9d6](https://github.com/sidorares/node-mysql2/commit/4aac9d6a1b379253fa90195ffdc98886b3b87a1b))

## [3.3.3](https://github.com/sidorares/node-mysql2/compare/v3.3.2...v3.3.3) (2023-05-27)


### Bug Fixes

* add package.json to exports ([#2026](https://github.com/sidorares/node-mysql2/issues/2026)) ([09fd305](https://github.com/sidorares/node-mysql2/commit/09fd3059cd91c655e494e40dc4365e58ed069b13))

## [3.3.2](https://github.com/sidorares/node-mysql2/compare/v3.3.1...v3.3.2) (2023-05-23)


### Bug Fixes

* respect enableKeepAlive option ([#2016](https://github.com/sidorares/node-mysql2/issues/2016)) ([f465c3e](https://github.com/sidorares/node-mysql2/commit/f465c3edc707d34a11d9b1796b9472824fdb35df))

## [3.3.1](https://github.com/sidorares/node-mysql2/compare/v3.3.0...v3.3.1) (2023-05-11)


### Bug Fixes

* LRU constructor ([#2004](https://github.com/sidorares/node-mysql2/issues/2004)) ([fd3d117](https://github.com/sidorares/node-mysql2/commit/fd3d117da82cc5c5fa5a3701d7b33ca77691bc61))
* Missing types in "mysql" import ([#1995](https://github.com/sidorares/node-mysql2/issues/1995)) ([b8c79d0](https://github.com/sidorares/node-mysql2/commit/b8c79d055762e927da147d08fb375cd11d303868))

## [3.3.0](https://github.com/sidorares/node-mysql2/compare/v3.2.4...v3.3.0) (2023-05-06)


### Features

* Added updated/new error codes gathered from MySQL 8.0 source code ([#1990](https://github.com/sidorares/node-mysql2/issues/1990)) ([85dc6e5](https://github.com/sidorares/node-mysql2/commit/85dc6e56310db1d78078588f48714f574873eec3))

## [3.2.4](https://github.com/sidorares/node-mysql2/compare/v3.2.3...v3.2.4) (2023-04-25)


### Bug Fixes

* **server:** Added missing encoding argument to server-handshake ([#1976](https://github.com/sidorares/node-mysql2/issues/1976)) ([a4b6b22](https://github.com/sidorares/node-mysql2/commit/a4b6b223434d1cbdb5af9141cf3bd085459bb6b8))

## [3.2.3](https://github.com/sidorares/node-mysql2/compare/v3.2.2...v3.2.3) (2023-04-16)


### Bug Fixes

* **types:** add decimalNumbers to createConnection/createPool typings. fixes [#1803](https://github.com/sidorares/node-mysql2/issues/1803) ([#1817](https://github.com/sidorares/node-mysql2/issues/1817)) ([bb48462](https://github.com/sidorares/node-mysql2/commit/bb48462db7b83bd4825a3d53e192e5363139ec3c))

## [3.2.2](https://github.com/sidorares/node-mysql2/compare/v3.2.1...v3.2.2) (2023-04-16)


### Bug Fixes

* `ConnectionOptions` conflict between `mysql` and `mysql/promise` ([#1955](https://github.com/sidorares/node-mysql2/issues/1955)) ([eca8bda](https://github.com/sidorares/node-mysql2/commit/eca8bda9305ab07cf0e46f16f3f13bf1fd82787d))

## [3.2.1](https://github.com/sidorares/node-mysql2/compare/v3.2.0...v3.2.1) (2023-04-13)


### Bug Fixes

* Add typings for Connection.promise(). ([#1949](https://github.com/sidorares/node-mysql2/issues/1949)) ([e3ca310](https://github.com/sidorares/node-mysql2/commit/e3ca3107cbae0050d307f02514598aff4e8ecd60))
* PoolConnection redundancy when extending Connection interface in TypeScript ([7c62d11](https://github.com/sidorares/node-mysql2/commit/7c62d1177e79b5063a11fa15a2ac4e3dc3e2a2ed))

## [3.2.0](https://github.com/sidorares/node-mysql2/compare/v3.1.2...v3.2.0) (2023-03-03)


### Features

* maxVersion ssl option to tls.createSecureContext ([0c40ef9](https://github.com/sidorares/node-mysql2/commit/0c40ef9f596fa3bc4f046f523c3595fe7065fde3))

## [3.1.2](https://github.com/sidorares/node-mysql2/compare/v3.1.1...v3.1.2) (2023-02-08)


### Bug Fixes

* update `lru-cache` reset method to clear ([114f266](https://github.com/sidorares/node-mysql2/commit/114f266b18802e52d6b130c2cf379f61a996c2b0))

## [3.1.1](https://github.com/sidorares/node-mysql2/compare/v3.1.0...v3.1.1) (2023-02-07)


### Bug Fixes

* remove accidental log in caching_sha2_password.js ([c1202b6](https://github.com/sidorares/node-mysql2/commit/c1202b673c8ba9f709c3ebc0d1717ccffca1bd4b))

## [3.1.0](https://github.com/sidorares/node-mysql2/compare/v3.0.1...v3.1.0) (2023-01-30)


### Features

* cleanup buffer/string conversions in hashing/xor helpers that were failing in Bun ([a2392e2](https://github.com/sidorares/node-mysql2/commit/a2392e27de64630affb6e3f6af26f5c59e2e95f9))


### Bug Fixes

* when port is pased as a string convert it to a number (Bun's net.connect does not automatically convert this) ([703ecb2](https://github.com/sidorares/node-mysql2/commit/703ecb2f788cf32acb1b49c7786ff6845640e215))

## [3.0.1](https://github.com/sidorares/node-mysql2/compare/v3.0.0...v3.0.1) (2023-01-13)


### Miscellaneous Chores

* release 3.0.1 ([d5a6b2c](https://github.com/sidorares/node-mysql2/commit/d5a6b2ccccc7db4176c880e83c70ccd0be4ad81e))

## [3.0.0](https://github.com/sidorares/node-mysql2/compare/v3.0.0-rc.1...v3.0.0) (2023-01-12)

* named-placeholders library is updated to use newer `lru-cache` dependency, allowing it do dedupe and be shared between mysql2 and named-placeholders - https://github.com/sidorares/node-mysql2/issues/1711, https://github.com/mysqljs/named-placeholders/pull/19
* `chai` and `mocha` moved to devDependencies #1774
* Amazon RDS ssl certificates updated including AWS China #1754
* `TCP_NODELAY` flag enabled, avoiding long connect timeout in some scenarios #1751
* typing improvements: #1675, #1674
* fix:  ensure pooled connections get released #1666

### Miscellaneous Chores

* release 3.0.0 ([11692b2](https://github.com/sidorares/node-mysql2/commit/11692b223ff26784089f444ca6291295bd0e405e))

## [3.0.0-rc.1](https://github.com/sidorares/node-mysql2/compare/v2.3.3...v3.0.0-rc.1) (2022-11-06)


### Bug Fixes

* **typings:** Add the infileStreamFactory option to the type definition ([bf9cc4c](https://github.com/sidorares/node-mysql2/commit/bf9cc4c41e72f4a9014659a22b131739524bda1c))
* webpack projects no longer show warning for cardinal dependency ([26c56ae](https://github.com/sidorares/node-mysql2/commit/26c56ae64846814eb8234c0d352871a7b6651d66))


### Miscellaneous Chores

* v3.0.0-rc.1 changes ([1b684bb](https://github.com/sidorares/node-mysql2/commit/1b684bbf8047200e5de5dd18874872880237de2f))

3.0.0-rc.1 ( 6/11/2021 )
  - fix .ping() return value signature #1650
  - documentation: clarify `SUM()` and `AVG()` 
    return types difference with mysqljs/myql    #1649
  - misc: add release-please action              #1631, #1647
  - fix: .end() callback is not called 
    when connection is in closed state           #1642, #1638
  - typescript: getConnection typings fix        #1620
  - fix uncatchable exception                    #1359
  - add mysql_clear_password built in support    #1552
  - typescript: typings unit test, variouts type 
    improvements, server protocol additions      #1610, #1610
  - typescript: more complete way of adding 
    typings for the Server module                #1606
  - typescript, documentation: improve prepared 
    typings statements                           #1493
  - typescript: add type declarations for Prepare 
    & PrepareStatementInfo                       #1565
  - fix: webpack projects no longer show warning 
    for cardinal dependency                      #1589
  - typescript: accept Buffer and Buffer[] in 
    typings for key, cert, and ca                #1599
  - fix: use rotatingXor instead of xor in 
    sha256_password plugin                       #1592, #1044
  - documentation: add Simplified Chinese        #1572
  - fix: add type as an alias to columnType      #1546, #1549
  - Update collation list up to MySQL 8.0.26     #1410
  - typescript: Add minVersion for ssl option.   #1517
  - Add support for multi-factor authentication  #1436
  - typescript: add namedPlaceholders option to 
    QueryOptions interface                       #1475
  - fix: update how the ECONNRESET error is 
    caught when connection already closing       #1438


2.3.3 ( 14/11/2021 )
  - no changes compared to 2.3.3-rc.0

2.3.3-rc.0 ( 5/11/2021 )
  - fix ColumnDefinition.db is broken when 
    encoding is not utf-8                         #1423                 
  - typeCast: Fix field.length to be number       #1427, #1426
  - initiall support for coverage reporting in CI #1425
  - fix performance regression for results with   #1445, #1432
    large (300+) number of columns                
                                                  

2.3.2 ( 16/10/2021 )
  - fix regression causing typeCast + JSON field
    to error                                      #1418, #1420

2.3.1 ( 15/10/2021 )
  - Update error codes up to mysql 8.0.26          #1411
  - perf: optimize Query.row call                  #1408
  - build: update to node 12/14/16, migrate from 
    travis-ci and appveyor to GH actions, add perf
    benchmarking workflow                          #1406, #1399
  - perf: avoid leaking TextRow/BinaryRow object   #1402
  - perf: optimize string decoding by removing 
    the use of slice()                             #1401
  - perf: cache lazy-evaluated fields              #1400
  - fix: clear timeout after error                 #1390
  - TS: adds the optional column changedRows to 
    ResultSetHeader                                #1377

2.3.0 ( 5/08/2021 )
  - Add PoolCluster promise wrappers               #1369, #1363
  - support for connect and query timeouts         #1364
  - add missing query() method on PoolCluster      #1362
  - fix incorrect parsing of passwords 
    containing ":"                                 #1357
  - handle errors generated by asynchronous 
    authentication plugins                         #1354
  - add proper handshake fatal error handling      #1352
  - fix tests to work with the latest MySQL 
    server versions (up to 8.0.25)                 #1338
  - expose SQL query in errors                     #1295
  - typing and readme docs for rowAsArray          #1288
  - allow unnamed placeholders even if the 
    namedPlaceholders flag is enabled              #1251
  - better ESM support                             #1217
  
2.2.5 ( 21/09/2020 )
  - typings: add ResultSetHeader                   #1213

2.2.4 ( 21/09/2020 )
  - use bundled types/mysql instead of dependency  #1211

2.2.3 ( 21/09/2020 )
  - use github:types/mysql as base for types       #1208

2.2.2 ( 19/09/2020 )
  - Add the authPlugins types to ConnectionOptions #1206

2.2.1 ( 18/09/2020 )
  - update package.json files entry to include 
    type definition files                          #1205

2.2.0 ( 18/09/2020 )
  - added TS type definitions                      #1204, #1028
  - better error handling for invalid JSON row 
    responses                                      #915
  - fix for iconv-lite and some bundlers issues    #1187
  - error early when callbacks incorrectly passed  #1025
    to a promise wrapper
  - add support for sha256_password authentication #1153, #1152
    plugin                                          
  - handle backpressure when loading data from     #1167
    file
  - Pass in the callback when ending the pool      #1170
    connection
  - allow using `dateStrings` with specific types  #1200
  - Fix incompatibility with code minimizers       #1191
  - fix with connect timeout timer cleanup after   #950
    error
  - Add ES Module Support                          #1169, #1100
  - Release connection on exception                #1108
  - Add table to parser cache key                  #1142, #1143
  - Fix Connection.connect callback may never      #1136, #1137
    be executed
  - "cardinal" no longer is a requred dependency   #1135
  - Fix incompatibility when zero parameter        #1129, #1130

2.1.0
  - added `enableKeepAlive` connection option      #1081, #683

2.0.2
  - Fix for clearing connection timeout state when 
    connection is re-attempted (failure or success) #1075
  - Avoid setting numeric config options to NaN     #1074, #721
  - PoolCluster#end now accepts a callback function #1065, #1063

2.0.1
  - Add missing authPlugins assignment in 
    ConnectionConfig                                 #1052
  - Fix 4.1 auth on old servers not 
    supporting PLUGIN_AUTH                           #1062, #1054, #1053

2.0.0
  - Mysql8 caching_sha2_password - fix bug in 
    authenticating when password is longer 
    than 19 chars                                     #1044 #1045
  - Support ConnectionConfig.flags as an array        #1003

2.0.0-alpha1
  - MAJOR: new `authPlugins` api replacing 
    `authSwitchHandler`, added caching_sha2_password 
    and mysql_native_password as default plugins.
    Added tests for mysql 8 and ssl. Mysql 8 server
    now supported with default settings.              #1021, #906, #991
  - MAJOR: LOCAL INFILE does not automatically read   #1034
    from the local fs and now requires an explicit
    `infileStreamFactory` to be specified in query options.
  - Update to 2019 CA Amazon RDS certificates         #1032
  - Update SSL Profile for AWS Serverless Aurora      #1026
  - fix pool ignoring namedPlaceholders config        #1022

1.7.0
  - Fix crashing when session info packet does not 
    start with length-coded string                    #1004, #989
  - build: drop node 4 and 6 and add node v12         #997
  - Add support for timezone connection option        #996, #15, #262, 
                                                      #642, #877, #888
  - Make mysql2 compatible with minification          #992, #890, #899, 
                                                      #890
  - fix serialisation of '00:00:00' time              #968, #967
  - Allow to set minVersion ssl option                #961, #960
  - Fix a MaxListenersExceededWarning with stream 
    local infile                                      #965

1.6.5 (08/02/2019)
  - allow to use namedPlaceholders flag per query     #879
  - migrate to more modern code style ( classes /
   arrow functions )                                  #861, #870
  - be more defencive about ssl config object         #895
  - fix(debug): remove usage of callee                #882

1.6.4 (08/11/2018)
 - revert changes breaking node v4 and add v4 to 
   build matrix                                       #872, #873

1.6.3 (06/10/2018)
 - Don't treat selector-making function as a class.   #869, #871

1.6.2 (05/10/2018)
 - Fix "Socket ended by other party" error            #447, #867, #868
 - replace var with let/const                         #849
 - Fix "close emitted before end" error               #711, #859
 - fix docs                                           #856
 - migrate to es6 classes where appropriate           #848

1.6.1 (02/08/2018)
 - Fix missing Promise option in checks for Pool      #826

1.6.0 (01/08/2018)
 - Fixed `PromiseConnection.ping()` ignoring errors   #813
 - Added a uri parameter to the connection config     #815
 - Added a `.promise()` method shortcut on Pool,
   Connection and PoolConnection                      #810 
 - Added more functions from node-mysql:
   `createQuery`, `raw`, `escape`, `escapeId`,
   `format`                                           #799
 - Added `acquire` and `release` and release events
   on Connection                                      #783
 - Added support for a Japanese charset `ujis`        #772
 - Improved error handling on `ECONNRESET`            #768
 - Drop support for Node 4                            #791

1.5.3 (19/03/2018)
 - fix incorrect denque dependency                     #740
 - build: bump to node 8.10 and 6.16
 - use strich lru-cache version                        #751
 - bump sqlstring to 2.3.1
 - remove noAssert flag from Buffer functions          #748
 
1.5.2 (06/02/2018)
 - perf: Store Compiled Packet Parsers in a global
   cache                                               #722, #723
 - Improve performance of removing connections from
   pools                                               #720
 - use source parameters types with execute, fix
   crash when parameter is undefined                   #718, #705
 - PromisePool to always use the specified promises
   library                                             #697

1.5.1 (19/11/2017)
 - Fix empty buffer incorrectly returned instead of
   NULL value                                          #668, #671
 - promise wrapper: pass sqlMessage from original
   error                                               #682, #678

1.5.0 (13/11/2017)
 - Added sqlMessage to Error callback object           #665
 - Normalized sqlState to a string of 5 chars          #667
   as Mysql specifies it  
 - Remove destroyed promise pool connections from
   pool                                                #674, #672
 - Expose escape & format methods on connection pool   #669, #663
 - Support fractional seconds variable precision for
   the temporal types                                  #660, #659
 - fix null values breaking typeCast behaviour         #652

1.4.2 ( 27/08/2017 )
 - fix null value incorrectly returned as empty
   string from int values in text protocol             #637

 - build: bump to node 8.4
 - promise wrapper: use promise implementation passed
   to PromisePool                                      #631, #632

1.4.1 ( 16/08/2017 )
 - add missing encodings                               #628, #630
 - (binary protocol) Fix parsing microsecond in
   datatime type                                       #629
 - (promise wrapper) Fix handling of errors in promise
   prepared statement execute                          #622

1.4.0 ( 30/07/2017 )
 - fix DATETIME going into incorrect state when
   milliseconds part present                           #618
 - (promise wrapper) add changeUser                    #615, #614, #613
 - redo event delegation in promise wrappers to be     #577, #620, #577, #568
   lazy, self-cleaning

1.3.6 ( 12/07/2017 )
 - fix crash when initial packet from server is error  #607

1.3.5 ( 15/06/2017 )
 - update iconv-lite to 0.4.18 to fix node 8 cesu8
   encoding regression. Add node 8 to  build matrix     #591

1.3.4 ( 13/06/2017 )
 - use safe-buffer in string decoder                    #589, #585
 - allow to use pool.execute() without parameters       #589

1.3.3 ( 8/06/2017 )
 - fix node encodings lookup in string parser           #583, #582
 - fix connection not released to the pool on error     #579, #551, #540, #508, #569
 - better stack traces in promise wrapper               #580, #530

1.3.2 ( 31/05/2017 )
 - fix PromiseConnection.prepare and add                 #574, #575
   PromisePreparedStatementInfo

1.3.1 ( 31/05/2017 )
 - move lint-staged to devDependencies                   #573

1.3.0 ( 29/05/2017 )
 - Make Promise Pool wrapper extend EventEmitter         #567, #468
 - build: integrate prettier                             #563
 - do not send 23 unallocated bytes over wire            #547
 - fix: PromiseConnection missing interface functions
   from Connection                                       #531, #495


1.2.0 ( 17/02/2017 )
 - add new MySQL 5.6/8.0 charsets                        #494
 - build: drop support for node 0.10 and 0.12
 - fix: Connection not released when Pool.Execute
   called without values                                 #509, #485, #488, #475

1.1.2 ( 15/11/2016 )
 - (fix) memory leak introduced with iconv
   encoder/decoder cache                                 #459, #458
 - remove use of domains                                 #451, #449
 - (fix) handle correctly packets over 0xffffff bytes
   long + compressed protocol rewrite                    #421, #248, #419, #426
 - (perf) replace double-ended-queue with denqueue       #444
 - (feat) automatically track client encoding change     #437, #389
 - (feat) add support for CLIENT_SESSION_TRACK info      #388, #436

1.1.1 ( 06/10/2016 )
 - (fix) do not crash when result of execute().stream()
   is paused                                             #174, #424
 - (fix) do not call .destroy() on stream when connect timeout
   is fired (destroy() method exist only on Net stream
   but not on custom streams)                             #417, #414
 - (internal) parser generator now uses generate-function
   package to prepare dynamically generated parser func   #412, #167
 - (docs) fix readme test/code errors                     #413
 - (tests) use docker+mysql 5.7 on travis                 #410
 - (fix) use correct encoding for JSON type (despite
   reported by server BINARY enc utf8 should be used
   instead)                                               #410, #409
 - (docs) refactor readmy to be more firendly for first
   time readers


1.1.0 ( 20/09/2016 )
 - promise wrappers: fix object form parameters being
   ignored                                                #405
 - listen for errors in socket.write, prevent from crash
   when server disconnects mid query. In LOAD INFILE
   command disconnect from input stream when there is
   error                                                  #404 #289 #57 #38
 - ensure prepare+execute commands are enqueued one after
   another (previously execute was appended at the end
   of the queue)                                          #404
 - add linting to readme and docs code                    #403 405
 - build: bump to node 6.6
 - (SEMVER MINOR) use LRU cache to store prepared
   statements add maxPreparedStatements options parameter #401
 - (SEMVER MINOR) support connectTimeout option           #396 #376
 - (SEMVER MINOR) support changedRows in insert results   #400 #299
 - (SEMVER MINOR) allow to use nestTables as connection
   options in addition to query/execute option            #399

1.0.0 ( 16/09/2016 )
 - set default server encoding so that strings from server
   can be decoded before initiol connection handshake packet
   is sent
 - add files section to package.json                      #398

1.0.0-rc.13 ( 14/09/2016 )
 - text protocol: fix a bug the prevented row parser
   from being used                                        #397

1.0.0-rc-12 ( 06/09/2016 )
 - support for non-utf8 server, results, and client
   encodings                                               #302, #374
 - replace deprecated Buffer APIs with Buffer.from
   and Buffer.allocUnsafe                                  #381, #380
 - build: bump to node v6.5

1.0.0-rc-11 ( 14/08/2016 )
 - pool: support namedPlaceholder flag in `pool.query`
   and `pool.execute` helpers                              #369
 - pool: do not emit error on query command if callback    #372
   was passed
 - pool: propagate connection time error back
   to .getConnection()                                     #372

1.0.0-rc-10 ( 09/08/2016 )
 - ssl: do not use deprecated tls.createSecurePair
   if TLSSocket is avaiable                                #367, 363

 - use supportBigNumbers and bigNumberStrings flags in
   parser
 - pass supportBigNumbers and bigNumberStrings from
   `query({sql, ...opts})` and `execute({sql, ...opts})`
   type of calls
 - use supportBigNumbers and bigNumberStrings as part of
   parser key
 - binary protocol: use long.js to calculate resulting
   number from two 32 byte valuse
 - text protocol: fix in detecting potentially big number.
   Split parseLong* into functions with and without big
   number checks, use no check version if type is < long    #366

   documentation:
 - Split documentation into `/documentation` folder with sub
   docs inside this folder
 - Use badge for license
 - Added `.npmignore`                                       #365

 - handle correctly negative insert IDs                     #364, #341, #336
 - build: add v6.3 to matrix
 - docs: add CONTRIBUTING.md                                #138, #359

1.0.0-rc-9 ( 01/08/2016 )
 - remember and send credentials for initial
   AuthSwitch request                                       #331, #357
 - fix re-emitting error event during initial handshake     #356

1.0.0-rc-8 ( 22/07/2016 )
 - enabled use of global typeCast                           #347, #351
 - custom typeCast: fix incorrect buffer() and geometry()   #349
   functions
 - documentation: fix async/await example                   #342

1.0.0-rc-7 ( 03/07/2016 )
 - fix incorrect MockBuffer property assignment             #333
 - implement typeCast option                                #338

1.0.0-rc-6 ( 29/06/2016 )
 - AuthSwitch support and partial support for
   plugin-based authentication                               #331

1.0.0-rc-5 ( 16/06/2016 )
 - Fix incorrect releasing of dead pool connections          #326, #325
 - Allow pool options to be specified as URL params          #327

1.0.0-rc.4 ( 14/06/2016 )
 - fix double-interpolation in pool.query                    #323, #324

1.0.0-rc.3 ( 08/06/2016 )
 - switch to external sqlstring labrary, same
   as used by node-mysql                                     6b559c565f88cf471e52c4e6bbb9ebd631673cb8
 - new built-in Promise api                                  #269
 - server: allow to listen to all packets via 'packet' event #297
 - fix broken rowAsArray flag                                05585aa2420327e5cdbb4d160a22fba30f8a4a39

1.0.0-rc.2 (02/06/2016)
 - add eslintrc                                              #268
 - callbacks on pool.query are never called                  #281 #182 #218
 - allow namedParameters for queries on pool as well         #281
 - (semver-major) server: pass handshake packet in
   'connect' event instead of 'true'                         2c066aca203785bb92ebc3381289813de464e144
 - server: fix packet length calculation for
   multibyte characters input                                #295

1.0.0-rc.1 (17/02/2016)

- (semver-major) remove 'number of statements'
   from callback parameter                                   #192, #266, #45, #46
- fix in deserealisation of binary datetime packet           #260
- return null date as null, not INVALID_DATE.                #244, #247
- fix incorrect name for flag ( binary protocol )            #245, #246
- completely refactored compression protocol support         #252, #173
- server: add serailisation of NULL strings                  #232
- security: SSL does not verify remote certificate           #103, #171
- Allow parameters in query(options) object                  #216, #230
- Pool query now returns query reference                     #183 #230
- perf: use double-ended queue in the pool instead of arrays #227 #228 #156
- JSON type support                                          #207 #208
- build: add node 4.2 and 5.1 to matrix
- Make SSL ciphers configurable                              #190 #103
- Emit enqueue event if conn is queued                       #177 #189
- call command callback if stream was disconnected mid
  command                                                    #202, 204
- use correct variable in error reporting                    #197
- build: add mariadb to tests.                               #191
- add support for named placeholders for field & tables      #176, 205
- update error codes from node-mysql                         #201 209
- bump named-placeholders to 1.0.0, fixes problems with
  placeholders inside quotation ( https://github.com/sidorares/named-placeholders/issues/2 )
- catch exceptions during named placeholders processing      #187


0.15.8 - 22/06/2015
- Add .escapeId() to Connection and Pool                     #180
- Build: iojs 2.2.1 & 2.3.0
- Binary protocol: fix crash when server return null
  for 'NOT NULL' column                                      #178

0.15.7 - ?

0.15.6 - 04/06/2015
- Include errno in error object                              #168
- server: fix fields in OK and column header packets
  (fix errors when connecting with node-mysql)
- build: add iojs 1.8.x to matrix

0.15.5 - 08/04/2015
- fix broken 'stream rows' functionality                     #165, #166
- add io.js 1.6 to build matrix

0.15.4 - 11/03/2015
- added COM_QUIT command, sent from conn.end()               #163, #150
- io.js 1.5
- don't crash on unexpected protocol packets, emit           #164, #160
  connection error event instead

0.15.3 - 24/02/2015
 - multiple results support in binary protocol               #157 #26 #27
 - add io.js 1.4 to CI matrix

0.15.2 - 24/02/2015
 - update Amazon RDS certificates                           #154
 - add io.js 1.3 to CI matrix
 - fix packet parser bug                                     #155

0.15.1 - 18/02/2015
 - add io.js 1.0 - 1.2 to build matrix
 - add windows CI using Appveyor                             #151 #152

0.15.0 - 1/10/2015
 - connection.threadId
 - connection.changeUser()                                   #63
 - named placeholders                                        #117
 - new prepared statements api                               #132 #139
 - support LOAD INFILE                                       #64 #142
 - refactored faster packet parser                           #140
 - lazy parse rarely used column definition fields           #137

0.14.1 - 9/12/2014
 - stream connection option now can be a function            #80
 - bugfix/prepared statements: fix case when no columns
   in statement header but there are columns in results      #130

0.14.0 - 26/11/2014
  - added connection.pause() and connection.resume()         #129

0.13.0
  - connection errors sent to all commands in queue
  - server-side authentication support                       #122
  - server.listen() is now chainable (returns server)
  - allow to login using sha1(password)                      #124
  - Query.sql as alias to Query.query                        #121

0.12.5 - 30/07/2014
  - add 'execute' pool method similar to Pool##query         #114
  - more debug output behind debug flag

0.12.4 - 17/07/2014
  - 'debug' connection option now result in lots of
     debug output                                            #112 #77
  - send corectly compression flag if compression is on      #102


0.12.3 - 11/07/2014
  - fix node 0.8 - incompatible dependency version

0.12.2 - 11/07/2014

  - output milliseconds in date type                         #107
  - deserialise length coded int with > 24 bit numbers
    to js int / float (and not throw "Bignts not supported") #108
  - support for Bigint numbers in insertId

0.12.1 - 30/04/2014

  - 'dateStrings' connection option support                  #99
  - use anonymous function for packet routing instead
    of .bind() 3-5% speed improvement
  - GEOMETRY type support in binary protocol                 #97

0.12.0 - 29/04/2014

  - route connection time errors from handshke command to
    connection                                               #96

  - support for nestTables and rowsAsArray options in query()
    and execute()                                            #95, #94

  - bugfix: date as parameter in prepared statement,
    day of week was used incorrectly
    instead of day of month                                  #89     ab28dfca839728dfe40d941091902185d7c19b57

   - GEOMETRY type support ported from node-mysql            #93     ebd30fd12b3b7f53d97b9d09f947b12f61e0c2c5

0.11.8

  - add DATE type support                                    #84     1d49651d8e40bf43b79937d9de9b2909126b892c
  - faster DATE parsing in text protocol                             cdfed2881462798bd85fbf906ea604875a3bd625


0.11.7
  - initial implementaion of binlog protocol            #83 #78      c8d45da6fc13a56d95ce6d57c3c8aa9524548770
  - interpret null DOUBLE values as null instead 0 #85               4c03b23f30949be0608d9543d69243944d79bb4a
  - use srcEscape for null values (bunary parser)                    ef50bcafa452588eda4a40037b41f6b961085046

0.11.6
  - minor cleanups

0.11.5
  - fix for non-utf strings serialisation (binary protocol only)     cf9594aaab5b3d51a112bd1f43b39a55f508eef7

0.11.4
  - support YEAR type in prepared statements                         a0f33b5a4de4529130b3c4137f7a1dd3c02aed9e

0.11.3
  - add transaction helpers                             #56, #76     cc0a9f9b721900d3a22c7fc84a5244c74cd33dd5

0.11.2

  - wrap callbacks in nextTick for exception safety                  b73ac9868804b603a0ab6df6129cf3682476d118
  - domains support                                          #73     36cba61359c83018a847ac4e7748d920b6f863c4

0.11.1

  - buxfix: connection.connect callback was called more than once
                                                             #72      0352eefdafc0986f1ec79c0ce285f722ca12af16

0.11.0
  - Bundle Amazon RDS cert and allow to connect using                 e6af097b5facc089f1999c1fb076ada0ce2e7e99
    'Amazon RDS' as ssl value

0.10.7

  - Amazon RDS+ssl example and public CA cert                         709394a4afbbaf0500439e72caec5d37e949fe26
  - pool updated from node-mysql                   #71, #68, #61      db561dbe10a55bb0f9893eb0e2c4b429edd6ee3a

0.10.6
  - handle TIMESTAMP type                                    #59      6dd6fc82d95a16e18092c4db4e8da225b37e9314
  - rename pool's connection.end() to connection.release()   #53      c63b2442e3c0fb5ea3953725ba9c1b3e08b2b831

0.10.5

  - node-mysql compatibility: remove 'number of results in response'
    callback argument (Brian White)                          #46       40af0530403a3892743d32974055c5ea23cbd3ec
  - node 0.11 (use on('data') instead of ondata )                      39906c78b85a77e468694814a50f99714d7bbbd6
  - fix again ssl (#41)                                                713051bf997a186774b618cde583707320a1d551

0.10.4
  - node-mysql compatibility: remove 'number of results in response'
    callback argument (Brian White)                          #45       c9cb926360da5e4028f7d2f83f4b4e94897cd8b8
  - 'resultIndex' parameter for non-multiple results query             8879bdde397b6cd730d234383fa322becd1134de

0.10.3
  - various ssl fixes and refactoring (ssl was broken for some time)   213d375f7263cb6f5e724fdac3ea156ccee4bbd4
  - Server protocol: handle null values serialisation
     (Michael Muturi Njonge)                                 #36       831b2a100795f36649f0c3d79b7839a95f771a05

0.10.2
  - return DECIMAL and NEWDECIMAL as string in binary prot   #40       969fba6ff1dbf14d53d3efc9f94083b8306cf0b5

0.10.1
  - Added ping command                                       #38       cbca8648d1282fb57e55b3735c3b4d9a46d89d7b

0.9.2
  - correctly parse NULL result for string and number        #35       0a4ac65ec812f75861dc00c9243921d5d6602914
  - do not pollute global namespace from evaled parser       #11       4b6ddaf0f70150945d0fea804db9106f343a0e51

0.9.1
  - PoolClaster ported from node-mysql                       #34

0.8.21
  - Fix in error message parsing (Noam Wasersprung)          #31       6cc80a67eaa3baac7dd8eee7182c9eb00977e81a
  - return insert/delete header for insert/delete commands   #32       72aa8fe70981d7410a10edb9d7921e5d6ce1d3ca

0.8.20
  - Make packet parser work with 0.11 ondata(buffer) with no start,end 9005fd1
  - Allow to use Date-like objects as date parameters (Amir Livneh)    6138dad0581fd5e2c45e1ce0b999e334db8979cf

0.8.19
  - Multiple results support in text protocol #15                      4812adaf1aa5b1dfa775a6cf0fa3bae54a7827d0
  - Use connection flags from createConnection parameters/url string   9218f055ceeb95ae7205348e06c07b89b799d031
