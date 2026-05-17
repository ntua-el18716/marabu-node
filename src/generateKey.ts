import { ed25519 } from "@noble/curves/ed25519.js";
import { randomBytes } from "crypto";

const privateKey = randomBytes(32);
const publicKey = ed25519.getPublicKey(privateKey);

console.log("PRIVATE_KEY =", Buffer.from(privateKey).toString("hex"));
console.log("PUBLIC_KEY  =", Buffer.from(publicKey).toString("hex"));