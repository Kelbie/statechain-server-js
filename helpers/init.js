// Requests
let request = require('async-request');

async function init(ownerPubKey) {
  let serverPubKey = await request(`http://${process.env.DB_HOST || 'localhost'}:5000/init`, {
    method: 'POST',
    data: {
        ownerPubKey
    }
  });

  if (serverPubKey.statusCode != 200) {
    throw new Error("Error");
  }

  return JSON.parse(serverPubKey.body).serverPubKey
}

module.exports = init