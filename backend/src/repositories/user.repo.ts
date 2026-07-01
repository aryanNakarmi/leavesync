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

export async function getEmployeeWithDetails(id: string) {
  const db = getDB();
  const [user, leaveRequests, leaveBalances, leaveTypes] = await Promise.all([
    db.collection("User").findOne({ _id: new ObjectId(id) }),
    db.collection("leaveRequests")
      .find({ userId: id })
      .sort({ createdAt: -1 })
      .toArray(),
    db.collection("leaveBalances")
      .find({ userId: id, year: new Date().getFullYear() })
      .toArray(),
    db.collection("leaveTypes")
      .find({ status: "ACTIVE" })
      .sort({ name: 1 })
      .toArray()
  ]);

  // Enrich leave requests with leave type names
  const typeMap = new Map(leaveTypes.map((t: any) => [t._id.toString(), t.name]));
  const enrichedLeaves = leaveRequests.map((r: any) => ({
    ...r,
    _id: r._id.toString(),
    leaveTypeName: typeMap.get(r.leaveTypeId) || "Unknown"
  }));

  // Map balances with leave type names
  const enrichedBalances = leaveBalances.map((b: any) => ({
    ...b,
    _id: b._id.toString(),
    leaveTypeName: typeMap.get(b.leaveTypeId) || "Unknown"
  }));

  return {
    user,
    leaveRequests: enrichedLeaves,
    leaveBalances: enrichedBalances,
    leaveTypes
  };
}

export async function setLeaveBalance(
  userId: string,
  leaveTypeId: string,
  year: number,
  allocated: number
) {
  const db = getDB();
  const existing = await db.collection("leaveBalances").findOne({
    userId,
    leaveTypeId,
    year
  });

  if (existing) {
    await db.collection("leaveBalances").updateOne(
      { _id: existing._id },
      { $set: { allocated, updatedAt: new Date() } }
    );
    return existing._id;
  }

  const result = await db.collection("leaveBalances").insertOne({
    userId,
    leaveTypeId,
    year,
    allocated,
    used: 0,
    carriedOver: 0
  });
  return result.insertedId;
}

export async function activateUser(id: string) {
  const db = getDB();
  const result = await db.collection("User").updateOne(
    { _id: new ObjectId(id) },
    { $set: { isActive: true, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}