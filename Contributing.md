[node-mysql]: https://github.com/mysqljs/mysql
[docs-contributing]: https://sidorares.github.io/node-mysql2/docs/contributing/website

# Contributing Guidelines

## Introduction

Contributions are always welcomed. You can help **MySQL2** community in various ways. Here are our major priorities, listed in order of importance:

- [Node MySQL][node-mysql] API incompatibility fixes
- [Documentation][docs-contributing]
- Adding tests or improving existing ones
- Improving benchmarks
- Bug Fixes
- TODO from source
- Performance improvements
- Add Features

---

## Security Issues

Please contact project maintainers privately before opening a security issue on Github. It will allow us to fix the issue before attackers know about it.

### Contact

- Andrey Sidorov, sidorares@yandex.ru

---

## New Features

It's better to discuss an API before actually start implementing it. You can open an issue on Github. We can discuss design of API and implementation ideas.

---

## Development

We assume you already have these tools installed on your system:

- MySQL Server
- Node.JS

As **MySQL2** is purely JS based, you can develop it on Linux, Mac or Windows. Please follow these steps

```bash
# clone node-mysql2
git clone https://github.com/sidorares/node-mysql2.git

cd /path/to/node-mysql2

# install node modules
npm install
```

---

### Commits and Pull Request Titles

To ensure a clean commit history pattern, please use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) format.

Prefixes that will trigger a new release version:

- `fix:` for patches, e.g., bug fixes that result in a patch version release.
- `feat:` for new features, e.g., additions that result in a minor version release.

Examples:

- `fix: message`
- `feat: message`
- `docs: message`
- `fix(module): message`
- `feat(module): message`
- etc.

---

### Including Tests

#### Fixes

Where possible, provide an error test case that your fix covers.

#### Features

Please ensure test cases to cover your features.

---

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

> [!Tip]
> You can also run a single test by performing `node ./test/path-to-test-file`.

For testing **coverage**:

```bash
npm run coverage-test
```
