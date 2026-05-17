import canonicalize from "canonicalize";
import { createHash } from "node:crypto";

const objectId = (obj: unknown): string => {
  const canon = canonicalize(obj);
  if (!canon) throw new Error("canonicalize failed");
  return createHash("sha256").update(canon).digest("hex");
};

type WorkerInput = {
  blockTemplate: any;
  target: string;
  workerId: number;
  numWorkers: number;
};

globalThis.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { blockTemplate, target, workerId, numWorkers } = event.data;

  let counter = BigInt(workerId);

  while (true) {
    const nonce = counter.toString(16).padStart(64, "0");

    const block = {
      ...blockTemplate,
      nonce,
    };

    const blockid = objectId(block);

    if (blockid < target) {
      globalThis.postMessage({ block, blockid });
      break;
    }

    counter += BigInt(numWorkers);
  }
};