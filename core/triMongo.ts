import mongoose from "mongoose";
let conn: Promise<typeof mongoose> | null = null;
async function getConn(uri?:string){
  const URL = uri || process.env.MONGO_URI || process.env.MONGODB_URI || "";
  if(!URL) throw new Error("MONGO_URI fehlt für getCol()");
  if(!conn) conn = mongoose.connect(URL);
  return conn;
}
export async function getCol<T=any>(name:string, _db?: "core"|"votes"|"pii"){
  await getConn();
  return mongoose.connection.collection<T>(name);
}
