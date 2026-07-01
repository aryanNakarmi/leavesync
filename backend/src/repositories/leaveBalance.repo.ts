import { getDB } from "../config/database";

export async function getLeaveBalance(userId: string, year: number) {
  const db = getDB();
  return db.collection("leaveBalances")
    .find({ userId, year })
    .toArray();
}

export async function upsertLeaveBalance(balance: {
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  carriedOver: number;
}) {
  const db = getDB();
  const existing = await db.collection("leaveBalances").findOne({
    userId: balance.userId,
    leaveTypeId: balance.leaveTypeId,
    year: balance.year
  });

  if (existing) {
    await db.collection("leaveBalances").updateOne(
      { _id: existing._id },
      { $set: { allocated: balance.allocated, used: balance.used, carriedOver: balance.carriedOver } }
    );
    return existing._id;
  }

  const result = await db.collection("leaveBalances").insertOne(balance);
  return result.insertedId;
}
