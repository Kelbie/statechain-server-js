var { buildSchema } = require('graphql');

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Transfer {
    statechainPubKey: String
    height: Int
    hash: String
    ownerPubKey: String
    nextOwnerPubKey: String
    signature: String
    blindedMessage: String
    timestamp: String
  }

  type Statechain {
    serverPubKey: String
    height: Int
    transfers: [Transfer]
    timestamp: String
  }

  type User {
    userPubKey: String
    transfers: [Transfer]
  }

  type Query {
    statechain(serverPubKey: String!): Statechain
    statechains: [Statechain]
    transfer(hash: String!): Transfer
    transfers(limit: Int): [Transfer]
    user(userPubKey: String!): User
  }
`);

module.exports = schema;