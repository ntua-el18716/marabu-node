import { createServer } from 'net'
import { Socket } from 'net';
import { loadPeers, savePeers } from "./peerStore";
import { Level } from 'level';
import { handleConnection } from './utils';
import { Peer } from './peer';
import { ObjectItem } from './types';
import { knownObjectsDb } from './db';
import { blake2s } from "hash-wasm";
import canonicalize from 'canonicalize';

const PORT = 18018;


const BOOTSTRAPPING_PEERS = ['95.179.158.137:18018', '95.179.132.22:18018', '45.32.235.245:18018'];

let knownPeers = new Set<string>();

for (const p of await loadPeers())
  knownPeers.add(p);
if (knownPeers.size === 0) {
  BOOTSTRAPPING_PEERS.forEach(p => knownPeers.add(p));
  await savePeers(knownPeers);
}

let connectedPeers: Map<string, { socket: Socket, peer: Peer }> = new Map();
const testObject: ObjectItem = {
  type: "block",
  T: "00000000abc00000000000000000000000000000000000000000000000000000",
  created: 1671148800,
  miner: "Test Miner",
  nonce: "15551b5116783ace79cf19d95cca707a94f48e4cc69f3db32f41081dab3e6641",
  note: "Test block",
  previd: null,
  txids: []
};
const run = async () => {
  const canonical = canonicalize(testObject)!;
  const hash = await blake2s(canonical);

  // await knownObjectsDb.put(hash, testObject);

  console.log("Inserted object with hash:", hash);
};

await run();

const client = new Socket()
// load peers
const peer_to_connect = knownPeers.values().next().value!;
const index = peer_to_connect.lastIndexOf(':');
const PEER_PORT = peer_to_connect.slice(index + 1)
const PEER_ADDRESS = peer_to_connect.slice(0, index)

client.on('error', (error) => {
  console.error('Received error', error);
})
client.connect(Number(PEER_PORT), PEER_ADDRESS, () => handleConnection(client, knownPeers, connectedPeers));
const server = createServer(async (socket) => handleConnection(socket, knownPeers, connectedPeers));

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})