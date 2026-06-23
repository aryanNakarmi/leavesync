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