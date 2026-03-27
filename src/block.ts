import { knownObjectsDb } from './db'
import { type BlockSchemaType } from './types'
import { UTXOSet, utxoSets } from './utxo';

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
    return this.previd === null;
  }
  hasValidTarget(requiredT: string): boolean {
    return this.T === requiredT;
  }
  hasValidPoW(): boolean {
    return this.blockid < this.T;
  }

  getParentUtxo(): UTXOSet {
    if (this.previd === GENESIS_BLOCK_ID || !this.previd) {
      return new UTXOSet(new Set())
    } else {
      return utxoSets.get(this.previd)!
    }
  }


}