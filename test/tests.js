const async = require("async");

// Schnorr
const Buffer = require("safe-buffer").Buffer;
const BigInteger = require("bigi");
const schnorr = require("bip-schnorr");
const convert = schnorr.convert;

// sha256
let sha256 = require('js-sha256');

const genKey = require("../helpers/genKey");
const init = require("../helpers/init");
const transfer = require("../helpers/transfer");

var assert = require('assert');
describe('connect', function() {
  // describe('#init()', function() {
  //   it('initializes statechain', async function() {
  //     let [publicKey, privateKey] = genKey()
  //     let serverPublicKey = await init(publicKey)
  //   });
  // });
  describe('#transfer()', function() {
    it('transfers state to new owner', async function() {
      let [publicKey, privateKey] = genKey()
      let serverPublicKey = await init(publicKey)

      let [publicKey2, privateKey2] = genKey()

      let blindedMessage = convert.hash(Buffer.from('muSig is awesome!', 'utf8'));
      let preImage = Buffer.from(sha256([blindedMessage, publicKey2].join(",")), "hex");
      signature = schnorr.sign(BigInteger.fromHex(privateKey), preImage).toString("hex");
      
      let blindedSignature = await transfer(publicKey, publicKey2, signature, blindedMessage)

      console.log(Buffer.from(serverPublicKey, 'hex'), convert.hash(Buffer.from('muSig is awesome!', 'utf8')), Buffer.from(blindedSignature, 'hex'))
      schnorr.verify(Buffer.from(serverPublicKey, 'hex'), convert.hash(Buffer.from('muSig is awesome!', 'utf8')),  Buffer.from(blindedSignature, 'hex'));
      // try {
      //   assert(true);
      // } catch (err) {
      //   assert(false);
      // }
    });
    // it('transfers state with invalid signature', async function() {
    //   let [publicKey, privateKey] = genKey()
    //   let serverPublicKey = await init(publicKey)

    //   let [publicKey2, privateKey2] = genKey()

    //   let blindedMessage = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89";
    //   let preImage = Buffer.from(sha256([blindedMessage, publicKey2].join(",")), "hex");
    //   // Signs with privateKey2 when it should be privateKey
    //   signature = schnorr.sign(BigInteger.fromHex(privateKey2), preImage).toString("hex");

    //   try {
    //     let signedBlindedMessage = await transfer(publicKey, publicKey2, signature, blindedMessage)
    //     assert(false);
    //   } catch (err) {
    //     assert(true);
    //   }
    // });
    // it('verify signed blinded message', async function() {
    //   let [publicKey, privateKey] = genKey()
    //   let serverPublicKey = await init(publicKey)

    //   let [publicKey2, privateKey2] = genKey()

    //   let blindedMessage = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89";
    //   let preImage = Buffer.from(sha256([blindedMessage, publicKey2].join(",")), "hex");
    //   signature = schnorr.sign(BigInteger.fromHex(privateKey), preImage).toString("hex");
      
    //   let signedBlindedMessage;
    //   try {
    //     signedBlindedMessage = await transfer(publicKey, publicKey2, signature, blindedMessage)
    //     assert(true);
    //   } catch (err) {
    //     assert(true);
    //   }

    //   try {
    //     schnorr.verify(Buffer.from(serverPublicKey, "hex"), Buffer.from(blindedMessage, "hex"), Buffer.from(signedBlindedMessage, "hex"))
    //     assert(true);
    //   } catch (err) {
    //     assert(true);
    //   }
    // });
    // it('sign with previous key in statechain', async function() {
    //   let [publicKey, privateKey] = genKey()
    //   let serverPublicKey = await init(publicKey)

    //   let [publicKey2, privateKey2] = genKey()

    //   let blindedMessage = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89";
    //   let preImage = Buffer.from(sha256([blindedMessage, publicKey2].join(",")), "hex");
    //   let signature = schnorr.sign(BigInteger.fromHex(privateKey), preImage).toString("hex");
      
    //   let signedBlindedMessage;
    //   try {
    //     signedBlindedMessage = await transfer(publicKey, publicKey2, signature, blindedMessage)
    //     assert(true);
    //   } catch (err) {
    //     assert(true);
    //   }

    //   try {
    //     schnorr.verify(Buffer.from(serverPublicKey, "hex"), Buffer.from(blindedMessage, "hex"), Buffer.from(signedBlindedMessage, "hex"))
    //     assert(true);
    //   } catch (err) {
    //     assert(true);
    //   }

    //   let [publicKey3, privateKey3] = genKey()
      
    //   let blindedMessage2 = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89";
    //   let preImage2 = Buffer.from(sha256([blindedMessage2, publicKey3].join(",")), "hex");
    //   let signature2 = schnorr.sign(BigInteger.fromHex(privateKey), preImage2).toString("hex");

    //   let signedBlindedMessage2;
    //   try {
    //     signedBlindedMessage2 = await transfer(publicKey, publicKey3, signature2, blindedMessage2)
    //     assert(false);
    //   } catch (err) {
    //     assert(true);
    //   }
    // });
    // it('5 transfer chain test', async function() {
    //   let [publicKeyM, privateKeyM] = genKey()
  
    //   let serverPublicKeyA = await init(publicKeyM)
      
    //   let transitoryPrivKeyX = genKey()
      
    //   for (let i = 0; i < Math.random() * (20 - 2) + 2; i++) {
    //     let TX = "TX";
      
    //     let [publicKeyN, privateKeyN] = genKey() // second key for B
      
    //     let blindedMessage = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89"; // not actually blinded(tx2)
    //     let preImage = Buffer.from(sha256([blindedMessage, publicKeyN].join(",")), "hex");
    //     signature = schnorr.sign(BigInteger.fromHex(privateKeyM), preImage).toString("hex");
      
    //     try {
    //       let signedBlindedMessage = await transfer(publicKeyM, publicKeyN, signature, blindedMessage)
    //       assert(true);
    //     } catch (err) {
    //       assert(false);
    //     }
  
    //     publicKeyM = publicKeyN;
    //     privateKeyM = privateKeyN;
    //   }
    // });
  });
});