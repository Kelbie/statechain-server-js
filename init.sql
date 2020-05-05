CREATE TABLE IF NOT EXISTS server_keys (
  server_pub_key  VARCHAR UNIQUE NOT NULL PRIMARY KEY,
  server_priv_key VARCHAR UNIQUE NOT NULL,
  timestamp timestamp
);

CREATE TABLE IF NOT EXISTS transfers (
  transfer_hash       VARCHAR UNIQUE PRIMARY KEY,
  server_pub_key      VARCHAR NOT NULL REFERENCES server_keys(server_pub_key),
  signature           VARCHAR,
  blinded_message     VARCHAR,	
  owner_pub_key       VARCHAR,
  next_owner_pub_key  VARCHAR NOT NULL,
  height              INT NOT NULL,
  timestamp           timestamp
);