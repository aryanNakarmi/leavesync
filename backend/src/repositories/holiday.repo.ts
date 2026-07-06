import { ObjectId } from "mongodb";
import { getDB } from "../config/database";
import { Holiday } from "../types";

export async function getHolidaysByYear(year: number) {
  const db = getDB();
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;
  return db.collection("holidays")
    .find({
      date: { $gte: startOfYear, $lte: endOfYear }
    })
    .sort({ date: 1 })
    .toArray();
}

export async function getHolidaysBetween(startDate: string, endDate: string) {
  const db = getDB();
  return db.collection("holidays")
    .find({
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .toArray();
}

export async function getHolidayById(id: string) {
  const db = getDB();
  return db.collection("holidays").findOne({ _id: new ObjectId(id) });
}

export async function createHoliday(data: {
  name: string;
  date: string;
  description?: string;
  isRecurringYearly: boolean;
}) {
  const db = getDB();
  const result = await db.collection("holidays").insertOne({
    ...data,
    createdAt: new Date()
  });
  return result.insertedId;
}

export async function updateHoliday(id: string, updates: Partial<{
  name: string;
  date: string;
  description: string;
  isRecurringYearly: boolean;
}>) {
  const db = getDB();
  const result = await db.collection("holidays").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteHoliday(id: string) {
  const db = getDB();
  const result = await db.collection("holidays").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getHolidayByDate(date: string) {
  const db = getDB();
  return db.collection("holidays").findOne({ date });
}
