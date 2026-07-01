import { connectDB } from "./config/database";
import bcrypt from "bcryptjs";

async function seed() {
  const db = await connectDB();

  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Check if already seeded
  const existingUsers = await db.collection("User").countDocuments();
  if (existingUsers > 0) {
    console.log("⚠️  Database already has data. Skipping seed.");
    console.log("   Drop collections first if you want to reseed.");
    process.exit(0);
  }

  // ===== Users =====
  const adminResult = await db.collection("User").insertOne({
    name: "Admin User",
    email: "admin@leavesync.com",
    password: hashedPassword,
    role: "ADMIN",
    isActive: true,
    createdAt: new Date()
  });

  const aliceResult = await db.collection("User").insertOne({
    name: "Alice Johnson",
    email: "alice@leavesync.com",
    password: hashedPassword,
    role: "EMPLOYEE",
    isActive: true,
    createdAt: new Date()
  });

  const bobResult = await db.collection("User").insertOne({
    name: "Bob Smith",
    email: "bob@leavesync.com",
    password: hashedPassword,
    role: "EMPLOYEE",
    isActive: true,
    createdAt: new Date()
  });

  console.log("✅ Users created!");

  // ===== Leave Types =====
  const annualLeave = await db.collection("leaveTypes").insertOne({
    name: "Annual Leave",
    isPaid: true,
    annualQuota: 20,
    accrualMethod: "ANNUAL",
    maxCarryover: 5,
    status: "ACTIVE"
  });

  const sickLeave = await db.collection("leaveTypes").insertOne({
    name: "Sick Leave",
    isPaid: true,
    annualQuota: 12,
    accrualMethod: "MONTHLY",
    maxCarryover: 0,
    status: "ACTIVE"
  });

  const personalLeave = await db.collection("leaveTypes").insertOne({
    name: "Personal Leave",
    isPaid: false,
    annualQuota: 5,
    accrualMethod: "ANNUAL",
    maxCarryover: 0,
    status: "ACTIVE"
  });

  const publicHoliday = await db.collection("leaveTypes").insertOne({
    name: "Public Holiday",
    isPaid: true,
    annualQuota: 0,
    accrualMethod: "EVENT_BASED",
    maxCarryover: 0,
    status: "INACTIVE"
  });

  console.log("✅ Leave types created! (Annual, Sick, Personal, Public Holiday)");

  // ===== Leave Balances (current year) =====
  const currentYear = new Date().getFullYear();

  await db.collection("leaveBalances").insertMany([
    // Alice balances
    { userId: aliceResult.insertedId.toString(), leaveTypeId: annualLeave.insertedId.toString(), year: currentYear, allocated: 20, used: 3, carriedOver: 2 },
    { userId: aliceResult.insertedId.toString(), leaveTypeId: sickLeave.insertedId.toString(), year: currentYear, allocated: 12, used: 1, carriedOver: 0 },
    { userId: aliceResult.insertedId.toString(), leaveTypeId: personalLeave.insertedId.toString(), year: currentYear, allocated: 5, used: 0, carriedOver: 0 },
    // Bob balances
    { userId: bobResult.insertedId.toString(), leaveTypeId: annualLeave.insertedId.toString(), year: currentYear, allocated: 20, used: 5, carriedOver: 0 },
    { userId: bobResult.insertedId.toString(), leaveTypeId: sickLeave.insertedId.toString(), year: currentYear, allocated: 12, used: 2, carriedOver: 0 },
    { userId: bobResult.insertedId.toString(), leaveTypeId: personalLeave.insertedId.toString(), year: currentYear, allocated: 5, used: 1, carriedOver: 0 },
  ]);

  console.log("✅ Leave balances created!");

  // ===== Sample Leave Requests =====
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  await db.collection("leaveRequests").insertMany([
    {
      userId: aliceResult.insertedId.toString(),
      leaveTypeId: annualLeave.insertedId.toString(),
      startDate: new Date(startOfMonth.getTime() + 5 * 86400000),
      endDate: new Date(startOfMonth.getTime() + 7 * 86400000),
      totalDays: 3,
      reason: "Family vacation",
      status: "PENDING",
      createdAt: new Date(now.getTime() - 3 * 86400000)
    },
    {
      userId: aliceResult.insertedId.toString(),
      leaveTypeId: sickLeave.insertedId.toString(),
      startDate: new Date(now.getTime() - 10 * 86400000),
      endDate: new Date(now.getTime() - 9 * 86400000),
      totalDays: 2,
      reason: "Doctor's appointment",
      status: "APPROVED",
      adminComment: "Get well soon!",
      createdAt: new Date(now.getTime() - 12 * 86400000)
    },
    {
      userId: bobResult.insertedId.toString(),
      leaveTypeId: annualLeave.insertedId.toString(),
      startDate: new Date(now.getTime() + 14 * 86400000),
      endDate: new Date(now.getTime() + 18 * 86400000),
      totalDays: 5,
      reason: "Trip to Pokhara",
      status: "APPROVED",
      adminComment: "Enjoy!",
      createdAt: new Date(now.getTime() - 5 * 86400000)
    }
  ]);

  console.log("✅ Sample leave requests created!");

  // Summary
  console.log("");
  console.log("┌─────────────────────────────────────────┐");
  console.log("│         🌿 LeaveSync is ready!          │");
  console.log("├─────────────────────────────────────────┤");
  console.log("│  admin@leavesync.com / password123      │");
  console.log("│  alice@leavesync.com / password123      │");
  console.log("│  bob@leavesync.com / password123        │");
  console.log("└─────────────────────────────────────────┘");

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});