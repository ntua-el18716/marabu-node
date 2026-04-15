import { createServer, Socket } from 'net'
import { loadPeers, savePeers } from "./peerStore";
import { handleConnection } from './utils';
import { Peer } from './peer';

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

const client = new Socket()
// load peers
const peer_to_connect = Array.from(knownPeers).find((peer) => !peer.startsWith('0.0.0.0:')) ?? BOOTSTRAPPING_PEERS[0]!;
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