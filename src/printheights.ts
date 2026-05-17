import { knownObjectsDb } from "./db";
import { mempool } from "./mempool";

const deleteTxsFromDb = async () => {
  const txids = [
    "0f2273c7e08c31400cb53b6f853686329a335d44d05548dba94de4e0a9e16588",
    "0436e842526303d1ba61f00983236ff7f83a6cf32cb6bd97ea2a91b18db2e1df",
    // "6e179f61365dfea9f3b4ca9e7543be213a26d6a9a9c478e3ab4267e4195e7daf",
    // "f1026077c0cdec04da6bdf0c4be2cef58f97d83d013cb2c5be17c65d13885ee5",
    // "8950801fbc25c4e11b7f45820373d531d986f0e8c15632d89af01e9a052c91f6",
    // "f9ce50d921de2396245c315d5c69902f1759aaf4e0a8c5d027809fb7d749419e",
    // "cb4404b2ca618cc594b8e38ae1cfdfc8985f2ef7d586767e3fe87810676b36df",
  ];

  for (const txid of txids) {
    await knownObjectsDb.del(txid);
    mempool.txOrder = mempool.txOrder.filter(id => id !== txid);
    console.log("deleted tx:", txid);
  }

  mempool.utxoSet.applyChainTipUtxoContents();
};

await deleteTxsFromDb();