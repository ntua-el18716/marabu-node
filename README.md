# Blockchain Foundations (In progress - PSET 2)

This repository contains my implementation work for the **Blockchain Foundations** class, aiming on the implementation of a blockchain node from scratch.

Course page: https://www.marabu.dev/

## About the class

Blockchain Foundations is a graduate course taught at NTUA (Spring 2026) and focuses on the theory behind blockchains and how to implement them in practice. 

## PSETS

### PSET1 – Networking & Peer Discovery

- Implemented the TCP networking layer of a Marabu node
- Implemented protocol handshake (hello) and message validation
- Supported peer discovery (getpeers / peers)
- Deployed a publicly reachable node on a VPS

### PSET2 – Object Exchange & Transaction Validation

- Integrated LevelDB for persistent storage of objects(transcactions, blocks)
- Implemented object validation according to the Marabu protocol rules
- Enabled peers to request and exchange transactions and blocks

### PSET3 – Block Validation & Maintaining UTXO Sets

- Implemented block validation taking into account the proof of work, the parent block, and its transactions
- Implemented coinbase transaction validation (no inputs, one output, valid height, law of conservation)
- Computation of a UTXO set for each block, by coping the parent's UTXO set and applying the transactions of the block.
- Enabled peers to request and exchange transactions and blocks


## Run the project

Install dependencies:

```bash
bun install
```

Start node server:

```bash
bun run dev:server
```