import { knownObjectsDb } from "./db";

const printDb = async () => {
  await knownObjectsDb.open();

  // await knownObjectsDb.del("000000001a8a21aa884e5fa85a23a372a521d0ec3d74d2aaece160d306d0d9ab")
  // await knownObjectsDb.del("e2e3d5919de1de1338217bfd1d364bf381c2c7336e0c85c46e4ae86232c26529")
  // await knownObjectsDb.del("f4535e84ded732f4ddacbb07133c2391844851da8e7f8b9484cff03ca833be0b")
  // await knownObjectsDb.del("a633520faec43d9dd868df547d397d3d1b0c326f9864f48eb8655f7f33cece95")
  // await knownObjectsDb.del("000000001a8a21aa884e5fa85a23a372a521d0ec3d74d2aaece160d306d0d9ab")
  // await knownObjectsDb.del("0000000025686ecaf9edb4eba5146e73099636dc5f856f363313c22b3237d223")
  await knownObjectsDb.del("d38db64554dcb26d5246ec7f4ea365b654f1bb1710a9c6615e8053cea11ca547")
  await knownObjectsDb.del("0308131405b190db3c94052b9b7185a62538010c8e5298cb104e31edc5a68877")
  // Genesis
  // await knownObjectsDb.del("00000000522473196b73bc619a8b18472c4cb4c6caf785a13fa32aaae7222ff6")


  for await (const [key, value] of knownObjectsDb.iterator()) {
    console.log("KEY:", key);
    console.log("VALUE:", value);
    console.log("----");
  }
  await knownObjectsDb.close();
};

await printDb();