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

async function sha256(msg) {
  const arrayBuffer = await subtleCrypto.digest('SHA-256', typeof msg === 'string' ? textEncoder.encode(msg) : msg)
  return Buffer.from(arrayBuffer)
}

function decodeBase64(b64) {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

// need more test
async function publicEncrypt(key, data) {
  key = key.toString()
  const pemHeader = "-----BEGIN PUBLIC KEY-----\n";
  const pemFooter = "\n-----END PUBLIC KEY-----";
  key = key.trim();
  key = key.substring(pemHeader.length, key.length - pemFooter.length);

  const importedKey = await subtleCrypto.importKey(
    "spki",
    decodeBase64(key),
    { name: "RSA-OAEP", hash: "SHA-1" },
    false,
    ["encrypt"],
  );

  const encryptedData = await subtleCrypto.encrypt(
    {
      name: "RSA-OAEP"
    },
    importedKey,
    data,
  );
  return Buffer.from(encryptedData)
}

module.exports = {
  sha1,
  sha256,
  publicEncrypt
}
