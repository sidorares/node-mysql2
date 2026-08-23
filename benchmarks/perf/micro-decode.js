'use strict';

// Micro-benchmark: candidate implementations for short-string decoding and
// text datetime parsing, the two dominant CPU items in the profiles.

function bench(name, iters, fn) {
  // warmup
  for (let i = 0; i < iters / 4; i++) fn(i);
  const t0 = process.hrtime.bigint();
  let sink = 0;
  for (let i = 0; i < iters; i++) {
    const v = fn(i);
    if (typeof v === 'string') sink += v.length;
    else sink += Number(v) & 1;
  }
  const ns = Number(process.hrtime.bigint() - t0);
  console.log(
    `${name.padEnd(52)} ${(ns / iters).toFixed(1).padStart(8)} ns/op  (sink ${sink & 0xff})`
  );
}

console.log('--- string decode, len=12 ascii payload inside larger buffer ---');
const buf = Buffer.alloc(4096);
buf.write('xxxxvalue_123_5yyyy', 0);
const S = 4;
const E = 4 + 11;

const hasUtf8Slice = typeof Buffer.prototype.utf8Slice === 'function';
console.log(`utf8Slice available: ${hasUtf8Slice}`);

const N = 3e6;
bench('buf.toString("utf8", s, e)', N, () => buf.toString('utf8', S, E));
bench('buf.utf8Slice(s, e)', N, () => buf.utf8Slice(S, E));
bench('buf.latin1Slice(s, e)', N, () => buf.latin1Slice(S, E));
bench('buf.toString("latin1", s, e)', N, () => buf.toString('latin1', S, E));

function decodeShortAscii(b, s, e) {
  let out = '';
  for (let i = s; i < e; i++) {
    const c = b[i];
    if (c >= 0x80) return null; // caller falls back
    out += String.fromCharCode(c);
  }
  return out;
}
bench('manual fromCharCode concat (ascii check)', N, () =>
  decodeShortAscii(buf, S, E)
);

const CHARCODE_BUF = new Array(64);
function decodeShortAscii2(b, s, e) {
  const len = e - s;
  for (let i = 0; i < len; i++) {
    const c = b[s + i];
    if (c >= 0x80) return null;
    CHARCODE_BUF[i] = c;
  }
  CHARCODE_BUF.length = len;
  return String.fromCharCode.apply(String, CHARCODE_BUF);
}
bench('manual fromCharCode.apply (ascii check)', N, () =>
  decodeShortAscii2(buf, S, E)
);

console.log('\n--- same, len=40 ---');
buf.write('xxxxthis_is_a_longer_string_of_40_characters_ok', 0);
const E2 = 4 + 40;
bench('buf.toString("utf8", s, e) len40', N, () => buf.toString('utf8', S, E2));
bench('buf.utf8Slice len40', N, () => buf.utf8Slice(S, E2));
bench('buf.latin1Slice len40', N, () => buf.latin1Slice(S, E2));
bench('manual concat len40', N, () => decodeShortAscii(buf, S, E2));

console.log('\n--- length-coded int reading (readUInt16LE vs bytes) ---');
bench('buf.readUInt16LE', N, (i) => buf.readUInt16LE(i & 1023));
bench('b[o] | b[o+1]<<8', N, (i) => buf[i & 1023] | (buf[(i & 1023) + 1] << 8));
bench('buf.readUInt32LE', N, (i) => buf.readUInt32LE(i & 1023));
bench('bytes shift 32', N, (i) => {
  const o = i & 1023;
  return (
    (buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16)) + buf[o + 3] * 0x1000000
  );
});

console.log('\n--- datetime: "2020-01-01 13:45:56" -> Date ---');
const dtStr = '2020-01-01 13:45:56';
const dtBuf = Buffer.from(`\x13${dtStr}`); // lenenc string as on the wire
const M = 1e6;
bench('new Date(str)  [current: parseDateTime]', M, () =>
  new Date(dtStr).getTime()
);
bench('new Date(str+"Z")', M, () => new Date(`${dtStr}Z`).getTime());

function digits2(s, i) {
  return (s.charCodeAt(i) - 48) * 10 + (s.charCodeAt(i + 1) - 48);
}
function parseDtString(s) {
  const y = digits2(s, 0) * 100 + digits2(s, 2);
  const mo = digits2(s, 5);
  const d = digits2(s, 8);
  const h = digits2(s, 11);
  const mi = digits2(s, 14);
  const se = digits2(s, 17);
  let ms = 0;
  if (s.length > 20) {
    ms = Number(s.slice(20, 23).padEnd(3, '0'));
  }
  return new Date(y, mo - 1, d, h, mi, se, ms);
}
bench('manual digits from string + new Date(y,..)', M, () =>
  parseDtString(dtStr).getTime()
);

function parseDtBuffer(b, s) {
  const d2 = (o) => (b[s + o] - 48) * 10 + (b[s + o + 1] - 48);
  const y = d2(0) * 100 + d2(2);
  return new Date(y, d2(5) - 1, d2(8), d2(11), d2(14), d2(17), 0);
}
bench('manual digits from buffer + new Date(y,..)', M, () =>
  parseDtBuffer(dtBuf, 1).getTime()
);
bench('manual digits from buffer + Date.UTC', M, () => {
  const b = dtBuf;
  const s = 1;
  const d2 = (o) => (b[s + o] - 48) * 10 + (b[s + o + 1] - 48);
  const y = d2(0) * 100 + d2(2);
  return Date.UTC(y, d2(5) - 1, d2(8), d2(11), d2(14), d2(17), 0);
});

console.log('\n--- date only: "2020-05-06" ---');
bench('current parseDate path approx (parseInt x3 + new Date)', M, () => {
  const y = 2020,
    m = 5,
    d = 6;
  return new Date(y, m - 1, d).getTime();
});
bench('new Date("2020-05-06")', M, () => new Date('2020-05-06').getTime());
