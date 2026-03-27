export class Outpoint {
  txid: string
  index: number

  constructor(txid: string, index: number) {
    this.txid = txid;
    this.index = index;
  }

  toString(): string {
    return this.txid + ':' + this.index;
  }
}