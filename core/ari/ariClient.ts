// core/ari/ariClient.ts
import axios from "axios";

const ARI_API_KEY = process.env.ARI_API_KEY;

export async function queryAri({ query, sources = [], format = "json" }) {
  const resp = await axios.post(
    "https://api.openai.com/v1/ari/query",
    { query, sources, format },
    { headers: { "Authorization": `Bearer ${ARI_API_KEY}` } }
  );
  return resp.data;
}
