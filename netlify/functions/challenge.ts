import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://viniciusbispo272_db_user:<db_password>@ac-ep3wfv2-shard-00-00.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-01.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-02.ghf1vap.mongodb.net:27017/?ssl=true&replicaSet=atlas-91xsc7-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'mathgame';

const CHALLENGE_DURATION_MS = 4 * 60 * 1000; // 4 minutes

function generateRandomTarget(current: number): number {
  const min = 2;
  const max = 10;
  let newTarget;
  do {
    newTarget = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (newTarget === current);
  return newTarget;
}

export const handler: Handler = async (event, context) => {
  if (uri.includes("COLE_SUA_URI_AQUI")) {
    return { statusCode: 500, body: JSON.stringify({ error: "MongoDB URI not configured" }) };
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const metaCollection = db.collection('metadata');

    let challenge = await metaCollection.findOne({ _id: 'global_challenge' });
    const now = Date.now();

    const generateNewChallenge = async (currentVal: number) => {
      const targetNumber = generateRandomTarget(currentVal);
      const timestamp = Date.now();
      const expiresAt = timestamp + CHALLENGE_DURATION_MS;
      
      const newDoc = { _id: 'global_challenge', targetNumber, timestamp, expiresAt };
      await metaCollection.updateOne(
        { _id: 'global_challenge' },
        { $set: newDoc },
        { upsert: true }
      );
      return newDoc;
    };

    if (event.httpMethod === 'GET') {
      let doc = challenge;
      if (!doc || now >= doc.expiresAt) {
        doc = await generateNewChallenge(doc?.targetNumber || 0);
      }

      const timeLeftSeconds = Math.max(0, Math.floor((doc.expiresAt - now) / 1000));

      await client.close();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetNumber: doc.targetNumber,
          timeLeftSeconds,
          expiresAt: doc.expiresAt
        })
      };
    }

    if (event.httpMethod === 'POST') {
      // Someone completed the challenge! Force regenerate it immediately
      const currentVal = challenge?.targetNumber || 0;
      const newDoc = await generateNewChallenge(currentVal);
      
      await client.close();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          targetNumber: newDoc.targetNumber,
          timeLeftSeconds: Math.floor(CHALLENGE_DURATION_MS / 1000),
          expiresAt: newDoc.expiresAt
        })
      };
    }

    await client.close();
    return { statusCode: 405, body: 'Method Not Allowed' };

  } catch (error: any) {
    console.error("MongoDB challenge error:", error);
    try { await client.close(); } catch {}
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Database error', details: error.message })
    };
  }
};
