import { Level } from "level";
import type { ObjectItem } from "./types";
import { fileURLToPath } from "url";
import { UTXOSet } from "./utxo";

const dbPath = fileURLToPath(new URL("../objectDatabase", import.meta.url));
const heightDbPath = fileURLToPath(new URL("../heightsDatabase", import.meta.url));
const utxoSetDbPath = fileURLToPath(new URL("../utxosDatabase", import.meta.url));

export const knownObjectsDb = new Level<string, ObjectItem>(dbPath, {
  valueEncoding: "json",
});

export const blockHeightsDb = new Level<string, number>(heightDbPath, {
  valueEncoding: "json",
});

export const blockUtxoSetDb = new Level<string, string[]>(utxoSetDbPath, {
  valueEncoding: "json",
});

