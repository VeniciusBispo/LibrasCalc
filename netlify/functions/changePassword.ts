import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGODB_URI || "mongodb://viniciusbispo272_db_user:<db_password>@ac-ep3wfv2-shard-00-00.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-01.ghf1vap.mongodb.net:27017,ac-ep3wfv2-shard-00-02.ghf1vap.mongodb.net:27017/?ssl=true&replicaSet=atlas-91xsc7-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'mathgame';

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

  const { userId, currentPassword, newPassword } = body;

  if (!userId || !currentPassword || !newPassword) {
    return { statusCode: 400, body: JSON.stringify({ error: "Preencha todos os campos." }) };
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const hashedCurrentPassword = hashPassword(currentPassword);
    const hashedNewPassword = hashPassword(newPassword);

    const user = await usersCollection.findOne({ userId });

    if (!user) {
      await client.close();
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Usuário não encontrado." })
      };
    }

    if (user.password !== hashedCurrentPassword) {
      await client.close();
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Senha atual incorreta." })
      };
    }

    await usersCollection.updateOne(
      { userId },
      { $set: { password: hashedNewPassword } }
    );

    await client.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error: any) {
    console.error("MongoDB Connection Error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to change password', 
        details: error.message || error.toString() 
      })
    };
  }
};
