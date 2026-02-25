import { promises as fs } from "fs";

const DEFAULT_PATH = "peers.json";

/**
 * Load peers from a JSON file.
 * File format: ["host:port", "host:port", ...]
 *
 * Returns [] if the file doesn't exist or is invalid.
 */
export async function loadPeers(path: string = DEFAULT_PATH): Promise<string[]> {
  try {
    const text = await fs.readFile(path, "utf8");
    const parsed: unknown = JSON.parse(text);

    if (!Array.isArray(parsed)) return [];

    const peers: string[] = [];
    for (const item of parsed) {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.length > 0) peers.push(trimmed);
      }
    }
    return peers;
  } catch (err: any) {
    // If file doesn't exist, that's fine on first run.
    if (err?.code === "ENOENT") return [];
    // If JSON is corrupted or other error occurs, fall back to empty.
    return [];
  }
}

/**
 * Save peers to a JSON file.
 * Takes any iterable (Set or Array), trims entries, deduplicates, and writes.
 */
export async function savePeers(
  peers: Iterable<string>,
  path: string = DEFAULT_PATH
): Promise<void> {
  const unique = new Set<string>();
  for (const p of peers) {
    const trimmed = (p ?? "").trim();
    if (trimmed.length > 0) unique.add(trimmed);
  }

  const arr = Array.from(unique);
  arr.sort(); // optional: makes file stable/diff-friendly

  const json = JSON.stringify(arr, null, 2);
  await fs.writeFile(path, json + "\n", "utf8");
}