import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://viniciusbispo272_db_user:<db_password>@ac-ep3wfv2-shard-00-00.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-01.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-02.ghf1vap.mongodb.net:27017/?ssl=true&replicaSet=atlas-91xsc7-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'mathgame';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (uri.includes("COLE_SUA_URI_AQUI")) {
    return { statusCode: 500, body: JSON.stringify({ error: "MongoDB URI not configured" }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { userId, username, level, xp, coins, activeIcon } = data;

    if (!userId || !username) {
      return { statusCode: 400, body: 'Missing userId or username' };
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { userId },
      {
        $set: {
          username,
          level,
          xp,
          coins,
          activeIcon,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error: any) {
    console.error("MongoDB Connection Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to update score',
        details: error.message || error.toString() 
      })
    };
  }
};
