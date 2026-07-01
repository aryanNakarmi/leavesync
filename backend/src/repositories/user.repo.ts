import { ObjectId } from "mongodb";
import { getDB } from "../config/database";
import { User } from "../types";
import bcrypt from "bcryptjs";

export async function createUser(user : Omit<User, "_id" | "createdAt">) {
  const db = getDB();
  const hashedPassword = await bcrypt.hash(user.password, 10);
  
  const result = await db.collection("User").insertOne({
    ...user,
    password: hashedPassword,
    createdAt: new Date()
  }); 

  return result.insertedId;
}

export async function getUserByEmail(email: string) {
  const db = getDB();
  return db.collection("User").findOne({ email });
}

export async function getUserById(id: string) {
  const db = getDB();
  return db.collection("User").findOne({ _id: new ObjectId(id) });
}

export async function getAllUsers() {
  const db = getDB();
  return db.collection("User").find({ role: "EMPLOYEE" }).toArray();
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateUser(id: string, updates: Partial<Omit<User, "_id" | "createdAt">>) {
  const db = getDB();
  
  const setData: any = { ...updates };
  
  // Hash password if being updated
  if (setData.password) {
    setData.password = await bcrypt.hash(setData.password, 10);
  }

  const result = await db.collection("User").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...setData, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}

export async function deactivateUser(id: string) {
  const db = getDB();
  
  const result = await db.collection("User").updateOne(
    { _id: new ObjectId(id) },
    { $set: { isActive: false, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}

