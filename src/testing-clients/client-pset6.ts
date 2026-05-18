import canonicalize from "canonicalize";
import { blake2s } from "hash-wasm";
import { Socket } from "net";
import * as forge from 'node-forge';

const SERVER_HOST = '95.179.149.49'
const SERVER_PORT = 18018;

const PRIVATE_KEY = "87266f7065b45db83a6a98c19277cc2cf4561f4c1e6852b621cfc0933fe2db79";

// txhash = 18db30b8da9d192cd65f093c6374b2a52ec3984e4124364aeb05f4ad52d5f590

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

var ed25519 = forge.pki.ed25519;
function send(socket: Socket, obj: unknown) {
  const msg = canonicalize(obj);
  if (!msg) throw new Error("Failed to canonicalize message");
  socket.write(msg + "\n");
  console.log(">>>", msg);
}

const transactionToProf = {
  type: "transaction",
  inputs: [
    {
      outpoint: {
        txid: "bb8ca6d2057cdbf313e940110497d761b4d253af22a9a55ef3459fa94a2801a7",
        index: 0,
      },
      sig: null as string | null,
    },
  ],
  outputs: [
    {
      pubkey: "b6a95d7b410ae1eb924898ae584d21523b53aa5a78d1bc54abe964fd8e63f487",
      value: 50_000_000_000_000,
    },
  ],
};

const helloMessage = {
  type: "hello",
  version: "0.10.5",
  agent: "Roshar",
};

const message = canonicalize(transactionToProf);
if (!message) throw new Error("canonicalize failed");

var signature = ed25519.sign({
  message: message,
  encoding: 'utf8',
  privateKey: Buffer.from(PRIVATE_KEY, "hex")
});

if (transactionToProf.inputs[0]) {
  transactionToProf.inputs[0].sig = Buffer.from(signature).toString("hex");
}

let transactionToProfMessage = {
  type: "object",
  object: transactionToProf
}

const TEST_MESSAGES: unknown[] = [
  transactionToProfMessage
];

async function main() {
  const client = new Socket();
  let buffer = "";

  client.on("data", (data) => {
    buffer += data.toString("utf8");
    const messages = buffer.split("\n");

    while (messages.length > 1) {
      const msg = messages.shift();
      if (msg && msg.trim().length > 0) {
        console.log("<<<", (msg));
      }
    }

    buffer = messages[0] ?? "";
  });

  client.on("error", (error) => {
    console.error("Socket error:", error);
  });

  client.on("close", () => {
    console.log("Disconnected");
  });

  await new Promise<void>((resolve, reject) => {
    client.connect(SERVER_PORT, SERVER_HOST, () => {
      console.log(`Connected to ${SERVER_HOST}:${SERVER_PORT}`);
      resolve();
    });
    client.once("error", reject);
  });

  send(client, helloMessage);
  await sleep(150);

  for (const msg of TEST_MESSAGES) {
    send(client, msg);
    await sleep(150);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});