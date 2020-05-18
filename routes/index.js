var express = require("express");
var router = express.Router();
// const pay = require('paypercall')({ chargeToken: 'mySecretToken' })

const async = require("async");

const uuidv4 = require("uuid/v4");

// Bitcoin
const bip32 = require('bip32')
const bip39 = require('bip39')

// Paypercall
// const pay = require('paypercall')({ chargeToken: ... })

// Schnorr
const Buffer = require("safe-buffer").Buffer;
const BigInteger = require("bigi");
const schnorr = require("bip-schnorr");
const convert = schnorr.convert;

// secp256k1
const { randomBytes } = require("crypto");
const secp256k1 = require("secp256k1");
const randomBuffer = (len) => Buffer.from(randomBytes(len));

// sha256
const sha256 = require("js-sha256");

// Config
const fs = require('fs');
const toml = require('toml');

const config = toml.parse(fs.readFileSync('./config/statechain.toml', 'utf-8'));

// Postgres
const { Client } = require("pg");

const client = new Client({
  database: process.env.DB_NAME || 'statechain',
  host: process.env.DB_HOST || 'localhost',
  port: 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

client.connect();

const net = require("net")
const {PromiseSocket} = require("promise-socket")

const socket = new net.Socket()

const promiseSocket = new PromiseSocket(socket)

promiseSocket.connect(3333, 'localhost');

router.post("/init", async (req, res, next) => {
    if (!req.body.ownerPubKey) {
        res.status(400).send("`ownerPubKey` was not specified");
    }
    
    // Check ownerPubKey has not been used before
    const checkOwnerPubKeyResponse = await client.query(`
      SELECT * FROM transfers
        WHERE owner_pub_key=$1
    `, [req.body.ownerPubKey]);

    if (checkOwnerPubKeyResponse.rows.length > 0) {
      res.status(400).send("Reuse of `ownerPubKey` not permitted");
    }

    // check that `ownerPubKey` is not already being used by another statechain
    const response = await client.query(`
      SELECT * FROM transfers
        WHERE next_owner_pub_key=$1    
    `, [req.body.ownerPubKey]);

    if (response.rows.length > 0) {
        res.status(400).send("`ownerPubKey` is already in use");
    }

    // generate serverPubKey and register it to ownerPubKey
    const countResponse = await client.query(`
      SELECT COUNT(*) FROM server_keys 
    `, []);
    
    const path = config.federation.path
                  .replace("<federation_id>", config.federation.id)
                  .replace('<i>', countResponse.rows[0].count);
    const seed = await bip39.mnemonicToSeed(config.seed)
    const root = await bip32.fromSeed(seed)
    const serverPrivKey = root.derivePath(path).privateKey
    const serverPubKey = secp256k1.publicKeyCreate(serverPrivKey);

    let timestamp = new Date();

    // store server keys in database
    try {
      await client.query(`
        INSERT INTO server_keys (server_pub_key, server_priv_key, timestamp)
          VALUES ($1, $2, $3);
      `, [serverPubKey.toString("hex"), serverPrivKey.toString("hex"), timestamp]);
    } catch(err) {
    }

    // store the genesis transfer in the database
    const data = [serverPubKey.toString("hex"), req.body.ownerPubKey, 0, timestamp];
    try {
      await client.query(`
        INSERT INTO transfers (transfer_hash, server_pub_key, next_owner_pub_key, height, timestamp) 
          VALUES ($1, $2, $3, $4, $5)
      `, [sha256(data.join(",")), ...data]);
    } catch(err) {

    }

    await promiseSocket.write(JSON.stringify({
      type: '/1',
    }));

    const result = JSON.parse(await (await promiseSocket.read()).toString());

    // -----------------------------------------------------------------------
    // Step 1: Combine the public keys
    // The public keys P_i are combined into the combined public key P.
    // This can be done by every signer individually or by the initializing
    // party and then be distributed to every participant.
    // -----------------------------------------------------------------------
    const publicKeys = [
      Buffer.from('03846f34fdb2345f4bf932cb4b7d278fb3af24f44224fb52ae551781c3a3cad68a', 'hex'),
      Buffer.from('02cd836b1d42c51d80cef695a14502c21d2c3c644bc82f6a7052eb29247cf61f4f', 'hex'),
    ]
    const pubKeyHash = schnorr.muSig.computeEll(publicKeys);
    const pubKeyCombined = schnorr.muSig.pubKeyCombine(publicKeys, pubKeyHash);

    res.send({serverPubKey: pubKeyCombined.toString('hex')});
});

router.post("/transfer", async (req, res, next) => {
    // TODO: add better error handling with middleware or whatever is appropriate

    // verify signature came from the `ownerPubKey` 
    try {
      let preImage = Buffer.from(sha256([req.body.blindedMessage, req.body.nextOwnerPubKey].join(",")), "hex")
      schnorr.verify(Buffer.from(req.body.ownerPubKey, "hex"), preImage, Buffer.from(req.body.signature, "hex"))
    } catch(err) {
      res.status(401).send("Invalid `signature`");
      return;
    }
    
    // get server keys for statechain
    /* we can filter by `ownerPubKey` because this server assumes that the key is only used once
     * this is probably a good assumption because it would ensure higher privacy because the server 
     * know how many participants there are. Also concerning privacy we should add tor (TODO).
     */
    const response = await client.query(`
      SELECT server_pub_key, server_priv_key, height FROM transfers 
        JOIN server_keys USING(server_pub_key) 
          WHERE next_owner_pub_key=$1;
    `, [req.body.ownerPubKey]);

    let serverPubKey = response.rows[0].server_pub_key;
    let serverPrivKey = response.rows[0].server_priv_key;
    let height = response.rows[0].height;
    
    // get the peak state
    const newestStateResponse = await client.query(`
      SELECT * FROM transfers 
        WHERE server_pub_key=$1 
          ORDER BY height DESC LIMIT 1;
    `, [serverPubKey]);

    // if the peak state is not registered to the requesting pub key
    if (newestStateResponse.rows[0].next_owner_pub_key != req.body.ownerPubKey) {
      res.status(401).send("Invalid `ownerPubKey`");
      return;
    } else {

      // transfer ownership to `next_owner_pub_key`
      const data = [serverPubKey, req.body.ownerPubKey, req.body.nextOwnerPubKey, req.body.signature, req.body.blindedMessage, height+1, new Date()];
      try {
        await client.query(`
          INSERT INTO transfers (
            transfer_hash, 
            server_pub_key, 
            owner_pub_key, 
            next_owner_pub_key, 
            signature, 
            blinded_message, 
            height, 
            timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [sha256(data.join(",")), ...data]);
      } catch(err) {

      }
  
      // sign `blindedMessage` and send it to client
      serverPrivKey = BigInteger.fromHex(serverPrivKey);
      let blindedMessage = convert.hash(Buffer.from('muSig is awesome2!', 'utf8'));
      const signedBlindedMessage = schnorr.sign(serverPrivKey, Buffer.from(blindedMessage, "hex")).toString("hex");
      
      await promiseSocket.write(JSON.stringify({
        type: '/1',
      }));

      const result = JSON.parse(await (await promiseSocket.read()).toString());
  
      // -----------------------------------------------------------------------
      // Step 1: Combine the public keys
      // The public keys P_i are combined into the combined public key P.
      // This can be done by every signer individually or by the initializing
      // party and then be distributed to every participant.
      // -----------------------------------------------------------------------
      const publicKeys = [
        Buffer.from('03846f34fdb2345f4bf932cb4b7d278fb3af24f44224fb52ae551781c3a3cad68a', 'hex'),
        Buffer.from('02cd836b1d42c51d80cef695a14502c21d2c3c644bc82f6a7052eb29247cf61f4f', 'hex'),
      ]
      serverPrivKey = BigInteger.fromHex("add2b25e2d356bec3770305391cbc80cab3a40057ad836bcb49ef3eed74a3fee");
      const pubKeyHash = schnorr.muSig.computeEll(publicKeys);
      const pubKeyCombined = schnorr.muSig.pubKeyCombine(publicKeys, pubKeyHash);
      
      // -----------------------------------------------------------------------
      // Step 2: Create the private signing session
      // Each signing party does this in private. The session ID *must* be
      // unique for every call to sessionInitialize, otherwise it's trivial for
      // an attacker to extract the secret key!
      // -----------------------------------------------------------------------
      // const sessionId = randomBuffer(32);
      const sessionId = Buffer.from('4fd8f7e85f2b567deb636ef073cfe55aae7f8847e7b7859caa975e924cb47e14', 'hex');
      const session = schnorr.muSig.sessionInitialize(
        sessionId,
        serverPrivKey,
        blindedMessage,
        pubKeyCombined,
        pubKeyHash,
        0
      );

      // -----------------------------------------------------------------------
      // Step 3: Exchange commitments (communication round 1)
      // The signers now exchange the commitments H(R_i). This is simulated here
      // by copying the values from the private data to public data array.
      // -----------------------------------------------------------------------
      await promiseSocket.write(JSON.stringify({
        type: '/2',
        payload: {
          blinded_message: blindedMessage,
          public_key_combined: pubKeyCombined,
          public_key_hash: pubKeyHash,
          commitment: session.commitment,
          id: 1
        }
      }))

      const result2 = JSON.parse(await (await promiseSocket.read()).toString());

      // -----------------------------------------------------------------------
      // Step 4: Get nonces (communication round 2)
      // Now that everybody has commited to the session, the nonces (R_i) can be
      // exchanged. Again, this is simulated by copying.
      // -----------------------------------------------------------------------
      await promiseSocket.write(JSON.stringify({
        type: '/3',
        payload: {
          blinded_message: blindedMessage,
          public_key_combined: pubKeyCombined,
          public_key_hash: pubKeyHash,
          commitment: session.commitment,
          id: 1
        }
      }))

      const result3 = JSON.parse(await (await promiseSocket.read()).toString());

      // -----------------------------------------------------------------------
      // Step 5: Combine nonces
      // The nonces can now be combined into R. Each participant should do this
      // and keep track of whether the nonce was negated or not. This is needed
      // for the later steps.
      // -----------------------------------------------------------------------

      const nonces = [session.nonce, Buffer.from(result3.payload.nonce, 'hex')];
      const nonceCombined = schnorr.muSig.sessionNonceCombine(session, nonces);

      // -----------------------------------------------------------------------
      // Step 6: Generate partial signatures
      // Every participant can now create their partial signature s_i over the
      // given message.
      // -----------------------------------------------------------------------

      const partialSignature = schnorr.muSig.partialSign(session, blindedMessage, nonceCombined, pubKeyCombined);
      session.partialSignature = partialSignature;

      // -----------------------------------------------------------------------
      // Step 7: Exchange partial signatures (communication round 3)
      // The partial signature of each signer is exchanged with the other
      // participants. Simulated here by copying.
      // -----------------------------------------------------------------------

      await promiseSocket.write(JSON.stringify({
        type: '/4',
        payload: {
          blinded_message: blindedMessage,
          public_key_combined: pubKeyCombined,
          public_key_hash: pubKeyHash,
          commitment: session.commitment,
          id: 1,
          combined_nonces: nonceCombined
        }
      }))

      const result4 = JSON.parse(await (await promiseSocket.read()).toString());
      const partialSignatures = [partialSignature, result4.payload.partialSignature]
      

      // -----------------------------------------------------------------------
      // Step 8: Verify individual partial signatures
      // Every participant should verify the partial signatures received by the
      // other participants.
      // -----------------------------------------------------------------------

     
      schnorr.muSig.partialSigVerify(
        session,
        partialSignatures[0],
        nonceCombined,
        0,
        publicKeys[0],
        nonces[0]
      );

      // -----------------------------------------------------------------------
      // Step 9: Combine partial signatures
      // Finally, the partial signatures can be combined into the full signature
      // (s, R) that can be verified against combined public key P.
      // -----------------------------------------------------------------------

      const signature = schnorr.muSig.partialSigCombine(nonceCombined, partialSignatures);

      // -----------------------------------------------------------------------
      // Step 10: Verify signature
      // The resulting signature can now be verified as a normal Schnorr
      // signature (s, R) over the message m and public key P.
      // -----------------------------------------------------------------------
      schnorr.verify(pubKeyCombined, blindedMessage, signature);

      res.json({signature: signature});
    }
});

router.get("/insight", async (req, res, next) => {
  const response = await client.query(`
    SELECT * FROM transfers 
      JOIN server_keys USING(server_pub_key);
  `, []);

  res.json(response.rows)
});

module.exports = router;

