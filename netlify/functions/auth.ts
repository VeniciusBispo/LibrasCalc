import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || "mongodb://viniciusbispo272_db_user:<db_password>@ac-ep3wfv2-shard-00-00.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-01.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-02.ghf1vap.mongodb.net:27017/?ssl=true&replicaSet=atlas-91xsc7-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'mathgame';

// Helper for basic password hashing
const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (uri.includes("COLE_SUA_URI_AQUI")) {
    return { statusCode: 500, body: JSON.stringify({ error: "MongoDB URI not configured" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { username, password } = body;

  if (!username || !password || username.trim() === '' || password.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: "Username and password are required" }) };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const usernameStr = username.trim();
    const hashedPassword = hashPassword(password);

    let user = await usersCollection.findOne({ username: usernameStr });

    if (!user) {
      // Create new user
      const newUserId = crypto.randomUUID();
      user = {
        userId: newUserId,
        username: usernameStr,
        password: hashedPassword,
        level: 1,
        xp: 0,
        coins: 0,
        activeIcon: 'icon_user'
      };
      await usersCollection.insertOne(user);
    } else {
      // User exists
      if (!user.password) {
        // Adopt old account
        await usersCollection.updateOne({ userId: user.userId }, { $set: { password: hashedPassword } });
      } else if (user.password !== hashedPassword) {
        // Incorrect password
        await client.close();
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "Senha incorreta" })
        };
      }
    }

    await client.close();

    // Remove password before returning
    delete user.password;
    delete user._id;

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
        error: 'Authentication failed', 
        details: error.message || error.toString() 
      })
    };
  }
};
