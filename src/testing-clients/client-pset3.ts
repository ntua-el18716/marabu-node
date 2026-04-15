import canonicalize from "canonicalize";
import { blake2s } from "hash-wasm";
import { Socket } from "net";
import * as forge from 'node-forge';

const SERVER_HOST = "127.0.0.1";
// const SERVER_HOST = '95.179.149.49'
const SERVER_PORT = 18018;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
var ed25519 = forge.pki.ed25519;
function send(socket: Socket, obj: unknown) {
  const msg = canonicalize(obj);
  if (!msg) throw new Error("Failed to canonicalize message");
  socket.write(msg + "\n");
  console.log(">>>", msg);
}

async function main() {
  const client = new Socket();
  let buffer = "";

  const helloMessage = {
    type: 'hello',
    agent: 'Threnody',
    version: '0.10.10'
  }

  const getPeersMessage = {
    type: "getpeers",
  };

  const genesisBlockMessage = {
    object: {
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771159355,
      miner: "Marabu",
      nonce: "00dd82159556175752d9ba7349df67bddd237b59183747383f7b720e85c32347",
      note: "Financial Times 2026-02-13: Crypto's battle with the banks is splitting Trump's base",
      previd: null as string | null,
      txids: [] as string[],
      type: "block" as const
    },
    type: "object" as const
  }
  const getObjectMessageFunc = (objectId: string) => {
    const getObjectMessage = {
      type: "getobject",
      objectid: objectId,
    };
    return getObjectMessage
  }

  const blockWithUnknownCoinbaseTxMessage = {
    object: {
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771162955,
      miner: "grader",
      nonce: "19be8f41d0c616a4ea8e7e2accfa9d748318624e9cd39a0d53051187be1230cc",
      note: "This block has a coinbase transaction",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: [
        "e2e3d5919de1de1338217bfd1d364bf381c2c7336e0c85c46e4ae86232c26529"
      ],
      type: "block" as const
    },
    type: "object" as const
  };
  const blockWithTwoUnknownCoinbaseTxMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771166555,
      miner: "grader",
      nonce: "cfe9618f4dd22f37bfc237cacd8cb930d9181b10881b65ee19ebfef4f4884fa7",
      note: "This block has another coinbase and spends earlier coinbase",
      previd: "000000001a8a21aa884e5fa85a23a372a521d0ec3d74d2aaece160d306d0d9ab",
      txids: [
        "a633520faec43d9dd868df547d397d3d1b0c326f9864f48eb8655f7f33cece95",
        "f4535e84ded732f4ddacbb07133c2391844851da8e7f8b9484cff03ca833be0b"
      ]
    }
  };


  const blockWithInvalidPoWMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1671148915,
      miner: "grader",
      nonce: "805226167859fbbb286fd2edc42d3f6dc8a6ac3e664745c434872b875044f140",
      note: "Block with invalid PoW",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: []
    }
  };

  const blockWithInvalidCoinbaseConservationMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771170155,
      miner: "grader",
      nonce: "3d9326cbbce4311f922b0a671d4c1d83c528efaee5d72dbf9cd61660d6b671d1",
      note: "This block has a coinbase transaction",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: [
        "6e77eb8eb23aa6c6dfb28ac72b38116d4826c6a96299199ae0013654bc71a5fb"
      ]
    }
  };
  const blockWithActualInvalidCoinbaseConservationMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771173755,
      miner: "grader",
      nonce: "6a9e3d7de241ba5bd31d66cf1f0828a04ce33d0a28d55b91fd2924d243005832",
      note: "This block violates the law of conservation",
      previd: "0000000025686ecaf9edb4eba5146e73099636dc5f856f363313c22b3237d223",
      txids: [
        "9baa94270d6d5c62dd4180f2fc8b061eda8a69ee7448a17ad7678bb6c0d2f8f0",
        "be80036646cfdc85b27c1564a3160d44ec5c30ec14f3c401f724ec3f1742ca34"
      ]
    }
  };


  const blockWithCoinbaseSpentInTheSameBlockMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771173755,
      miner: "grader",
      nonce: "fc4506d7c75f303dcb0d68641ea04d9815e73f18f7f7770df183f8ef6c93ecb5",
      note: "This block has a transaction spending the coinbase",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: [
        "6e77eb8eb23aa6c6dfb28ac72b38116d4826c6a96299199ae0013654bc71a5fb",
        "be80036646cfdc85b27c1564a3160d44ec5c30ec14f3c401f724ec3f1742ca34"
      ]
    }
  };
  const blockWithActualDoubleSpendingTxMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771188155,
      miner: "grader",
      nonce: "a2275563b730b184200896bff2c8b9bb88206e21c64a67659dcffead83003c27",
      note: "This block spends coinbase transaction twice",
      previd: "00000000556048ae26893c5bd08e9539b2f62ca5b5847b87a6c8e9800f0da467",
      txids: [
        "0308131405b190db3c94052b9b7185a62538010c8e5298cb104e31edc5a68877",
        "d38db64554dcb26d5246ec7f4ea365b654f1bb1710a9c6615e8053cea11ca547"
      ]
    }
  };

  const blockWithDoubleSpendingTxMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771184555,
      miner: "grader",
      nonce: "36a150836fc4a7dbfa40d64c9cf616c0d4a3ac18e6bf46fbc2514ea45bdaaf5c",
      note: "This block has a coinbase transaction",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: [
        "96339757c036018f3f272b2d8128248241e6ecfe0f9047d7f2cfe2fde3df267a"
      ]
    }
  };

  const blockWithConsecutiveDoubleSpendingMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771191755,
      miner: "grader",
      nonce: "dd8c12b37231a171ce8909f379bc86b7fb3be1599eec863f7d221d967f8bfb47",
      note: "This block has a coinbase transaction",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: [
        "c825462af622841b4be6c023c32eecc0a723be845ee867efee41debe24a5fb8c"
      ]
    }
  };

  const blockWithConsecutiveDoubleSpendingFirstMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771195355,
      miner: "grader",
      nonce: "4875ff49c105353fefd45057f42790c4efd727714d90074970d4e8458e34b467",
      note: "This block spends coinbase transaction once (it is valid)",
      previd: "000000002285ac3f587def52a366014f5d2e2ecc38e6527a14c11f912c7fa9fc",
      txids: [
        "01d62f3494326ff8f0541b9d0d06395be32d6761d919be4ae311bc5172ba80d7"
      ]
    }
  };

  const blockWithConsecutiveDoubleSpendingSecondMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771198955,
      miner: "grader",
      nonce: "65888dc80eb6b0b12879e47c68c49a5e9215bcdf1677825d4fcc1aa92b650b44",
      note: "This block spends coinbase transaction again (it is invalid)",
      previd: "0000000075e0bff767796c8b3beb771aeda55c2d18b947ab13bb01334f4038ed",
      txids: [
        "ddb6a2d270a34f5007237d4f34814b48262c26ef94cc0b9245d8ca1dafbc4070"
      ]
    }
  };

  const blockWithTxThatSpendsInexistantCoinbaseTxMessage = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      height: 1,
      outputs: [
        {
          pubkey: "e39b7117f6bd94dd174f96556fc0850f564b873e8b873e507556493a200176b3",
          value: 50000000000000
        }
      ]
    }
  };

  const blockWithTxThatSpendsInexistantCoinbaseMessage = {
    type: "object" as const,
    object: {
      type: "block" as const,
      T: "00000000abc00000000000000000000000000000000000000000000000000000",
      created: 1771198955,
      miner: "grader",
      nonce: "c70416fef43c0e191778bb04df0945c100db9241d640ac5e1c2b4a9562246f94",
      note: "This block spends a coinbase transaction not in its prev blocks",
      previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
      txids: ["c623a2700681dbc7a9a31bcd1d5128777adb107ad0f143d9367ee0dbb5a6bd0f"]
    }
  };

  const errorMessage = (errorName: string, description: string) => {
    return {
      type: "error",
      name: errorName,
      description: description
    }
  }

  async function send(socket: Socket, obj: unknown) {
    const msg = canonicalize(obj);
    if (!msg) throw new Error("Failed to canonicalize message");
    socket.write(msg + "\n");
    console.log("<<<", msg);
    console.log("\n");
    await sleep(150);
  }

  client.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log('Connected to server');

    await send(client, helloMessage);

    // await send(client, getPeersMessage);

    await send(client, genesisBlockMessage)
    await sleep(1000)
    await send(client, getObjectMessageFunc('00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6'))


    await send(client, blockWithUnknownCoinbaseTxMessage)
    await sleep(1000)
    await send(client, getObjectMessageFunc('000000001a8a21aa884e5fa85a23a372a521d0ec3d74d2aaece160d306d0d9ab'))

    // Send valid Block with two dependancies
    // await send(client, blockWithTwoUnknownCoinbaseTxMessage)
    // await sleep(1000)
    // await sleep(1000)
    // await send(client, getObjectMessageFunc('a633520faec43d9dd868df547d397d3d1b0c326f9864f48eb8655f7f33cece95'))
    // await sleep(1000)
    // await send(client, getObjectMessageFunc('f4535e84ded732f4ddacbb07133c2391844851da8e7f8b9484cff03ca833be0b'))
    // await sleep(1000)
    // await send(client, getObjectMessageFunc('000000008852948c999acdfebe402d7e8a146a55c34b1a7c40960eb244b2f7e4'))
    // await sleep(1000)

    // Send Object with Invalid PoW
    // await send(client, blockWithInvalidPoWMessage)


    // Send Object that Violated Conservation Law
    // await send(client, blockWithInvalidCoinbaseConservationMessage)
    // await send(client, getObjectMessageFunc('0000000025686ecaf9edb4eba5146e73099636dc5f856f363313c22b3237d223'))
    // await sleep(1000)
    // await send(client, blockWithActualInvalidCoinbaseConservationMessage)


    // await send(client, blockWithCoinbaseSpentInTheSameBlockMessage)

    // Double Spending in the same block
    // await sleep(1000)
    // await send(client, blockWithDoubleSpendingTxMessage);
    // await sleep(2000)
    // await send(client, blockWithActualDoubleSpendingTxMessage);

    // Block with transaction that spends UTXO that doesn't exist
    // await send(client, blockWithTxThatSpendsInexistantCoinbaseTxMessage)
    // await sleep(2000)
    // await send(client, blockWithTxThatSpendsInexistantCoinbaseMessage)
  })


  client.on("data", async (data) => {
    buffer += data.toString("utf8");
    const messages = buffer.split("\n");

    while (messages.length > 1) {
      const msg = messages.shift();
      if (msg === undefined) {
        console.error('Error defragmenting messages')
        return;
      }
      if (msg && msg.trim().length > 0) {
        console.log(">>>", (msg));
        console.log("\n");

      }

      let message;
      try {
        message = JSON.parse(msg)

        if (message.type == "getobject") {
          if (message.objectid)
            await handleGetObject(message.objectid, client);
        }
      } catch (error) {
        client.write(canonicalize(errorMessage('INVALID_FORMAT', 'Expected a valid JSON')) + '\n')
        client.end()
        return;
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


export const handleGetObject = async (hash: string, socket: Socket) => {
  const coinbaseTxObject = {
    type: "object",
    object: {
      type: "transaction",
      height: 1,
      outputs: [
        {
          pubkey: "bba40466a8bc7cf6ffd7e5d313668a35a0cbe530ab0999f86b474cda60c9e61c",
          value: 50000000000000
        }
      ]
    }
  };
  const coinbaseTxObject2 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      height: 2,
      outputs: [
        {
          pubkey: "9862f5928090d4dffe2fe768e0f9f1647d44e6d98f70c626ae3ef7709b464a66",
          value: 51000000000000
        }
      ]
    }
  };
  const coinbaseTxObject3 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "e2e3d5919de1de1338217bfd1d364bf381c2c7336e0c85c46e4ae86232c26529",
            index: 0
          },
          sig: "0e02a3b035ee3643bb046b8eeab0fe66b00857de1139a15566801f773399ee54fe9f387980b7d4b66555ac13ea831a5e04a94b6a0378003e20c4a55afc2f7804"
        }
      ],
      outputs: [
        {
          pubkey: "9862f5928090d4dffe2fe768e0f9f1647d44e6d98f70c626ae3ef7709b464a66",
          value: 49000000000000
        }
      ]
    }
  };
  const coinbaseTxObject4 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      height: 1,
      outputs: [
        {
          pubkey: "f58f13fd89a4895eca9c0a3a1ab6319287064febf66d874b0d16d28f57cc5ec9",
          value: 50000000000000
        }
      ]
    }
  };
  const coinbaseTxObject5 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      height: 2,
      outputs: [
        {
          pubkey: "1f758866366dd02a89994897febed57fdc3d70108fdddc74c7f84e2d63de8cfa",
          value: 80000000000000
        }
      ]
    }
  };
  const coinbaseTxObject6 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "6e77eb8eb23aa6c6dfb28ac72b38116d4826c6a96299199ae0013654bc71a5fb",
            index: 0
          },
          sig: "69b822c976f311fa872b7c6acd7379c125c909a5823e8906a3bfe4c564a1319873aab31cfd69b8edef4e097f17e4d97a19b08f154bf62a4c3ea8c8e6dce7360a"
        }
      ],
      outputs: [
        {
          pubkey: "1f758866366dd02a89994897febed57fdc3d70108fdddc74c7f84e2d63de8cfa",
          value: 40000000000000
        }
      ]
    }
  };
  const coinbaseTxObject7 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      height: 1,
      outputs: [
        {
          pubkey: "1f758866366dd02a89994897febed57fdc3d70108fdddc74c7f84e2d63de8cfa",
          value: 50000000000000
        }
      ]
    }
  };
  const coinbaseTxObject8 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "96339757c036018f3f272b2d8128248241e6ecfe0f9047d7f2cfe2fde3df267a",
            index: 0
          },
          sig: "1c05a228b6c515a9fa39d8d9f89a5812340e3a02406d05f008ee8dad45983252cb4b6680dc6ee9eb1129e763c0730fc4de94a1433e9bfaeac012fde50c32ae0f"
        }
      ],
      outputs: [
        {
          pubkey: "88bf1027a8556294fd298f9b019006c0c86428db1d99989e04ef59555ab144c6",
          value: 49000000000000
        }
      ]
    }
  };
  const coinbaseTxObject9 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "96339757c036018f3f272b2d8128248241e6ecfe0f9047d7f2cfe2fde3df267a",
            index: 0
          },
          sig: "6a6107ad86580da74f7b2fa884d817cc1c9b963d4160c45ba1b65192fdb4f84a1a59bdd973d151d7efc4aa770e33c5f2616049115c06ec81733fa9d62f15c501"
        }
      ],
      outputs: [
        {
          pubkey: "e39b7117f6bd94dd174f96556fc0850f564b873e8b873e507556493a200176b3",
          value: 48000000000000
        }
      ]
    }
  };
  const coinbaseTxObject10 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      height: 1,
      outputs: [
        {
          pubkey: "88bf1027a8556294fd298f9b019006c0c86428db1d99989e04ef59555ab144c6",
          value: 50000000000000
        }
      ]
    }
  };
  const coinbaseTxObject11 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "c825462af622841b4be6c023c32eecc0a723be845ee867efee41debe24a5fb8c",
            index: 0
          },
          sig: "785a41f824c12f49084d65ff24dcf51d8df66a22a743ba53ce3bd2690456530560ce54b4cbf890193721539e735041afba823bb0660fa4d56772d982236d240d"
        }
      ],
      outputs: [
        {
          pubkey: "e39b7117f6bd94dd174f96556fc0850f564b873e8b873e507556493a200176b3",
          value: 49000000000000
        }
      ]
    }
  };
  const coinbaseTxObject12 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "c825462af622841b4be6c023c32eecc0a723be845ee867efee41debe24a5fb8c",
            index: 0
          },
          sig: "c713ac087c8e7cd45c179b407403e485990c19b35e6f22edd06b25974f25dfdbcb518a3a79506d8dd0f41e2db525ec082424d706413562368af977a3ef8d730f"
        }
      ],
      outputs: [
        {
          pubkey: "e39b7117f6bd94dd174f96556fc0850f564b873e8b873e507556493a200176b3",
          value: 48000000000000
        }
      ]
    }
  };

  const coinbaseTxObject13 = {
    type: "object" as const,
    object: {
      type: "transaction" as const,
      inputs: [
        {
          outpoint: {
            txid: "e5ed65492e6b9fc7bdeaaf3ae1b7aa1d850ffec4cd9903067e01496ccef80d8b",
            index: 0
          },
          sig: "b3fd9de1e98fe6df26e7cfc90df6320188b27f2b7b9a978b602f622325002e067f3c5020d23f98afc59350627828fdfa6c27cf4443cbf657d468fbf68ac0d204"
        }
      ],
      outputs: [
        {
          pubkey: "bba40466a8bc7cf6ffd7e5d313668a35a0cbe530ab0999f86b474cda60c9e61c",
          value: 49000000000000
        }
      ]
    }
  };

  if (hash === "e2e3d5919de1de1338217bfd1d364bf381c2c7336e0c85c46e4ae86232c26529") {
    console.log("Sending Object: e2e3d5919de1de1338217bfd1d364bf381c2c7336e0c85c46e4ae86232c26529\n")
    socket.write(canonicalize(coinbaseTxObject) + '\n')
    console.log("<<<", coinbaseTxObject);
  }
  if (hash === "a633520faec43d9dd868df547d397d3d1b0c326f9864f48eb8655f7f33cece95") {
    console.log("Sending Object: a633520faec43d9dd868df547d397d3d1b0c326f9864f48eb8655f7f33cece95\n")
    socket.write(canonicalize(coinbaseTxObject2) + '\n')
    console.log("<<<", coinbaseTxObject2);
  }
  if (hash === "f4535e84ded732f4ddacbb07133c2391844851da8e7f8b9484cff03ca833be0b") {
    console.log("Sending Object: f4535e84ded732f4ddacbb07133c2391844851da8e7f8b9484cff03ca833be0b \n")
    socket.write(canonicalize(coinbaseTxObject3) + '\n')
    console.log("<<<", coinbaseTxObject3);
  }
  if (hash === "6e77eb8eb23aa6c6dfb28ac72b38116d4826c6a96299199ae0013654bc71a5fb") {
    console.log("Sending Object: 6e77eb8eb23aa6c6dfb28ac72b38116d4826c6a96299199ae0013654bc71a5fb \n")
    socket.write(canonicalize(coinbaseTxObject4) + '\n')
    console.log("<<<", coinbaseTxObject4);
  }
  if (hash === "9baa94270d6d5c62dd4180f2fc8b061eda8a69ee7448a17ad7678bb6c0d2f8f0") {
    console.log("Sending Object: 9baa94270d6d5c62dd4180f2fc8b061eda8a69ee7448a17ad7678bb6c0d2f8f0 \n")
    socket.write(canonicalize(coinbaseTxObject5) + '\n')
    console.log("<<<", coinbaseTxObject5);
  }
  if (hash === "be80036646cfdc85b27c1564a3160d44ec5c30ec14f3c401f724ec3f1742ca34") {
    console.log("Sending Object: be80036646cfdc85b27c1564a3160d44ec5c30ec14f3c401f724ec3f1742ca34 \n")
    socket.write(canonicalize(coinbaseTxObject6) + '\n')
    console.log("<<<", coinbaseTxObject6);
  }
  if (hash === "96339757c036018f3f272b2d8128248241e6ecfe0f9047d7f2cfe2fde3df267a") {
    console.log("Sending Object: 96339757c036018f3f272b2d8128248241e6ecfe0f9047d7f2cfe2fde3df267a \n")
    socket.write(canonicalize(coinbaseTxObject7) + '\n')
    console.log("<<<", coinbaseTxObject7);
  }
  if (hash === "0308131405b190db3c94052b9b7185a62538010c8e5298cb104e31edc5a68877") {
    console.log("Sending Object: 0308131405b190db3c94052b9b7185a62538010c8e5298cb104e31edc5a68877 \n")
    socket.write(canonicalize(coinbaseTxObject8) + '\n')
    console.log("<<<", coinbaseTxObject8);
  }
  if (hash === "d38db64554dcb26d5246ec7f4ea365b654f1bb1710a9c6615e8053cea11ca547") {
    console.log("Sending Object: d38db64554dcb26d5246ec7f4ea365b654f1bb1710a9c6615e8053cea11ca547 \n")
    socket.write(canonicalize(coinbaseTxObject9) + '\n')
    console.log("<<<", coinbaseTxObject9);
  }
  if (hash === "c825462af622841b4be6c023c32eecc0a723be845ee867efee41debe24a5fb8c") {
    console.log("Sending Object: c825462af622841b4be6c023c32eecc0a723be845ee867efee41debe24a5fb8c \n")
    socket.write(canonicalize(coinbaseTxObject10) + '\n')
    console.log("<<<", coinbaseTxObject10);
  }
  if (hash === "01d62f3494326ff8f0541b9d0d06395be32d6761d919be4ae311bc5172ba80d7") {
    console.log("Sending Object: 01d62f3494326ff8f0541b9d0d06395be32d6761d919be4ae311bc5172ba80d7 \n")
    socket.write(canonicalize(coinbaseTxObject11) + '\n')
    console.log("<<<", coinbaseTxObject11);
  }
  if (hash === "ddb6a2d270a34f5007237d4f34814b48262c26ef94cc0b9245d8ca1dafbc4070") {
    console.log("Sending Object: ddb6a2d270a34f5007237d4f34814b48262c26ef94cc0b9245d8ca1dafbc4070 \n")
    socket.write(canonicalize(coinbaseTxObject12) + '\n')
    console.log("<<<", coinbaseTxObject12);
  }
  if (hash === "c623a2700681dbc7a9a31bcd1d5128777adb107ad0f143d9367ee0dbb5a6bd0f") {
    console.log("Sending Object: c623a2700681dbc7a9a31bcd1d5128777adb107ad0f143d9367ee0dbb5a6bd0f \n")
    socket.write(canonicalize(coinbaseTxObject13) + '\n')
    console.log("<<<", coinbaseTxObject13);
  }
  return;
}