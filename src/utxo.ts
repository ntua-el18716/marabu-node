import { TxInputSchemaType } from "./types";
import { TxOutputSchemaType } from "./types";

export class UTXOSet {
  outpoints: Set<string>

  constructor(outpoints: Set<string>) {
    this.outpoints = new Set(outpoints)
  }

  has(input: string): boolean {
    return this.outpoints.has(input);
  }
  applyTx(txid: string, inputs: TxInputSchemaType[], outputs: TxOutputSchemaType[]) {
    for (const input of inputs) {
      const i = input.outpoint.txid + ':' + input.outpoint.index;
      this.outpoints.delete(i);
    }
    for (const [index, output] of outputs.entries()) {
      const o = txid + ':' + index;
      this.outpoints.add(o);
    }
  }
  applyCoinbaseTx(txid: string, outputs: TxOutputSchemaType[]) {
    console.log("outpointsAAA"), utxoSets.get("000000001a8a21aa884e5fa85a23a372a521d0ec3d74d2aaece160d306d0d9ab");
    for (const [index, output] of outputs.entries()) {
      const o = txid + ':' + index;
      this.outpoints.add(o);
    }
  }
  checkInputsCorrespondToOutpoints(txInputs: TxInputSchemaType[]) {
    let unspentInputs = new Set(this.outpoints);
    for (const input of txInputs) {
      const stringInput = input.outpoint.txid + ':' + input.outpoint.index;
      // console.log(stringInput);
      if (unspentInputs.has(stringInput)) {
        unspentInputs.delete(stringInput);
        continue;
      }
      else
        return false;
    }
    return true;
  }
}

// export const mempoolUtxo: UTXOSet = new UTXOSet(new Set());

export const utxoSets: Map<string, UTXOSet> = new Map();