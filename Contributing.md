# Contributing Guidelines

## Introduction

Contributions are always welcomed. You can help `node-mysql2` community in various ways. Here are our major priorities, listed in order of importance.

  - `node-mysql` API incompatibility fixes
  - Documentation
  - Adding tests or improving existing ones
  - Improving benchmarks
  - Bug Fixes
  - TODO from source
  - Performance improvements
  - Add Features

## Security Issues

Please contact project maintainers privately before opening a security issue on Github. It will allow us to fix the issue before attackers know about it.

**Contact**

- Andrey Sidorov, sidorares@yandex.ru

## New Features

Its better to discuss an API before actually start implementing it. You can open an issue on Github. We can discuss design of API and implementation ideas.

## Development

We assume you already have these tools installed on your system
 - MySQL Server
 - Node.JS

As `node-mysql2` is purely JS based you can develop it on Linux, Mac or Windows. Please follow these steps

```bash
# clone node-mysql2
git clone https://github.com/sidorares/node-mysql2.git

cd /path/to/node-mysql2

# install node modules
npm install
```

### Running Tests

Running tests requires MySQL server and an empty database. You can run `bash` command given below to create `test` database

```bash
# assuming MySQL have a user root with no password
echo "CREATE DATABASE test;" | mysql -uroot
```

```sh
# Run once to setup the local environment variables.
export CI=1;
export MYSQL_HOST='0.0.0.0';
export MYSQL_USER='root';
export MYSQL_PASSWORD='root';
export MYSQL_DATABASE='test';

# If test user has no password, unset the `CI` variable.

# Run the full test suite
npm run test
```

Use `FILTER` environment variable to run a subset of tests with matching names, e.g.

```sh
FILTER='test-timestamp' npm run test
# or
FILTER='timeout' npm run test
```
