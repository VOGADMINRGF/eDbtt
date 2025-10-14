import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function main() {
  const uri = process.env.CORE_MONGODB_URI!;
  const dbName = process.env.CORE_DB_NAME!;
  if (!uri || !dbName) throw new Error('Missing CORE_MONGODB_URI or CORE_DB_NAME');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const idxName = 'partitionKey_1_seq_1';
  const cols = await db.listCollections().toArray();

  for (const c of cols) {
    const coll = db.collection(c.name);
    try {
      const idx = await coll.indexExists(idxName);
      if (idx) {
        await coll.dropIndex(idxName);
        console.log(`dropped ${idxName} on ${dbName}.${c.name}`);
      }
    } catch(e:any) {
      console.log(`skip ${c.name}: ${e?.message||e}`);
    }
  }

  await client.close();
}

main().catch((e)=>{ console.error(e); process.exit(1); });
