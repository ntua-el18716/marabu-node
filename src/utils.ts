import { Peer } from "./peer";
import canonicalize from 'canonicalize';
import { Socket } from "net";
import { MessageSchema, CoinbaseTxSchema } from "./types";
import { savePeers } from "./peerStore";
import { blake2s } from "hash-wasm";
import { Level } from "level";
import { knownObjectsDb } from "./db";
import type { ObjectItem, ObjectSchemaType, TxInputSchemaType, TxOutputSchemaType } from './types'
import { error } from "console";
import * as forge from 'node-forge';
import { Block } from "./block";
import { objectManager } from './object'
import { utxoSets } from "./utxo";


var ed25519 = forge.pki.ed25519;

const errorMessage = (errorName: string, description: string) => {
  return {
    type: "error",
    name: errorName,
    description: description
  }
}

export const handleConnection = async (socket: Socket, knownPeers: Set<string>, connectedPeers: Map<string, { socket: Socket, peer: Peer }>) => {
  const id = `${socket.remoteAddress}:${socket.remotePort}`
  let peer = new Peer(id);
  const connectionId = `${socket.remoteAddress}:${socket.remotePort}`;
  connectedPeers.set(connectionId, { socket, peer });
  console.log(`Client connected from ${id}`);

  const helloMessage = {
    type: "hello",
    version: "0.10.5",
    agent: 'Scadrial'
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
        return;
      }

      let message;
      try {
        message = JSON.parse(msg)
      } catch (error) {
        socket.write(canonicalize(errorMessage('INVALID_FORMAT', 'Expected a valid JSON')) + '\n')
        connectedPeers.delete(connectionId)
        socket.end()
        return;
      }

      try {
        // console.log(message)
        message = MessageSchema.parse(message);
        if (!peer.validHandshake && message.type != "hello") {
          socket.write(canonicalize(errorMessage('INVALID_HANDSHAKE', 'Handshake was not completed successfully')) + '\n')
          connectedPeers.delete(connectionId)
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
        else if (message.type == "getpeers") {
          let peersMessage = {
            type: "peers",
            peers: Array.from(knownPeers)
          }
          socket.write(canonicalize(peersMessage) + '\n')
        }
        else if (message.type == "getobject") {
          if (message.objectid)
            await handleGetObject(message.objectid, socket);
        }
        else if (message.type == "ihaveobject") {
          await handleIHaveObject(message.objectid, socket);
        }
        else if (message.type == "object") {
          await handleObject(message.object, knownObjectsDb, socket, connectedPeers)
        }
      } catch (_) {
        console.error(`Unknown protocol message`, message)
        socket.write(canonicalize(errorMessage('INVALID_FORMAT', 'Received Invalid Protocol Message')) + '\n')
        connectedPeers.delete(connectionId)
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
    connectedPeers.delete(connectionId)
    console.log(`[${id}]: Client disconnected`)
  })
}

export const handleObject = async (object: ObjectItem, knownObjectsDb: Level<string, ObjectItem>, socket: Socket, connectedPeers: Map<string, { socket: Socket, peer: Peer }>) => {
  let canonicalizedObject = canonicalize(object);
  let hash = await blake2s(canonicalizedObject!);
  const existingObject = await knownObjectsDb.get(hash);
  if (existingObject !== undefined) {
    return
  }
  if (await validationTx(object, hash, connectedPeers, socket))
    await knownObjectsDb.put(hash, object);
  else
    return;
  const iHaveObjectMessage = {
    type: "ihaveobject",
    objectid: hash
  }
  const canonicalizedIHaveObjectMessage = canonicalize(iHaveObjectMessage);
  // Broadcast to all connected peers
  connectedPeers.forEach((value, key) => {
    if (value.peer.validHandshake && socket !== value.socket)
      value.socket.write(canonicalizedIHaveObjectMessage! + '\n');
  })
}


export const handleGetObject = async (hash: string, socket: Socket) => {
  const obj = await knownObjectsDb.get(hash);
  if (obj !== undefined) {
    console.log(obj)
    const objectMessage = {
      type: "object",
      object: obj
    }
    socket.write(canonicalize(objectMessage) + '\n')
  }
  return
}

export const handleIHaveObject = async (hash: string, socket: Socket) => {
  const obj = await knownObjectsDb.get(hash);
  if (obj !== undefined) {
    await knownObjectsDb.put(hash, obj);
    return;
  }

  const getObjectMessage = {
    type: "getobject",
    objectid: hash
  }
  socket.write(canonicalize(getObjectMessage) + '\n')
}

const validationTx = async (object: ObjectItem, hash: string, connectedPeers: Map<string, { socket: Socket, peer: Peer }>, socket: Socket): Promise<boolean> => {
  if (object.type === "transaction" && "inputs" in object) {
    let tx_without_sig = structuredClone(object);
    tx_without_sig.inputs.forEach(input => {
      input.sig = null;
    });
    const canonicalized_tx_without_sig = canonicalize(tx_without_sig);
    let sumOfInputValues = 0, sumOfOutputValues = 0;
    for (const input of object.inputs) {
      let prev_tx = await knownObjectsDb.get(input.outpoint.txid);
      if (prev_tx === undefined) {
        socket.write(canonicalize(errorMessage('UNKNOWN_OBJECT', 'Outpoint transaction not found')) + '\n')
        return false;
      }

      if (prev_tx.type === "transaction") {
        if (input.outpoint.index >= prev_tx.outputs.length) {
          socket.write(canonicalize(errorMessage('INVALID_TX_OUTPOINT', 'Outpoint transaction incorrect')) + '\n');
          return false;
        }
        console.log('PUBKEY' + prev_tx.outputs.at(0)?.pubkey)
        // Signature Verification
        if (!input.sig) {
          socket.write(canonicalize(errorMessage('INVALID_TX_SIGNATURE', 'Signature not valid')) + '\n');
          return false;
        }
        var verified = ed25519.verify({
          message: canonicalized_tx_without_sig!,
          encoding: 'utf8',
          // node.js Buffer, Uint8Array, forge ByteBuffer, or binary string
          signature: (typeof input.sig === "string" ? Buffer.from(input.sig, "hex") : input.sig)!,
          // node.js Buffer, Uint8Array, forge ByteBuffer, or binary string
          publicKey: (() => {
            const pubkey = prev_tx.outputs.at(input.outpoint.index)?.pubkey;
            if (!pubkey) throw new Error("Public key is undefined");
            return typeof pubkey === "string" ? Buffer.from(pubkey, "hex") : pubkey;
          })()
        });
        if (!verified) {
          socket.write(canonicalize(errorMessage('INVALID_TX_SIGNATURE', 'Signature invalid')) + '\n')
          return false;
        }
        sumOfInputValues += prev_tx.outputs.at(input.outpoint.index)?.value!;
      }
      else {
        socket.write(canonicalize(errorMessage('INVALID_TX_OUTPOINT', 'Outpoint transaction incorrect')) + '\n');
        return false;
      }
    }
    for (const output of object.outputs) {
      sumOfOutputValues += output.value;
    }
    if (sumOfOutputValues > sumOfInputValues) {
      socket.write(canonicalize(errorMessage('INVALID_TX_CONSERVATION', 'Weak law of Conservation violated')) + '\n');
      return false;
    }
    return true;
  }
  else if (object.type === 'block') {
    const block = new Block(object, hash);

    if (!block.hasValidPoW()) {
      // if (block.hasValidPoW()) {
      socket.write(canonicalize(errorMessage('INVALID_BLOCK_POW', 'Proof of work equation violated')) + '\n');
      return false;
    }

    const sendGetObject = (objectid: string) => {
      const getObjectMessage = {
        type: 'getobject',
        objectid
      }
      const canonicalizedGetObjectMessage = canonicalize(getObjectMessage);
      connectedPeers.forEach((value, key) => {
        if (value.peer.validHandshake)
          value.socket.write(canonicalizedGetObjectMessage! + '\n');
      })
    }

    const promises = block.txids.map(txid => objectManager.findObject(txid, sendGetObject));

    try {
      await Promise.all(promises);
    } catch {
      socket.write(canonicalize(errorMessage('UNFINDABLE_OBJECT', 'Object could not be found')) + '\n');
      return false;
    }
    utxoSets.set(block.blockid, block.getParentUtxo());
    // txs are valid if they are in the database
    let coinbaseExists = false;
    let fees = 0;
    for (const [index, txid] of block.txids.entries()) {
      const tx = await knownObjectsDb.get(txid);
      if (tx.type === "transaction" && "inputs" in tx) {
        fees += await calculateTxFees(tx.inputs, tx.outputs);
        if (utxoSets.get(block.blockid)?.checkInputsCorrespondToOutpoints(tx.inputs)) {
          utxoSets.get(block.blockid)?.applyTx(txid, tx.inputs, tx.outputs);
          continue;
        }
        else
          socket.write(canonicalize(errorMessage('INVALID_TX_OUTPOINT', 'Input not found in the UTXO')) + '\n');
      }
      else if (tx.type === "transaction" && !("inputs" in tx)) {
        // Coinbase Transaction
        if (index !== 0) {
          socket.write(canonicalize(errorMessage('INVALID_BLOCK_COINBASE', 'There can only be one Coinbase Transaction at index 0')) + '\n');
        }
        coinbaseExists = true;
      }
    }
    if (coinbaseExists) {
      const coinbaseTxValidation = await validateCoinbaseTx(block.txids.at(0)!, fees);
      if (coinbaseTxValidation !== "SUCCESS")
        socket.write(canonicalize(errorMessage(coinbaseTxValidation, 'Coinbase Tx has a max value of fees + reward')) + '\n');
    }
  }
  return true;
}

const validateCoinbaseTx = async (txid: string, fees: number) => {
  const coinbaseTx = await knownObjectsDb.get(txid);
  const result = CoinbaseTxSchema.safeParse(coinbaseTx);
  if (!result.success) {
    return "INVALID_FORMAT";
  }
  if (coinbaseTx.type == "transaction") {
    if (coinbaseTx.outputs.at(0)?.value! > fees + 50 * 10 ** 12)
      return "INVALID_BLOCK_COINBASE"
  }
  return "SUCCESS";
}

const calculateTxFees = async (txInputs: TxInputSchemaType[], txOutputs: TxOutputSchemaType[]) => {
  let inputSum = 0, outputSum = 0;
  for (const input of txInputs) {
    const tx = await knownObjectsDb.get(input.outpoint.txid);
    if (tx.type == "transaction")
      inputSum += tx.outputs.at(input.outpoint.index)?.value!;
  }
  for (const output of txOutputs) {
    outputSum += output.value;
  }
  return inputSum - outputSum;
}
