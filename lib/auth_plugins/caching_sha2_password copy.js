// https://mysqlserverteam.com/mysql-8-0-4-new-default-authentication-plugin-caching_sha2_password/
//

const PLUGIN_NAME = 'caching_sha2_password';
const crypto = require('crypto');

const REQUEST_SERVER_KEY_PACKET = Buffer.from([2]);
const FAST_AUTH_SUCCESS_PACKET = Buffer.from([3]);
const PERFORM_FULL_AUTHENTICATION_PACKET = Buffer.from([4]);

const STATE_INITIAL = 0;
const STATE_TOKEN_SENT = 1;
const STATE_WAIT_SERVER_KEY = 2;
const STATE_FINAL = -1;

function sha256(msg) {
  var hash = crypto.createHash('sha256');
  hash.update(msg, 'binary');
  return hash.digest('binary');
}

function _sha256(msg) {
  const hash = crypto.createHash('sha256');
  hash.update(msg);
  return hash.digest();
}

function xor(a, b) {
  const result = Buffer.allocUnsafe(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

function calculateToken(password, scramble) {
  if (!password) {
    return Buffer.alloc(0);
  }
  const stage1 = sha256(Buffer.from(password, 'utf8').toString('binary'));
  console.log('=  stage1', Buffer.from(stage1));
  const stage2 = sha256(stage1);
  console.log('=  stage2', Buffer.from(stage2));
  const stage3 = sha256(stage2 + scramble.toString('binary'));
  return xor(stage1, stage3);
}

// function calculateToken2(password, scramble) {
//   if (!password) {
//     return Buffer.alloc(0);
//   }
//   const stage1 = _sha256(password);
//   console.log('__ stage1', stage1);
//   const stage2 = _sha256(stage1);
//   console.log('__ stage2', stage2);
//   const stage3 = _sha256(Buffer.concat([stage2, scramble]));
//   return xor(stage1, stage3);
// }

function encrypt(password, scramble, key) {
  const stage1 = xor(
    Buffer.from(password + '\0', 'utf8').toString('binary'),
    scramble.toString('binary')
  );
  return crypto.publicEncrypt(key, stage1);
}

/*
const scr = Buffer.from('2f 76 4a 39 55 2b 76 49 54 6a 13 43 25 7c 01 7d 49 13 0e 75'.split(' ').join(''), 'hex');
const pw = Buffer.from('my-secret-pw');
console.log(calculateToken(pw, scr));
console.log(calculateToken2(pw, scr));
*/

module.exports = pluginOptions => ({ connection }) => {
  let state = 0;
  let scramble = null;

  const password = connection.config.password;

  const authWithKey = serverKey => {
    console.log('====== SCRAMBLE:', scramble, scramble.length);
    const _password = encrypt(password, scramble, serverKey);
    state = STATE_FINAL;
    return _password;
  };

  return data => {
    console.log(
      '===== authSwitchHandler  ==',
      state,
      data,
      data ? data.toString() : '=='
    );
    console.log(password);

    switch (state) {
      case STATE_INITIAL:
        scramble = data.slice(0, 20);
        const token = calculateToken(password, scramble);
        state = STATE_TOKEN_SENT;
        return token;

      case STATE_TOKEN_SENT:
        if (FAST_AUTH_SUCCESS_PACKET.equals(data)) {
          state = STATE_FINAL;
          return null;
        }

        if (PERFORM_FULL_AUTHENTICATION_PACKET.equals(data)) {
          if (connection.config.ssl || connection.config.socketPath) {
            state = STATE_FINAL;
            return Buffer.from(password + '\0', 'utf8');
          }

          // if client provides key we can save one extra roundrip on first connection
          if (connection.secureAuth && connection.secureAuth.key) {
            return authWithKey(serverKey);
          }

          state = STATE_WAIT_SERVER_KEY;
          return REQUEST_SERVER_KEY_PACKET;
        }
        throw new Error(
          `Invalid AuthMoreData packet received by ${PLUGIN_NAME} plugin in STATE_TOKEN_SENT state.`
        );
      case STATE_WAIT_SERVER_KEY:
        console.log('Server key received, writing encrypted response');
        return authWithKey(data);
      case STATE_FINAL:
        throw new Error(
          `Unexpected data in AuthMoreData packet received by ${PLUGIN_NAME} plugin in STATE_FINAL state.`
        );
    }

    throw new Error(
      `Unexpected data in AuthMoreData packet received by ${PLUGIN_NAME} plugin in state ${state}`
    );
  };
};
