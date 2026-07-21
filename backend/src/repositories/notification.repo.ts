import { ObjectId } from "mongodb";
import { getDB } from "../config/database";
import { Notification } from "../types";

export async function createNotification(notification: Omit<Notification, "_id" | "createdAt">) {
  const db = getDB();
  const result = await db.collection("notifications").insertOne({
    ...notification,
    createdAt: new Date()
  });
  return result.insertedId;
}

export async function getNotificationsByUser(userId: string, limit = 20) {
  const db = getDB();
  return db.collection("notifications")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getUnreadCount(userId: string) {
  const db = getDB();
  return db.collection("notifications").countDocuments({ userId, isRead: false });
}

export async function markAsRead(notificationId: string, userId: string) {
  const db = getDB();
  await db.collection("notifications").updateOne(
    { _id: new ObjectId(notificationId), userId },
    { $set: { isRead: true } }
  );
}

export async function markAllAsRead(userId: string) {
  const db = getDB();
  await db.collection("notifications").updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
}
