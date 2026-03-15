import { knownObjectsDb } from "./db";

const printDb = async () => {
  await knownObjectsDb.open();

  for await (const [key, value] of knownObjectsDb.iterator()) {
    console.log("KEY:", key);
    console.log("VALUE:", value);
    console.log("----");
  }
  await knownObjectsDb.close();
};

await printDb();