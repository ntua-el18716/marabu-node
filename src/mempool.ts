import { UTXOSet } from "./utxo";

export class Mempool {
  txOrder: Array<string>
  utxoSet: UTXOSet

  constructor() {
    this.txOrder = new Array<string>()
    this.utxoSet = new UTXOSet(new Set());
  }

  removeTx(txId: string): void {
    const index = this.txOrder.indexOf(txId);
    if (index > -1) {
      this.txOrder.splice(index, 1);
    }
  }

}

export const mempool = new Mempool()