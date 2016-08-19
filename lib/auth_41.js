/*
4.1 authentication: (http://bazaar.launchpad.net/~mysql/mysql-server/5.5/view/head:/sql/password.c)

  SERVER:  public_seed=create_random_string()
           send(public_seed)

  CLIENT:  recv(public_seed)
           hash_stage1=sha1("password")
           hash_stage2=sha1(hash_stage1)
           reply=xor(hash_stage1, sha1(public_seed,hash_stage2)

           // this three steps are done in scramble()

           send(reply)


  SERVER:  recv(reply)
           hash_stage1=xor(reply, sha1(public_seed,hash_stage2))
           candidate_hash2=sha1(hash_stage1)
           check(candidate_hash2==hash_stage2)

server stores sha1(sha1(password)) ( hash_stag2)
*/

var crypto = require('crypto');
var Buffer = require('safe-buffer').Buffer;

function sha1 (msg, msg1, msg2) {
  var hash = crypto.createHash('sha1');
  hash.update(msg);
  if (msg1) {
    hash.update(msg1);
  }

  if (msg2) {
    hash.update(msg2);
  }

  return hash.digest();
}

function xor (a, b) {
  if (!Buffer.isBuffer(a)) {
    a = Buffer.from(a, 'binary');
  }

  if (!Buffer.isBuffer(b)) {
    b = Buffer.from(b, 'binary');
  }

  var result = Buffer.allocUnsafe(a.length);

  for (var i = 0; i < a.length; i++) {
    result[i] = (a[i] ^ b[i]);
  }
  return result;
}

function token (password, scramble1, scramble2) {
  // TODO: use buffers (not sure why strings here)
  if (!password) {
    return Buffer.alloc(0);
  }
  var stage1 = sha1(password);
  return module.exports.calculateTokenFromPasswordSha(stage1, scramble1, scramble2);
}

module.exports.calculateTokenFromPasswordSha = function (passwordSha, scramble1, scramble2) {
  var stage2 = sha1(passwordSha);
  var stage3 = sha1(scramble1, scramble2, stage2);
  return xor(stage3, passwordSha);
};

module.exports.calculateToken = token;

module.exports.verifyToken = function (publicSeed1, publicSeed2, token, doubleSha) {
  var hashStage1 = xor(token, sha1(publicSeed1, publicSeed2, doubleSha));
  var candidateHash2 = sha1(hashStage1);
  // TODO better way to compare buffers?
  return candidateHash2.toString('hex') == doubleSha.toString('hex');
};

module.exports.doubleSha1 = function (password) {
  return sha1(sha1(password));
};
