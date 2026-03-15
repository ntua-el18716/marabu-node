import { Level } from "level";
import type { ObjectItem } from "./types";
import { fileURLToPath } from "url";

const dbPath = fileURLToPath(new URL("../objectDatabase", import.meta.url));

export const knownObjectsDb = new Level<string, ObjectItem>(dbPath, {
  valueEncoding: "json",
});
