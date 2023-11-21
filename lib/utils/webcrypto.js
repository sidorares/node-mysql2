'use strict'

const nodeCrypto = require('crypto')

/**
 * The Web Crypto API - grabbed from the Node.js library or the global
 * @type Crypto
 */
// eslint-disable-next-line no-undef
const webCrypto = nodeCrypto.webcrypto || globalThis.crypto
/**
 * The SubtleCrypto API for low level crypto operations.
 * @type SubtleCrypto
 */
const subtleCrypto = webCrypto.subtle
const textEncoder = new TextEncoder()

/**
 *
 * @param {*} length
 * @returns
 */
function randomBytes(length) {
  return webCrypto.getRandomValues(Buffer.alloc(length))
}

async function md5(string) {
  try {
    return nodeCrypto.createHash('md5').update(string, 'utf-8').digest('hex')
  } catch (e) {
    // `createHash()` failed so we are probably not in Node.js, use the WebCrypto API instead.
    // Note that the MD5 algorithm on WebCrypto is not available in Node.js.
    // This is why we cannot just use WebCrypto in all environments.
    const data = typeof string === 'string' ? textEncoder.encode(string) : string
    const hash = await subtleCrypto.digest('MD5', data)
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

// See AuthenticationMD5Password at https://www.postgresql.org/docs/current/static/protocol-flow.html
async function postgresMd5PasswordHash(user, password, salt) {
  const inner = await md5(password + user);
  const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
  return `md5${outer}`
}

/**
 * Create a SHA-256 digest of the given data
 * @param {Buffer} data
 */
async function sha256(text) {
  return await subtleCrypto.digest('SHA-256', text)
}

/**
 * Sign the message with the given key
 * @param {ArrayBuffer} keyBuffer
 * @param {string} msg
 */
async function hmacSha256(keyBuffer, msg) {
  const key = await subtleCrypto.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return await subtleCrypto.sign('HMAC', key, textEncoder.encode(msg))
}

/**
 * Derive a key from the password and salt
 * @param {string} password
 * @param {Uint8Array} salt
 * @param {number} iterations
 */
async function deriveKey(password, salt, iterations) {
  const key = await subtleCrypto.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const params = { name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations }
  return await subtleCrypto.deriveBits(params, key, 32 * 8, ['deriveBits'])
}

function concatenateBuffers(buffer1, buffer2) {
  const combined = new Uint8Array(buffer1.length + buffer2.length);
  combined.set(new Uint8Array(buffer1), 0);
  combined.set(new Uint8Array(buffer2), buffer1.length);
  return combined;
}


async function sha1(msg,msg1,msg2) {
  let concatenatedData = typeof msg === 'string' ? textEncoder.encode(msg) : msg;
  if (msg1) {
    concatenatedData = concatenateBuffers(concatenatedData, typeof msg1 === 'string' ? textEncoder.encode(msg1) : msg1);
  }
  if (msg2) {
    concatenatedData = concatenateBuffers(concatenatedData, typeof msg2 === 'string' ? textEncoder.encode(msg2) : msg2);
  }
  const arrayBuffer = await subtleCrypto.digest('SHA-1', concatenatedData)
  return Buffer.from(arrayBuffer)
}

module.exports = {
  postgresMd5PasswordHash,
  randomBytes,
  deriveKey,
  sha256,
  hmacSha256,
  md5,
  sha1,
}
