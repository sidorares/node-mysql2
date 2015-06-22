0.15.7 - 22/06/2015
- Add .escapeId() to Connection and Pool                     #180
- Build: iojs 2.2.1 & 2.3.0
- Binary protocol: fix crash when server return null
  for 'NOT NULL' column                                      #178

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
