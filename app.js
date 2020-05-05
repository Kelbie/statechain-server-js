var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var bodyParser = require('body-parser');

// GraphQL
var graphqlHTTP = require('express-graphql');
var schema = require('./graphql/schema');
var resolvers = require('./graphql/resolvers');

var indexRouter = require('./routes/index');

var app = express();

app.use(bodyParser.json());
app.use(cors());

app.use("/graphql", function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
        next();
      }
});
      
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

const net = require('net');

// Schnorr
const Buffer = require("safe-buffer").Buffer;
const BigInteger = require("bigi");
const schnorr = require("bip-schnorr");
const convert = schnorr.convert;

// secp256k1
const { randomBytes } = require("crypto");
const secp256k1 = require("secp256k1");
const randomBuffer = (len) => Buffer.from(randomBytes(len));

var server = net.createServer(function(socket) {
  socket.on('data', (data) => {
    const parsedData = JSON.parse(data.toString());

    switch (parsedData.type) {
      case '/1': {
        socket.write(JSON.stringify({
          type: '/1/response',
          payload: {
            public_key: '02cd836b1d42c51d80cef695a14502c21d2c3c644bc82f6a7052eb29247cf61f4f'
          }
        }))
        break;
      }

      case '/2': {
        // const sessionId = randomBuffer(32);
        const sessionId = Buffer.from('4fd8f7e85f2b567deb636ef073cfe55aae7f8847e7b7859caa975e924cb47e14', 'hex')
        const session = schnorr.muSig.sessionInitialize(
          sessionId,
          BigInteger.fromHex('0a1645eef5a10e1f5011269abba9fd85c4f0cc70820d6f102fb7137f2988ad78'),
          Buffer.from(parsedData.payload.blinded_message, 'hex'),
          Buffer.from(parsedData.payload.public_key_combined, 'hex'),
          Buffer.from(parsedData.payload.public_key_hash, 'hex'),
          parsedData.payload.id
        );

        socket.write(JSON.stringify({
          type: '/2/response',
          payload: {
            commitment: session.commitment,
          }
        }))
        break;
      }


      case '/3': {
        // const sessionId = randomBuffer(32);
        const sessionId = Buffer.from('4fd8f7e85f2b567deb636ef073cfe55aae7f8847e7b7859caa975e924cb47e14', 'hex')
        const session = schnorr.muSig.sessionInitialize(
          sessionId,
          BigInteger.fromHex('0a1645eef5a10e1f5011269abba9fd85c4f0cc70820d6f102fb7137f2988ad78'),
          Buffer.from(parsedData.payload.blinded_message, 'hex'),
          Buffer.from(parsedData.payload.public_key_combined, 'hex'),
          Buffer.from(parsedData.payload.public_key_hash, 'hex'),
          parsedData.payload.id
        );
        
        socket.write(JSON.stringify({
          type: '/3/response',
          payload: {
            nonce: session.nonce,
          }
        }))
        break;
      }


      case '/4': {
        // const sessionId = randomBuffer(32);
        const sessionId = Buffer.from('4fd8f7e85f2b567deb636ef073cfe55aae7f8847e7b7859caa975e924cb47e14', 'hex')
        const session = schnorr.muSig.sessionInitialize(
          sessionId,
          BigInteger.fromHex('0a1645eef5a10e1f5011269abba9fd85c4f0cc70820d6f102fb7137f2988ad78'),
          Buffer.from(parsedData.payload.blinded_message, 'hex'),
          Buffer.from(parsedData.payload.public_key_combined, 'hex'),
          Buffer.from(parsedData.payload.public_key_hash, 'hex'),
          parsedData.payload.id
        );
        // TODO adapt to make this more flexible
        session.nonceIsNegated = true;
        
        socket.write(JSON.stringify({
          type: '/4/response',
          payload: {
            partialSignature: schnorr.muSig.partialSign(session, Buffer.from(parsedData.payload.blinded_message, 'hex'), Buffer.from(parsedData.payload.combined_nonces, 'hex'), Buffer.from(parsedData.payload.public_key_combined, 'hex')),
          }
        }))
        break;
      }
    }
  });
});

server.listen(3333, '127.0.0.1');

module.exports = app;
