let async = require('async');

// Postgres
const { Client } = require("pg");

const client = new Client({
  database: process.env.DB_NAME || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

client.connect();

// The root provides a resolver function for each API endpoint
var root = {
  transfer: async (args, root, ast) => {
    const transferResponse = await client.query(`
      SELECT * FROM transfers
        JOIN server_keys USING(server_pub_key) 
          WHERE transfer_hash=$1;
    `, [args.hash]);

    return {
      statechainPubKey: transferResponse.rows[0].server_pub_key,
      hash: transferResponse.rows[0].transfer_hash,
      height: transferResponse.rows[0].height,
      ownerPubKey: transferResponse.rows[0].owner_pub_key,
      nextOwnerPubKey: transferResponse.rows[0].next_owner_pub_key,
      signature: transferResponse.rows[0].signature,
      blindedMessage: transferResponse.rows[0].blinded_message,
      timestamp: transferResponse.rows[0].timestamp
    }
  },

  transfers: async (args, root, ast) => {
    const transfersResponse = await client.query(`
      SELECT * FROM transfers
        ORDER BY timestamp
          LIMIT $1
    `, [args.limit]);

    return transfersResponse.rows.map(transfer => {
        return {
          statechainPubKey: transfer.server_pub_key,
          height: transfer.height,
          hash: transfer.transfer_hash,
          ownerPubKey: transfer.owner_pub_key,
          nextOwnerPubKey: transfer.next_owner_pub_key,
          signature: transfer.signature,
          blindedMessage: transfer.blinded_message,
          timestamp: transfer.timestamp
        }
      })
  },

  statechain: async (args, root, ast) => {
    const statechainResponse = await client.query(`
      SELECT * FROM transfers
        JOIN server_keys USING(server_pub_key) 
          WHERE server_pub_key=$1;
    `, [args.serverPubKey])

    return { 
      serverPubKey: statechainResponse.rows[0].server_pub_key,
      height: statechainResponse.rows.length - 1,
      timestamp: statechainResponse.rows[0].timestamp.getTime(),
      transfers: statechainResponse.rows.map(transfer => {
        return {
          hash: transfer.transfer_hash,
          ownerPubKey: transfer.owner_pub_key,
          nextOwnerPubKey: transfer.next_owner_pub_key,
          height: transfer.height,
          timestamp: transfer.timestamp,
          signature: transfer.signature,
          blindedMessage: transfer.blinded_message
        }
      })
    };
  },

  statechains: async (args, root, ast) => {
    const statechainsResponse = await client.query(`
      SELECT server_pub_key, MAX(height) AS height, server_keys.timestamp FROM transfers
        JOIN server_keys USING(server_pub_key) 
          GROUP BY server_pub_key, server_keys.timestamp;
    `, []);

    return statechainsResponse.rows.map(statechain => {
      return {
        height: statechain.height,
        serverPubKey: statechain.server_pub_key,
        timestamp: statechain.timestamp
      }
    })
  },

  user: async (args, root, ast) => {
    const userResponse = await client.query(`
      SELECT * FROM transfers
        WHERE owner_pub_key=$1 OR
              next_owner_pub_key=$2;
    `, [args.userPubKey, args.userPubKey]);

    return {
      userPubKey: args.userPubKey,
      transfers: userResponse.rows.map(transfer => {
        return {
          height: transfer.height,
          hash: transfer.transfer_hash,
          ownerPubKey: transfer.owner_pub_key,
          nextOwnerPubKey: transfer.next_owner_pub_key,
          signature: transfer.signature,
          blindedMessage: transfer.blinded_message,
          timestamp: transfer.timestamp
        }
      })
    }
  }
};

module.exports = root;