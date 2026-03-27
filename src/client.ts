import canonicalize from "canonicalize";
import { Socket } from "net";
import * as forge from 'node-forge';

const SERVER_HOST = "127.0.0.1";
// const SERVER_HOST = '95.179.149.49'
const SERVER_PORT = 18018;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
var ed25519 = forge.pki.ed25519;
function send(socket: Socket, obj: unknown) {
  const msg = canonicalize(obj);
  if (!msg) throw new Error("Failed to canonicalize message");
  socket.write(msg + "\n");
  console.log(">>>", msg);
}

const helloMessage = {
  type: "hello",
  version: "0.10.5",
  agent: "Roshar",
};

const getPeersMessage = {
  type: "getpeers",
};

const peersMessage = {
  type: "peers",
  peers: [
    "192.168.1.1:80",
    "192.168.1.2:341",
    "[2001:db8:85a3::8a2e:370:7334]:9000",
  ],
};

const iHaveObjectMessage = {
  type: "ihaveobject",
  objectid: "46ffd1eb5def1663c50303288206d8f418939415d45286c21cf07bbf76cb3d05",
};

const getObjectMessage = {
  type: "getobject",
  objectid: "c5a4642e7d10dc2e8fec2eaa7e73264ea3eed5eebbb498f3cacdc9d710a6eef5",
};

const blockObjectMessage = {
  type: "object",
  object: {
    type: "block",
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1772028037,
    miner: "Marabu Bounty Hunter",
    nonce: "b067391b9caf9821861e83cfc4d4656150ff2f1f800dbf37bdc76d211e76bf86",
    note: "First block on genesis, 50 bu reward",
    previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
    txids: [
      "f0769c4452aec5979016ca16675e9cff0c602be973a365d4e951df6fb678624a",
    ],
  },
};

const unknownObjectTxMessage = {
  type: "object",
  object: {
    type: "transaction",
    inputs: [
      {
        outpoint: {
          txid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          index: 990,
        },
        sig: "b".repeat(128),
      },
    ],
    outputs: [
      {
        pubkey: "c".repeat(64),
        value: 1,
      },
    ],
  },
};
const invalidTxOutpointObjectMessage = {
  type: "object",
  object: {
    type: "transaction",
    inputs: [
      {
        outpoint: {
          txid: "c5a4642e7d10dc2e8fec2eaa7e73264ea3eed5eebbb498f3cacdc9d710a6eef5",
          index: 990,
        },
        sig: "b".repeat(128),
      },
    ],
    outputs: [
      {
        pubkey: "c".repeat(64),
        value: 1,
      },
    ],
  },
};
const invalidTxSigObjectMessage = {
  type: "object",
  object: {
    type: "transaction",
    inputs: [
      {
        outpoint: {
          txid: "c5a4642e7d10dc2e8fec2eaa7e73264ea3eed5eebbb498f3cacdc9d710a6eef5",
          index: 0,
        },
        sig: "a".repeat(128),
      },
    ],
    outputs: [
      {
        pubkey: "c".repeat(64),
        value: 1,
      },
    ],
  },
};

const invalidTxConservationNoSigObjectMessage = {
  type: "transaction",
  inputs: [
    {
      outpoint: {
        txid: "c5a4642e7d10dc2e8fec2eaa7e73264ea3eed5eebbb498f3cacdc9d710a6eef5",
        index: 0,
      },
      sig: null,
    },
  ],
  outputs: [
    {
      pubkey: "df5cc53cdad7639a887d95c421b34c8eaf4ac34907fead908b7312071b7ae2fd",
      value: 1,
    },
  ],
};
var signature = ed25519.sign({
  message: canonicalize(invalidTxConservationNoSigObjectMessage)!,
  encoding: 'utf8',
  privateKey: Buffer.from("48132ee7371eb3375d1e1737c657ce5d6c433f5d1bdc4ba3235cf7772e2d3d8d", 'hex')
});
console.log(canonicalize(invalidTxConservationNoSigObjectMessage));
const invalidTxConservationObjectMessage = {
  type: "object",
  object: {
    type: "transaction",
    inputs: [
      {
        outpoint: {
          txid: "c5a4642e7d10dc2e8fec2eaa7e73264ea3eed5eebbb498f3cacdc9d710a6eef5",
          index: 0,
        },
        sig: Buffer.from(signature).toString("hex"),
      },
    ],
    outputs: [
      {
        pubkey: "df5cc53cdad7639a887d95c421b34c8eaf4ac34907fead908b7312071b7ae2fd",
        value: 1,
      },
    ],
  },
};

const coinbaseTxMessage = {
  type: "object",
  object: {
    type: "transaction",
    outputs: [
      {
        pubkey: "b6a95d7b410ae1eb924898ae584d21523b53aa5a78d1bc54abe964fd8e63f487",
        value: 50000000000000,
      },
    ],
    height: 1,
  },
};

const TEST_MESSAGES: unknown[] = [
  // getPeersMessage,
  // peersMessage,
  // iHaveObjectMessage,
  // getObjectMessage,
  blockObjectMessage,
  // coinbaseTxMessage
  // unknownObjectTxMessage,
  // invalidTxOutpointObjectMessage
  // invalidTxSigObjectMessage,
  // invalidTxConservationObjectMessage

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

  await sleep(2000);
  // client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});