## Node MySQL 2

[![Greenkeeper badge](https://badges.greenkeeper.io/sidorares/node-mysql2.svg)](https://greenkeeper.io/)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![License][license-image]][license-url]  

[English](../..) | [简体中文](../zh-cn/) | Português (BR)

> Cliente MySQL para Node.js com foco em performance. Suporta instruções preparadas (*prepared statements*), Codificações *non-utf8*, protocolo de log binário (*binary log protocol*), compressão, SSL e [muito mais](../en).

__Lista de Conteúdos__

  - [História e por que MySQL2](#história-e-por-que-mysql2)
  - [Instalação](#instalação)
  - [Primeira Consulta (*Query*)](#primeira-consulta-query)
  - [Usando Instruções Preparadas (*Prepared Statements*)](#usando-instruções-preparadas-prepared-statements)
  - [Usando Conjuntos de Conexões (*Pool*)](#usando-conjunto-de-conexões-pools)
  - [Usando o *Promise Wrapper*](#usando-o-promise-wrapper)
  - [Resultados em *Array*](#resultados-em-array)
    - [Nível de Conexão](#resultados-em-array)
    - [Nível de Consulta (*Query*)](#resultados-em-array)
  - [API e Configuração](#api-e-configuração)
  - [Documentação](#documentação)
  - [Agradecimentos](#agradecimentos)
  - [Contribuições](#contribuições)

## História e por que MySQL2

O projeto MySQL2 é uma continuação do [MySQL-Native][mysql-native]. O código do analisador de protocolo (*protocol parser*) foi reescrito do zero e a API foi alterada para corresponder ao popular [mysqljs/mysql][node-mysql]. A equipe do MySQL2 está trabalhando em conjunto com a equipe do [mysqljs/mysql][node-mysql] para *fatorar* o código compartilhado e movê-lo para a organização [mysqljs][node-mysql].

O MySQL2 é maioritariamente compatível com a API do [mysqljs][node-mysql] e suporta a maioria de suas funcionalidades. O MySQL2 também oferece essas funcionalidades adicionais:

 - Desempenho mais rápido / melhor
 - [Instruções Preparadas (*Prepared Statements*)](../en/Prepared-Statements.md)
 - Protocolo de log binário MySQL (*MySQL Binary Log Protocol*)
 - [Servidor MySQL](../en/MySQL-Server.md)
 - Estende o suporte para *Encoding* and *Collation*
 - [*Promise Wrapper*](../en/Promise-Wrapper.md)
 - Compressão
 - SSL e [*Authentication Switch*](../en/Authentication-Switch.md)
 - [*Streams* Personalizados](../en/Extras.md)
 - [Conjunto de Conexões (*Pooling*)](#using-connection-pools)

## Instalação

O MySQL2 não tem restrições nativas e pode ser instalado no Linux, Mac OS ou Windows sem qualquer problema.

```bash
npm install --save mysql2
```

## Primeira Consulta (*Query*)

```js
// Obtém o cliente
const mysql = require('mysql2');

// Cria a conexão com o Banco de Dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

// Consulta simples
connection.query(
  'SELECT * FROM `table` WHERE `name` = "Page" AND `age` > 45',
  function(err, results, fields) {
    console.log(results); // "results" contêm as linhas retornadas pelo servidor
    console.log(fields); // "fields" contêm metadados adicionais sobre os resultados, quando disponíveis
  }
);

// Utilizando espaços reservados (placeholders)
connection.query(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Page', 45],
  function(err, results) {
    console.log(results);
  }
);
```

## Usando Instruções Preparadas (*Prepared Statements*)

Com o MySQL2 você também pode obter Instruções Preparadas (Prepared Statements). Dessa forma o MySQL não precisa preparar um plano para a mesma consulta todas as vezes, resultando em um melhor desempenho. Se você não sabe por que isso é importante, veja essa discussão:

- [Como as instruções preparadas (*prepared statements*) podem proteger contra ataques de injeção SQL](http://stackoverflow.com/questions/8263371/how-can-prepared-statements-protect-from-sql-injection-attacks)


O MySQL2 fornece o método auxiliar `execute` que irá preparar e consultar as declarações (*statements*) SQL. Além disso, você também pode usar os métodos `prepare` e `unprepare` para preparar ou desfazer a preparação de declarações (*statements*) manualmente, se necessário.

```js
// Obtém o cliente
const mysql = require('mysql2');

// Cria a conexão com o Banco de Dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

// "execute" irá chamar internamente a preparação e a consulta (query)
connection.execute(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Rick C-137', 53],
  function(err, results, fields) {
    console.log(results); // "results" contêm as linhas retornadas pelo servidor
    console.log(fields); // "fields" contêm metadados adicionais sobre os resultados, quando disponíveis

    // Se você executar a mesma declaração novamente, ela será selecionada a partir do LRU Cache
    // O que economizará tempo de preparação da consulta e proporcionará melhor desempenho.
  }
);
```

## Usando Conjunto de Conexões (*pools*)

O conjunto de conexões (*pools*) ajuda a reduzir o tempo gasto na conexão com o servidor MySQL, reutilizando uma conexão anterior e deixando-as abertas ao invés de fechá-las quando você termina de usá-las.

Isto melhora a latência das consultas (*queries*), pois evita toda a sobrecarga associada à criação de uma nova conexão.

```js
// Obtém o cliente
const mysql = require('mysql2');

// Cria a conexão (pool). As definições específicadas do "createPool" são as predefinições padrões
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // Máximo de conexões inativas; o valor padrão é o mesmo que "connectionLimit"
  idleTimeout: 60000, // Tempo limite das conexões inativas em milissegundos; o valor padrão é "60000"
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
```
O *pool* não estabelece todas as conexões previamente, mas as cria sob demanda até que o limite de conexões seja atingido.

Você pode usar o *pool* da mesma maneira como em uma conexão (usando `pool.query()` e `pool.execute()`):
```js
// Para a inicialização do "pool", veja acima
pool.query("SELECT `field` FROM `table`", function(err, rows, fields) {
  // A conexão é automaticamente liberada quando a consulta (query) é resolvida
});
```

Alternativamente, também existe a possibilidade de adquirir manualmente uma conexão do pool e liberá-la posteriormente:
```js
// Para a inicialização do "pool", veja acima
pool.getConnection(function(err, conn) {
  // Fazer algo com a conexão
  conn.query(/* ... */);
  // Não se esqueça de liberar a conexão quando terminar!
  pool.releaseConnection(conn);
});
```

## Usando o *Promise Wrapper*

O MySQL2 também suporta *Promise* API. O que funciona muito bem com o ES7 *async await*.

```js
async function main() {
  // Obtém o cliente
  const mysql = require('mysql2/promise');
  // Cria a conexão com o Banco de Dados
  const connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'test'});
  // Consulta no Banco de Dados
  const [rows, fields] = await connection.execute('SELECT * FROM `table` WHERE `name` = ? AND `age` > ?', ['Morty', 14]);
}
```

O MySQL2 usa o objeto *`Promise`* padrão disponível no escopo. Mas você pode escolher qual implementação de *`Promise`* deseja usar.
```js
// Obtém o cliente
const mysql = require('mysql2/promise');

// Obtém a implementação de "Promise" (nós usaremos o "bluebird")
const bluebird = require('bluebird');

// Cria a conexão, especificando o "bluebird" como "Promise"
const connection = await mysql.createConnection({host:'localhost', user: 'root', database: 'test', Promise: bluebird});

// Consulta no Banco de Dados
const [rows, fields] = await connection.execute('SELECT * FROM `table` WHERE `name` = ? AND `age` > ?', ['Morty', 14]);
```

O MySQL2 também expõe o método .promise() em *Pools*, então você pode criar conexões "*promise/non-promise*" para o mesmo *pool*.
```js
async function main() {
  // Obtém o cliente
  const mysql = require('mysql2');
  // Cria o "pool"
  const pool = mysql.createPool({host:'localhost', user: 'root', database: 'test'});
  // Agora obtém a instância "Promise wrapped" do "pool"
  const promisePool = pool.promise();
  // Consulta no Banco de Dados usando "Promises"
  const [rows,fields] = await promisePool.query("SELECT 1");
}
```

O MySQL2 também expõe o método .promise() em conexões, para "atualizar" a conexão *non-promise* existente e usá-la como *promise*.
```js
// Obtém o cliente
const mysql = require('mysql2');
// Cria a conexão
const con = mysql.createConnection(
  {host:'localhost', user: 'root', database: 'test'}
);
con.promise().query("SELECT 1")
  .then( ([rows,fields]) => {
    console.log(rows);
  })
  .catch(console.log)
  .then( () => con.end());
```

## Resultados em *Array*

Se você tiver duas colunas com o mesmo nome, pode preferir receber os resultados como um *array*, em vez de um objeto, para evitar conflitos. Isso é uma divergência da biblioteca [Node MySQL][node-mysql].

Por exemplo: `select 1 as foo, 2 as foo`.

Você pode habilitar essa configuração tanto no nível de conexão (aplica-se a todas as consultas), quanto no nível de consulta (aplica-se apenas a essa consulta específica).

### Nível de Conexão
```js
const con = mysql.createConnection(
  { host: 'localhost', database: 'test', user: 'root', rowsAsArray: true }
);
```

### Nível de Consulta (*Query*)
```js
con.query({ sql: 'select 1 as foo, 2 as foo', rowsAsArray: true }, function(err, results, fields) {
  console.log(results); // nessa consulta, "results" contêm um array de arrays ao invés de um array de objetos
  console.log(fields); // "fields" mantêm-se inalterados
});
```

## API e Configuração

O MySQL2 é maioritariamente compatível com a API do [Node MySQL][node-mysql]. Você deve consultar a documentação da API para ver todas as opções disponíveis.

Uma incompatibilidade conhecida é que os valores em `DECIMAL` são retornados como *strings*, enquanto no [Node MySQL][node-mysql] eles são retornados como números. Isso inclui o resultado das funções `SUM()` e `AVG()` quando aplicadas a argumentos `INTEGER`. Isso é feito deliberadamente para evitar a perda de precisão - veja https://github.com/sidorares/node-mysql2/issues/935.

Se você encontrar qualquer outra incompatibilidade com o [Node MySQL][node-mysql], por favor, reporte através do acompanhamento de *Issues*. Nós corrigiremos a incompatibilidade relatada como uma prioridade.

## Documentação

Você pode encontrar a documentação detalhada [aqui](../en) e também pode consultar vários [exemplos](../../examples) de código para compreender conceitos avançados.

## Agradecimentos

  - O protocolo interno é escrito por @sidorares [MySQL-Native](https://github.com/sidorares/nodejs-mysql-native)
  - *Constants*, interpolação de parâmetros SQL, *Pooling* e a classe `ConnectionConfig` foram retirados do [node-mysql](https://github.com/mysqljs/mysql)
  - O Código de atualização SSL é baseado no [código](https://gist.github.com/TooTallNate/848444) feito por @TooTallNate
  - *Flags* de API de conexão segura / comprimida compatíveis com o cliente [MariaSQL](https://github.com/mscdex/node-mariasql/).
  - [Contribuidores](https://github.com/sidorares/node-mysql2/graphs/contributors)

## Contribuições

Quer melhorar algo no `node-mysql2`? Consulte o arquivo [Contributing.md](https://github.com/sidorares/node-mysql2/blob/master/Contributing.md) para instruções detalhadas sobre como começar.


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
[node-mysql]: https://github.com/mysqljs/mysql
[mysql-native]: https://github.com/sidorares/nodejs-mysql-native
