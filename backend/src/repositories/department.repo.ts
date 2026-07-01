import { getDB } from "../config/database";
import { ObjectId } from "mongodb";

export async function getAllDepartments() {
  const db = getDB();
  return db.collection("departments")
    .find({})
    .sort({ name: 1 })
    .toArray();
}

export async function getDepartmentById(id: string) {
  const db = getDB();
  return db.collection("departments").findOne({ _id: new ObjectId(id) });
}

export async function getDepartmentByName(name: string) {
  const db = getDB();
  return db.collection("departments").findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
}

export async function createDepartment(name: string) {
  const db = getDB();
  const result = await db.collection("departments").insertOne({
    name,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return result.insertedId;
}

export async function updateDepartment(id: string, name: string) {
  const db = getDB();
  const result = await db.collection("departments").updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteDepartment(id: string) {
  const db = getDB();
  const result = await db.collection("departments").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
