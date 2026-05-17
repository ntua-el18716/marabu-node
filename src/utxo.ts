import { blockUtxoSetDb } from "./db";
import { chainTip } from "./object";
import { TxInputSchemaType } from "./types";
import { TxOutputSchemaType } from "./types";

export class UTXOSet {
  outpoints: Set<string>

  constructor(outpoints: Set<string>) {
    this.outpoints = new Set(outpoints)
  }

  clone() {
    return new UTXOSet(new Set<string>(Array.from(this.outpoints)))
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

  applyChainTipUtxoContents(): void {
    const chainTipUtxoSet = utxoSets.get(chainTip.blockid);
    this.outpoints.clear();
    if (chainTipUtxoSet?.outpoints)
      for (const outpoint of chainTipUtxoSet.outpoints)
        this.outpoints.add(outpoint);
  }
}

export async function getBlockUtxo(blockid: string): Promise<UTXOSet> {
  const cached = utxoSets.get(blockid);
  if (cached) {
    return new UTXOSet(new Set(cached.outpoints));
  }

  const arr = await blockUtxoSetDb.get(blockid); // string[]
  const utxo = new UTXOSet(new Set(arr));

  utxoSets.set(blockid, new UTXOSet(new Set(utxo.outpoints)));
  return utxo;
}

export async function saveBlockUtxo(blockid: string, utxo: UTXOSet): Promise<void> {
  const copy = new UTXOSet(new Set(utxo.outpoints));

  await blockUtxoSetDb.put(blockid, Array.from(copy.outpoints));
  utxoSets.set(blockid, copy);
}

// export const mempoolUtxo: UTXOSet = new UTXOSet(new Set());

export const utxoSets: Map<string, UTXOSet> = new Map();