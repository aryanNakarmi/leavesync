import { connectDB } from "./config/database";
import bcrypt from "bcryptjs";

async function seed() {
  const db = await connectDB();

  console.log("🌱 Seeding database...");

  // Create users collection if doesn't exist
  const usersCollection = db.collection("users");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Admin user
  await usersCollection.insertOne({
    name: "Admin User",
    email: "admin@leavesync.com",
    password: hashedPassword,
    role: "ADMIN",
    isActive: true,
    createdAt: new Date()
  });

  // Employee 1
  await usersCollection.insertOne({
    name: "Alice Johnson",
    email: "alice@leavesync.com",
    password: hashedPassword,
    role: "EMPLOYEE",
    isActive: true,
    createdAt: new Date()
  });

  // Employee 2
  await usersCollection.insertOne({
    name: "Bob Smith",
    email: "bob@leavesync.com",
    password: hashedPassword,
    role: "EMPLOYEE",
    isActive: true,
    createdAt: new Date()
  });

  console.log("✅ Users created!");
  console.log("admin@leavesync.com / password123");
  console.log("alice@leavesync.com / password123");
  console.log("bob@leavesync.com / password123");

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});