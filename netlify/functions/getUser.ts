import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://viniciusbispo272_db_user:<db_password>@ac-ep3wfv2-shard-00-00.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-01.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-02.ghf1vap.mongodb.net:27017/?ssl=true&replicaSet=atlas-91xsc7-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'mathgame';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const userId = event.queryStringParameters?.userId;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId parameter' }) };
  }

  if (uri.includes("COLE_SUA_URI_AQUI")) {
    return { statusCode: 500, body: JSON.stringify({ error: "MongoDB URI not configured" }) };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ userId }, { projection: { _id: 0, level: 1, xp: 1, coins: 1, activeIcon: 1, activeTheme: 1, activeDifficulty: 1, unlockedIcons: 1, unlockedThemes: 1, unlockedDifficulties: 1 } });
    
    await client.close();

    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    };
  } catch (error: any) {
    console.error("MongoDB Connection Error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch user', 
        details: error.message || error.toString() 
      })
    };
  }
};
