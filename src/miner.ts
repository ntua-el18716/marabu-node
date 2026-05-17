import { Socket } from "net";
import canonicalize from "canonicalize";
import { randomBytes } from "crypto";

import { objectManager } from "./object";
import { mempool } from "./mempool";
import { chainTip } from "./object";
import { validateTx, calculateTxFees } from "./utils";
import { Peer } from "./peer";
import { ObjectItem } from "./types";
import { UTXOSet } from "./utxo";
import { blockUtxoSetDb } from "./db";
import { getBlockUtxo } from "./utxo";

const TARGET =
  "00000000abc00000000000000000000000000000000000000000000000000000";

const BLOCK_REWARD = 50_000_000_000_000;
const MINER_NAME = "adonalsium";

const MY_PUBLIC_KEY =
  "c6fc38e05174be78b42dcd6b17d4e516ce2e6272cccf62641cf1a66862a37dbc";

type MinedBlock = {
  type: "block";
  T: string;
  created: number;
  miner: string;
  nonce?: string;
  previd: string | null;
  txids: string[];
};

type CoinbaseTx = {
  type: "transaction";
  height: number;
  outputs: {
    pubkey: string;
    value: number;
  }[];
};

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

const yieldToEventLoop = () =>
  new Promise(resolve => setImmediate(resolve));

const randomHex = (bytes: number): string => {
  return randomBytes(bytes).toString("hex");
};

const broadcastIHaveObject = (
  objectid: string,
  connectedPeers: Map<string, { socket: Socket; peer: Peer }>
) => {
  const msg = canonicalize({
    type: "ihaveobject",
    objectid,
  });

  if (!msg) return;

  connectedPeers.forEach(({ socket, peer }) => {
    if (peer.validHandshake) {
      socket.write(msg + "\n");
    }
  });
};

const cloneChainTipUtxo = async () => {
  if (!chainTip.blockid) {
    return new UTXOSet(new Set());
  }

  return await getBlockUtxo(chainTip.blockid);
};

const getValidMempoolTxidsForBlock = async (): Promise<string[]> => {
  const txids: string[] = [];
  const tempUtxo = await cloneChainTipUtxo();

  for (const txid of mempool.txOrder) {
    const tx = await objectManager.get(txid);

    if (!tx || tx.type !== "transaction" || !("inputs" in tx)) {
      continue;
    }

    // validateTx mutates tempUtxo by applying the tx if valid.
    const ok = await validateTx(tx, txid, tempUtxo);

    if (ok) {
      txids.push(txid);
    }
  }

  return txids;
};

const calculateFeesForTxids = async (txids: string[]): Promise<number> => {
  let fees = 0;

  for (const txid of txids) {
    const tx = await objectManager.get(txid);

    if (tx && tx.type === "transaction" && "inputs" in tx) {
      fees += await calculateTxFees(tx.inputs, tx.outputs);
    }
  }

  return fees;
};

const buildCandidateBlock = async (): Promise<MinedBlock | null> => {
  const txids = await getValidMempoolTxidsForBlock();

  // Requirement: mine blocks with at least one mempool tx.
  if (txids.length === 0) {
    return null;
  }

  const fees = await calculateFeesForTxids(txids);

  const coinbaseTx: CoinbaseTx = {
    type: "transaction",
    height: chainTip.height + 1,
    outputs: [
      {
        pubkey: MY_PUBLIC_KEY,
        value: BLOCK_REWARD + fees,
      },
    ],
  };

  const coinbaseTxid = await objectManager.id(coinbaseTx as any);

  if (!(await objectManager.exists(coinbaseTxid))) {
    await objectManager.put(coinbaseTx as ObjectItem);
  }

  return {
    type: "block",
    T: TARGET,
    created: Math.floor(Date.now() / 1000),
    miner: MINER_NAME,
    previd: chainTip.blockid,
    txids: [coinbaseTxid, ...txids],
  };
};

const mineCandidateBlock = async (
  blockTemplate: MinedBlock,
  miningOn: string | null
): Promise<{ block: MinedBlock; blockid: string } | null> => {
  let attempts = 0;

  while (true) {
    if (chainTip.blockid !== miningOn) {
      console.log("Chain tip changed. Restarting miner...");
      return null;
    }

    const block: MinedBlock = {
      ...blockTemplate,
      nonce: randomHex(32),
    };

    const blockid = await objectManager.id(block as any);

    if (blockid < TARGET) {
      return { block, blockid };
    }

    attempts++;

    if (attempts % 100000 === 0) {
      console.log(
        `Still mining... attempts=${attempts}, txs=${blockTemplate.txids.length - 1}`
      );
    }

    // Let networking / message handling continue.
    if (attempts % 5000 === 0) {
      await yieldToEventLoop();
    }

    // Rebuild timestamp occasionally.
    if (attempts % 1_000_000 === 0) {
      return null;
    }
  }
};

export const startMiner = async (
  connectedPeers: Map<string, { socket: Socket; peer: Peer }>
) => {
  while (true) {
    if (mempool.txOrder.length === 0) {
      console.log("Mempool empty. Miner waiting...");
      await sleep(10_000);
      continue;
    }

    const miningOn = chainTip.blockid;
    const blockTemplate = await buildCandidateBlock();

    if (!blockTemplate) {
      console.log("No valid mempool transactions. Miner waiting...");
      await sleep(10_000);
      continue;
    }

    console.log(
      `Mining on ${blockTemplate.previd} with ${blockTemplate.txids.length - 1
      } mempool txs`
    );

    const mined = await mineCandidateBlock(blockTemplate, miningOn);

    if (!mined) {
      continue;
    }

    const { block, blockid } = mined;

    console.log("MINED BLOCK:", blockid);

    await objectManager.put(block as ObjectItem);

    broadcastIHaveObject(blockid, connectedPeers);
  }
};