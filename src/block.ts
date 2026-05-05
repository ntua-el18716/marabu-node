import { Socket } from 'node:net';
import { knownObjectsDb } from './db'
import { blockHeights, chainTip, objectManager } from './object';
import { type BlockSchemaType } from './types'
import { UTXOSet, utxoSets } from './utxo';
import canonicalize from 'canonicalize';


const GENESIS_BLOCK_ID = "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6";

export class Block {
  type: string
  previd: string | null
  txids: string[]
  nonce: string
  T: string
  created: number
  miner: string | undefined | null
  note: string | undefined | null
  blockid: string
  height?: number

  constructor(
    data: BlockSchemaType,
    blockid: string
  ) {
    this.type = "block"
    this.previd = data.previd;
    this.txids = data.txids;
    this.nonce = data.nonce;
    this.T = data.T;
    this.created = data.created;
    this.miner = data.miner;
    this.note = data.note;
    this.blockid = blockid;
  }

  isGenesis(): boolean {
    return this.blockid === GENESIS_BLOCK_ID;
  }

  hasValidTarget(requiredT: string): boolean {
    return this.T === requiredT;
  }

  hasValidPoW(): boolean {
    return this.blockid < this.T;
  }

  hasTx(txId: string): boolean {
    for (const blockTxId of this.txids)
      if (txId === blockTxId)
        return true;
    return false;
  }

  getParentUtxo(): UTXOSet {
    if (this.previd === GENESIS_BLOCK_ID || !this.previd) {
      return new UTXOSet(new Set())
    } else {
      return new UTXOSet(utxoSets.get(this.previd)!.outpoints)
    }
  }

  async findValidParentBlock(socket: Socket): Promise<boolean> {
    if (this.previd == null) {
      if (this.blockid == GENESIS_BLOCK_ID)
        return true;
      return false;
    }

    const sendGetObject = (objectid: string) => {
      const getObjectMessage = {
        type: 'getobject',
        objectid
      }
      const canonicalizedGetObjectMessage = canonicalize(getObjectMessage);
      // connectedPeers.forEach((value, key) => {
      //   if (value.peer.validHandshake)
      //     value.socket.write(canonicalizedGetObjectMessage! + '\n');
      // })
      socket.write(canonicalizedGetObjectMessage! + '\n');
    }
    try {
      const parent = await objectManager.findObject(this.previd!, sendGetObject)
      if (parent.type == "block")
        if (parent.created >= this.created) {
          const errorMessage = (errorName: string, description: string) => {
            return {
              type: "error",
              name: errorName,
              description: description
            }
          }
          socket.write(canonicalize(errorMessage('INVALID_BLOCK_TIMESTAMP', 'Block Timestamp needs to be greater than the one of its parent and lower than the current time')) + '\n');
        }
    } catch (error) {
      throw error;
    }
    return true;
  }

  async getBlockHeight(): Promise<number> {
    // If it's the Genesis block
    if (this.blockid == GENESIS_BLOCK_ID || !this.previd) {
      this.height = 0
      blockHeights.set(GENESIS_BLOCK_ID, 0);
      return this.height;
    }

    // If parent block's height is known
    const parentHeight: number | undefined = blockHeights.get(this.previd!);
    if (parentHeight != undefined)
      return 1 + parentHeight;

    // If parent's height is unknown
    else if (await objectManager.exists(this.previd!)) {
      const parentObject = await objectManager.get(this.previd!);
      if (parentObject.type == 'block') {
        const parentBlock = new Block(parentObject, this.previd!);
        this.height = 1 + await parentBlock.getBlockHeight()
        blockHeights.set(this.blockid, this.height)
        return this.height;
      }
    }
    return -1;
  }

  async validateBlockTimestamp(): Promise<boolean> {
    if (this.isGenesis() || !this.previd)
      return true;
    const currentTime = Date.now() / 1000;
    const parentObject = await objectManager.get(this.previd!)
    if (parentObject.type == 'block')
      if (this.created >= currentTime || this.created <= parentObject.created)
        return false;
    return true;
  }
}