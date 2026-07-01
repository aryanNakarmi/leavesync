import { getDB } from "../config/database";
import { ObjectId } from "mongodb";

export async function getActiveLeaveTypes() {
  const db = getDB();
  return db.collection("leaveTypes")
    .find({ status: "ACTIVE" })
    .sort({ name: 1 })
    .toArray();
}

export async function getAllLeaveTypes() {
  const db = getDB();
  return db.collection("leaveTypes")
    .find({})
    .sort({ name: 1 })
    .toArray();
}

export async function getLeaveTypeById(id: string) {
  const db = getDB();
  return db.collection("leaveTypes").findOne({ _id: new ObjectId(id) });
}

export async function createLeaveType(data: {
  name: string;
  isPaid: boolean;
  annualQuota: number;
  accrualMethod: "ANNUAL" | "MONTHLY" | "QUARTERLY" | "EVENT_BASED";
  maxCarryover: number;
  status: "ACTIVE" | "INACTIVE";
}) {
  const db = getDB();
  const result = await db.collection("leaveTypes").insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return result.insertedId;
}

export async function updateLeaveType(id: string, updates: Partial<{
  name: string;
  isPaid: boolean;
  annualQuota: number;
  accrualMethod: "ANNUAL" | "MONTHLY" | "QUARTERLY" | "EVENT_BASED";
  maxCarryover: number;
  status: "ACTIVE" | "INACTIVE";
}>) {
  const db = getDB();
  const result = await db.collection("leaveTypes").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteLeaveType(id: string) {
  const db = getDB();
  const result = await db.collection("leaveTypes").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
