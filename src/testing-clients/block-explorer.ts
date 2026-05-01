// Block ID: 000000006bf98949bfe26c22ec66b9a7f72194b5b8191314eaf2911457b97b4c
export const FourthBlock = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1772105811,
    miner: "rxb",
    nonce: "42069deadbeefd5d9e4a903b4000000000700000000000000000000090628162",
    note: "Why couldn't the bicycle stand up by itself? It was two tired. (Height: 4)",
    previd: "00000000264b56f873424ddef63e8a3ee8ecd66daa46c6c84c631e66949bb54a",
    txids: [
      "e9647596fb6f25344a9725f8fe45a86c5797cf36480d61a542e6bb776a384e2f"
    ],
    type: "block"
  },
  type: "object"
};

// Block ID: 00000000264b56f873424ddef63e8a3ee8ecd66daa46c6c84c631e66949bb54a
export const ThirdBlock = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1772105709,
    miner: "rxb",
    nonce: "42069deadbeefdf8017359325000000000800000000000000000000069878841",
    note: "What did the ocean say to the beach? Nothing, it just waved. (Height: 3)",
    previd: "0000000061872bb5cba523a6ae523fa658f8db9d0dbb67ada8ad1f0a45c2e3ed",
    txids: [
      "191dc6de40ae6dc791b7829994029b457cb3880b835b37c4fe4507aff9c5c93b"
    ],
    type: "block"
  },
  type: "object"
};
// Block ID: 0000000061872bb5cba523a6ae523fa658f8db9d0dbb67ada8ad1f0a45c2e3ed
export const SecondBlock = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1772080844,
    miner: "kalaburi",
    nonce: "e6257b82c389bd2e892244c3c49c120355c248e519b35a14e62d868667636422",
    previd: "0000000096e9a9cb60ef3efe92133656557fad1f929e7bb9300a548d7be30924",
    txids: [
      "e8fe18770e4bc3244b41b1df6fd0eb0afe8add44f85858db7fa596ffbb02d247"
    ],
    type: "block"
  },
  type: "object"
};

// Block ID: 0000000096e9a9cb60ef3efe92133656557fad1f929e7bb9300a548d7be30924
export const FirstBlock = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1772028037,
    miner: "kalaburi",
    nonce: "b067391b9caf9821861e83cfc4d4656150ff2f1f800dbf37bdc76d211e76bf86",
    previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
    txids: [
      "f0769c4452aec5979016ca16675e9cff0c602be973a365d4e951df6fb678624a"
    ],
    type: "block"
  },
  type: "object"
};



// Block ID: 000000009d4b5985fa97e88dfa566f67f7d63d0fccab59f66e37679719235dfa
export const FirstBlock1 = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1771242821,
    miner: "grader",
    nonce: "69585ee83e90091b68f401291d754b0b31f7d6c5e07fca89dbbac931c762d9f1",
    note: "First block",
    previd: "00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6",
    txids: [],
    type: "block"
  },
  type: "object"
};

// Block ID: 0000000086648a32ff2cfa6c6fb73867deafe07cb7c8b5cdef1847504785beab
export const SecondBlock1 = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1771299557,
    miner: "grader",
    nonce: "bf9f941e1c2ee498038476ec0b21fb2e30fa4dd78b7269fa546875ba585c2ff5",
    note: "Second block",
    previd: "000000009d4b5985fa97e88dfa566f67f7d63d0fccab59f66e37679719235dfa",
    txids: [],
    type: "block"
  },
  type: "object"
};

// Block ID: 00000000619bc467afc9dc0c4d6de3f4462a3c3f1b7e54a96263c4307e4d6923
export const ThirdBlock1 = {
  object: {
    T: "00000000abc00000000000000000000000000000000000000000000000000000",
    created: 1771340261,
    miner: "grader",
    nonce: "2b3f66c2296d78ead8c5ec6b3fd181c422e1c37bf61257a2e05b1d14123ebc45",
    note: "Third block",
    previd: "0000000086648a32ff2cfa6c6fb73867deafe07cb7c8b5cdef1847504785beab",
    txids: [],
    type: "block"
  },
  type: "object"
};


// TRANSACTIONS 


// Tx ID: f0769c4452aec5979016ca16675e9cff0c602be973a365d4e951df6fb678624a
export const firstCoinbaseTx = {
  object: {
    type: "transaction",
    height: 1,
    outputs: [
      {
        pubkey: "b6a95d7b410ae1eb924898ae584d21523b53aa5a78d1bc54abe964fd8e63f487",
        value: 50000000000000
      }
    ]
  },
  type: "object"
};

// Tx ID: e8fe18770e4bc3244b41b1df6fd0eb0afe8add44f85858db7fa596ffbb02d
export const secondCoinbaseTx = {
  object: {
    type: "transaction",
    height: 2,
    outputs: [
      {
        pubkey: "b6a95d7b410ae1eb924898ae584d21523b53aa5a78d1bc54abe964fd8e63f487",
        value: 50000000000000
      }
    ]
  },
  type: "object"
};

// Tx ID: 191dc6de40ae6dc791b7829994029b457cb3880b835b37c4fe4507aff9c5c93b
export const thirdCoinbaseTx = {
  object: {
    type: "transaction",
    height: 3,
    outputs: [
      {
        pubkey: "ac68fab22e0480c3fd02d96d78facbc040209080a3296b4324029e9d82710ab3",
        value: 50000000000000
      }
    ]
  },
  type: "object"
};

// Tx ID: e9647596fb6f25344a9725f8fe45a86c5797cf36480d61a542e6bb776a384e2f
export const fourthCoinbaseTx = {
  object: {
    type: "transaction",
    height: 4,
    outputs: [
      {
        pubkey: "ac68fab22e0480c3fd02d96d78facbc040209080a3296b4324029e9d82710ab3",
        value: 50000000000000
      }
    ]
  },
  type: "object"
};