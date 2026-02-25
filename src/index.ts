import { createServer } from 'net'
import canonicalize from 'canonicalize'
import { MessageSchema } from './types'
import { Peer } from './peer'
import { Socket } from 'net';
import { loadPeers, savePeers } from "./peerStore";

const PORT = 18018;

const BOOTSTRAPPING_PEERS = ['95.179.158.137:18018', '95.179.132.22:18018', '45.32.235.245:18018'];

let knownPeers = new Set<string>();

for (const p of await loadPeers())
  knownPeers.add(p);
if (knownPeers.size === 0) {
  BOOTSTRAPPING_PEERS.forEach(p => knownPeers.add(p));
  await savePeers(knownPeers);
}

const client = new Socket()
// load peers
const peer_to_connect = knownPeers.values().next().value!;
const index = peer_to_connect.lastIndexOf(':');
const PEER_PORT = peer_to_connect.slice(index + 1)
const PEER_ADDRESS = peer_to_connect.slice(0, index)


client.on('error', (error) => {
  console.error('Received error', error);
})
client.connect(Number(PEER_PORT), PEER_ADDRESS, () => {
  // console.log('Connected to server')
  const id = `${client.remoteAddress}:${client.remotePort}`
  let peer = new Peer(id);

  const helloMessage = {
    type: "hello",
    version: "0.10.5",
    agent: 'client-example'
  }
  const getPeersMessage = {
    type: "getpeers"
  }
  client.write(canonicalize(helloMessage) + '\n')
  client.write(canonicalize(getPeersMessage) + '\n')
  let buffer = ''
  client.on('data', async (data) => {
    // buffer += data;
    buffer += data.toString("utf8");

    const errorMessage = (errorName: string, description: string) => {
      return {
        type: "error",
        name: errorName,
        description: description
      }
    }

    const messages = buffer.split('\n')
    while (messages.length > 1) {
      let msg = messages.shift()
      if (msg === undefined) {
        console.error('Error defragmenting messages')
        return
      }

      let message
      try {
        message = JSON.parse(msg)
      } catch (error) {
        client.write(canonicalize(errorMessage('INVALID_FORMAT', 'A valid JSON is required'),) + '\n')
        client.end()
        return
      }

      try {
        // console.log(message)
        message = MessageSchema.parse(message)
        if (!peer.validHandshake && message.type != "hello") {
          client.write(canonicalize(errorMessage('INVALID_HANDSHAKE', 'First message needs to be a Hello Message')) + '\n')
          client.end();
          return;
        }
        else if (!peer.validHandshake && message.type == "hello")
          peer.validHandshake = true
        if (message.type == "peers") {
          message.peers.forEach(addr => {
            knownPeers.add(addr)
          });
          await savePeers(knownPeers)
        }
        if (message.type == "getpeers") {
          let peersMessage = {
            type: "peers",
            peers: Array.from(knownPeers)
          }
          client.write(canonicalize(peersMessage) + '\n')
        }
      } catch (_) {
        console.error(`Unknown protocol message`, message)
        client.write(canonicalize(errorMessage('INVALID_FORMAT', "A valid message in accordance ot the Protocol is required")) + '\n')
        client.end();
        return
      }

      console.log(`[${id}]: Received message`, message)
    }

    if (messages[0] === undefined) {
      console.error(`Error in parsing messages`)
      return
    }

    buffer = messages[0]
  })

  client.on('close', () => {
    console.log(`[${id}]: Client disconnected`)
  })

})


const server = createServer(async (socket) => {

  const id = `${socket.remoteAddress}:${socket.remotePort}`
  let peer = new Peer(id);
  console.log(`Client connected from ${id}`);

  const helloMessage = {
    type: "hello",
    version: "0.10.5",
    agent: 'client-example'
  }
  const getPeersMessage = {
    type: "getpeers"
  }
  socket.write(canonicalize(helloMessage) + '\n')
  socket.write(canonicalize(getPeersMessage) + '\n')

  let buffer = ''
  socket.on('data', async (data) => {
    // buffer += data;
    buffer += data.toString("utf8");

    const errorMessage = (errorName: string, description: string) => {
      return {
        type: "error",
        name: errorName,
        description: description
      }
    }

    const messages = buffer.split('\n')
    while (messages.length > 1) {
      let msg = messages.shift()
      if (msg === undefined) {
        console.error('Error defragmenting messages')
        return
      }

      let message
      try {
        message = JSON.parse(msg)
      } catch (error) {
        socket.write(canonicalize(errorMessage('INVALID_FORMAT', 'Expected a valid JSON')) + '\n')
        socket.end()
        return
      }

      try {
        // console.log(message)
        message = MessageSchema.parse(message)
        if (!peer.validHandshake && message.type != "hello") {
          socket.write(canonicalize(errorMessage('INVALID_HANDSHAKE', 'Handshake was not completed successfully')) + '\n')
          socket.end();
          return;
        }
        else if (!peer.validHandshake && message.type == "hello")
          peer.validHandshake = true
        if (message.type == "peers") {
          message.peers.forEach(addr =>
            knownPeers.add(addr)
          );
          await savePeers(knownPeers)
        }
        if (message.type == "getpeers") {
          let peersMessage = {
            type: "peers",
            peers: Array.from(knownPeers)
          }
          socket.write(canonicalize(peersMessage) + '\n')

        }
      } catch (_) {
        console.error(`Unknown protocol message`, message)
        socket.write(canonicalize(errorMessage('INVALID_FORMAT', 'Received Invalid Protocol Mesage')) + '\n')
        socket.end()
        return;
      }

      console.log(`[${id}]: Received message`, message)
    }

    if (messages[0] === undefined) {
      console.error(`Error in parsing messages`)
      return
    }

    buffer = messages[0]
  })

  socket.on('error', (error) => {
    console.error(`[${id}]: Received error ${error}`)
  })

  socket.on('close', () => {
    console.log(`[${id}]: Client disconnected`)
  })
})

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})