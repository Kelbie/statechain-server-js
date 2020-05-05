// Schnorr
const Buffer = require("safe-buffer").Buffer;
const schnorr = require("bip-schnorr");

// secp256k1
const { randomBytes } = require("crypto");
const secp256k1 = require("secp256k1");

function genKey() {
  let publicKey, privateKey;
  do {
    privateKey = randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));

  publicKey = secp256k1.publicKeyCreate(Buffer.from(privateKey, "hex")).toString("hex");
  privateKey = privateKey.toString("hex");

  return [publicKey, privateKey];
}

module.exports = genKey