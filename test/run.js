#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { EOL } = require('node:os');

const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const startTime = Date.now();
const filter = process.env.FILTER ? new RegExp(escapeRegExp(process.env.FILTER), 'i') : null;

const format = {
  time: startTime => {
    const elapsedTime = Date.now() - startTime;
    const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor((elapsedTime / 1000) % 60)
      .toString()
      .padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },
  counter: (current, total, pad = ' ') => {
    const totalDigits = String(total).length;
    return `${String(current).padStart(totalDigits, pad)}`;
  },
  percent: (current, total) => {
    const percentage = ((current / total) * 100).toFixed(0);
    return `${format.counter(percentage, 100)}%`;
  },
};

const getFiles = (dirPath, files = []) => {
  const currentFiles = fs.readdirSync(dirPath);

  for (const file of currentFiles) {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (
      (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) &&
      (!filter || fullPath.match(filter))
    ) {
      files.push(fullPath);
    }
  }

  return files;
};

const runTestFile = filePath =>
  new Promise(resolve => {
    const child = spawn('node', [filePath], { stdio: 'inherit' });

    child.on('close', code => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    child.on('error', err => {
      console.log(`Failed to start test: ${filePath}`, err);
      resolve(false);
    });
  });

const runTests = async dir => {
  const testDir = path.join(__dirname, dir);
  const files = getFiles(testDir);
  const totalTests = files.length;

  let passed = true;

  console.log(`${EOL}Directory: ${path.relative(process.cwd(), testDir)}${EOL}`);

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileRelative = path.relative(process.cwd(), filePath);
    const testPassed = await runTestFile(filePath);
    const testNumber = i + 1;
    const elapsedTime = format.time(startTime);
    const counter = format.counter(
      testNumber,
      totalTests,
    );
    const percent = format.percent(
      testNumber,
      totalTests,
    );
    const command = `node ${fileRelative}`;
    const log = `${elapsedTime} ${counter}/${totalTests} ${percent} ${command}`;

    if (testPassed) {
      console.log(`✅ [ 0 ${log} ]`, EOL);
    } else {
      console.log(`❌ [ 1 ${log} ]`, EOL);
      passed = false;
    }
  }

  return passed;
};

(async () => {
  const unitTestsPassed = await runTests('./unit');
  const integrationTestsPassed = await runTests('./integration');

  if (!unitTestsPassed || !integrationTestsPassed) {
    console.log('Some tests failed.');
    process.exit(1);
  } else {
    console.log('All tests passed.');
    process.exit(0);
  }
})();

process.on('exit', code => {
  console.log(`About to exit with code: ${code}`);
});

process.on('unhandledRejection', reason => {
  console.log('unhandledRejection', reason);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.log('uncaughtException', err);
  process.exit(1);
});
