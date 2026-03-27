import { Block } from "./block"
import { TxInputSchemaType } from "./types";
import { TxOutputSchemaType } from "./types";

const GENESIS_BLOCK_ID = "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6"

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
  checkInputsCorrespondToOutpoints(txInputs: TxInputSchemaType[]) {
    let unspentInputs = new Set(this.outpoints);
    for (const input of txInputs) {
      const stringInput = input.outpoint.txid + ':' + input.outpoint.index;
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

export const utxoSets: Map<string, UTXOSet> = new Map();