// Requests
let request = require('async-request');

async function transfer(ownerPubKey, nextOwnerPubKey, signature, blindedMessage) {
  let blindedSignature = await request(`http://${process.env.DB_HOST || 'localhost'}:5000/transfer`, {
    method: 'POST',
    data: {
        ownerPubKey,
        nextOwnerPubKey,
        signature,
        blindedMessage
    }
  });

  if (blindedSignature.statusCode != 200) {
    throw new Error("Error");
  }
  
  return JSON.parse(blindedSignature.body).signature;
}

module.exports = transfer