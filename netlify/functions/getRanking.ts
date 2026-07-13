import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://viniciusbispo272_db_user:<db_password>@ac-ep3wfv2-shard-00-00.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-01.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-02.ghf1vap.mongodb.net:27017/?ssl=true&replicaSet=atlas-91xsc7-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'mathgame';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (uri.includes("COLE_SUA_URI_AQUI")) {
    return { statusCode: 500, body: JSON.stringify({ error: "MongoDB URI not configured" }) };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const metaCollection = db.collection('metadata');

    const RESET_INTERVAL = 30 * 60 * 1000; // 30 minutes in ms
    const REWARDS = [10, 5, 2];

    let meta = await metaCollection.findOne({ _id: 'ranking_reset' });
    let now = Date.now();
    let nextResetTime = meta?.nextResetTime;

    if (!meta || !nextResetTime || now >= nextResetTime) {
      // We need to trigger the reset!
      const top3 = await usersCollection.find({}).sort({ level: -1, xp: -1 }).limit(3).project({ userId: 1 }).toArray();
      
      // 1. Give rewards
      for (let i = 0; i < top3.length; i++) {
        if (REWARDS[i]) {
          await usersCollection.updateOne(
            { userId: top3[i].userId }, 
            { $inc: { coins: REWARDS[i] } }
          );
        }
      }

      // 2. Removed the level and XP reset so users keep their progress!
      // await usersCollection.updateMany({}, { $set: { level: 1, xp: 0 } });

      // 3. Set the new nextResetTime
      nextResetTime = now + RESET_INTERVAL;
      await metaCollection.updateOne(
        { _id: 'ranking_reset' },
        { $set: { nextResetTime } },
        { upsert: true }
      );
    }

    // Get top 10 users ordered by level descending
    const ranking = await usersCollection
      .find({})
      .sort({ level: -1, xp: -1 })
      .limit(10)
      .project({ _id: 0, userId: 1, username: 1, level: 1, activeIcon: 1 })
      .toArray();

    await client.close();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ranking, nextResetTime })
    };
  } catch (error: any) {
    console.error("MongoDB Connection Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch ranking', 
        details: error.message || error.toString() 
      })
    };
  }
};
