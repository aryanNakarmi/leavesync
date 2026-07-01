import { getDB } from "../config/database";

export async function getActiveLeaveTypes() {
  const db = getDB();
  return db.collection("leaveTypes")
    .find({ status: "ACTIVE" })
    .sort({ name: 1 })
    .toArray();
}
