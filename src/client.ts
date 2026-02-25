import canonicalize from 'canonicalize'
import { Socket } from 'net'

const SERVER_PORT = 18018
const SERVER_HOST = '95.179.149.49'

const client = new Socket()
client.connect(SERVER_PORT, SERVER_HOST, () => {
  console.log('Connected to server')
})

const helloMessage = {
  type: "hello",
  version: "0.10.5",
  agent: 'client-example'
}

client.write(canonicalize(helloMessage) + '\n')

const getObjectMessage = {
  type: "getobject",
  objectid: "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8"
}
client.write(canonicalize(getObjectMessage) + '\n')

const peersMessage = {
  type: "peers",
  peers: ['192.168.1.1:80', '192.168.1.2:341', "[2001:db8:85a3::8a2e:370:7334]:9000"]
}
client.write(canonicalize(peersMessage) + '\n')

let buffer = ''
client.on('data', (data) => {
  buffer += data
  const messages = buffer.split('\n')
  while (messages.length > 1) {
    let message = messages.shift()
    console.log(`Received message: ${message}`)
  }
  if (messages[0] === undefined) {
    console.error(`Error in parsing messages`)
    return
  }
  buffer = messages[0]
})

client.on('error', (error) => {
  console.error(`Received error ${error}`)
})

client.on('close', () => {
  console.log(`Client disconnected`)
})