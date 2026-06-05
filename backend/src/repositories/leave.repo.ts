import { ObjectId } from "mongodb";
import { getDB } from "../config/database";
import { LeaveRequest } from "../types";

export async function createLeaveRequest(request: Omit<LeaveRequest, "_id" | "createdAt">) {
  const db = getDB();
  
  const result = await db.collection("leaveRequests").insertOne({
    ...request,
    createdAt: new Date()
  });

  return result.insertedId;
}

export async function getLeaveRequestById(id: string) {
  const db = getDB();
  return db.collection("leaveRequests").findOne({ _id: new ObjectId(id) });
}

export async function getLeaveRequestsByUser(userId: string) {
  const db = getDB();
  return db.collection("leaveRequests")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getAllLeaveRequests() {
  const db = getDB();
  return db.collection("leaveRequests")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateLeaveRequest(id: string, updates: Partial<LeaveRequest>) {
  const db = getDB();
  
  const result = await db.collection("leaveRequests").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );

  return result.modifiedCount > 0;
}

export async function getOverlappingLeaves(userId: string, startDate: Date, endDate: Date) {
  const db = getDB();
  
  return db.collection("leaveRequests").findOne({
    userId,
    status: "APPROVED",
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });
}
