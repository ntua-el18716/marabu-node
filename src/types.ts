import * as z from 'zod';
// Hello
export const HelloMessageSchema = z.object({
  type: z.literal('hello'),
  version: z.templateLiteral(["0.10.", z.int()]),
  agent: z.string().optional()
})

// Error
const errorNames = [
  'INTERNAL_ERROR', 'INVALID_FORMAT', 'UNKNOWN_OBJECT', 'UNFINDABLE_OBJECT', 'INVALID_HANDSHAKE', 'INVALID_TX_OUTPOINT',
  'INVALID_TX_SIGNATURE', 'INVALID_TX_CONSERVATION', 'INVALID_BLOCK_COINBASE', 'INVALID_BLOCK_TIMESTAMP', 'INVALID_BLOCK_POW', 'INVALID_GENESIS'
];
export const ErrorMessageSchema = z.object({
  type: z.literal('error'),
  name: z.enum(errorNames),
  description: z.string().max(128)
})

// GetPeers
export const GetPeersMessageSchema = z.object({
  type: z.literal('getpeers')
})

// Peers
export const peerAddr = z
  .string()
  .trim()
  .regex(/^(\[[0-9a-fA-F:]+\]|[^\s:\[\]]+):\d{1,5}$/, "expected host:port")
  .refine((s) => {
    const port = Number(s.slice(s.lastIndexOf(":") + 1));
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }, "port must be 1..65535");
export const PeersMessageSchema = z
  .object({
    type: z.literal("peers"),
    peers: z.array(peerAddr),
  });

// GetObject
export const GetObjectMessageSchema = z.object({
  type: z.literal('getobject'),
  objectid: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
})

// IHaveObject
export const IHaveObjectSchema = z.object({
  type: z.literal('ihaveobject'),
  objectid: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
})

// Object
export const ObjectSchema = z.object({
  type: z.literal('object'),
  object: z.object({
    type: z.literal("block"),
    T: z
      .string()
      .regex(/^[0-9a-f]{64}$/),
    created: z.int(),
    miner: z.string().max(128).optional(),
    nonce: z
      .string()
      .regex(/^[0-9a-f]{1,64}$/),
    note: z.string().max(128).optional(),
    previd: z
      .string()
      .regex(/^[0-9a-f]{64}$/),
    txids: z.array(
      z
        .string()
        .regex(/^[0-9a-f]{64}$/),
    )
  })
})

// GetMempool
export const GetMempoolSchema = z.object({
  type: z.literal('getmempool')
})

// Mempool
export const MempoolSchema = z.object({
  type: z.literal('mempool'),
  txids: z.array(
    z
      .string()
      .regex(/^[0-9a-f]{64}$/),)
})

// GetChainTip
export const GetChainTipSchema = z.object({
  type: z.literal('getchaintip')
})

// ChainTip
export const ChainTipSchema = z.object({
  type: z.literal('chaintip'),
  blockid: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
})


export const MessageSchema = z.discriminatedUnion('type', [
  HelloMessageSchema, ErrorMessageSchema, GetPeersMessageSchema, PeersMessageSchema, GetObjectMessageSchema, IHaveObjectSchema, ObjectSchema,
  GetMempoolSchema, MempoolSchema, GetChainTipSchema, ChainTipSchema
])
