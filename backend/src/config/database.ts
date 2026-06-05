import { MongoClient, Db } from "mongodb";

let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/leavesync";
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    db = client.db("leavesync");
    console.log("✓ Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!db) throw new Error("Database not connected. Call connectDB() first.");
  return db;
}
