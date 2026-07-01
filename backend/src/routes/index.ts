import { Router } from "express";
import { authMiddleware, adminOnly } from "../middleware/auth";
import { login, register, getProfile } from "../controllers/auth.controller";
import { createLeave, getMyLeaves, approveLeave, rejectLeave, getAllLeaves, getMyLeaveBalance } from "../controllers/leave.controller";
import { getAllEmployees, getEmployeeDetail, createEmployee, updateEmployee, removeEmployee, updateEmployeeLeaveBalances } from "../controllers/user.controller";
import {
  getAllLeaveTypesHandler,
  getActiveLeaveTypesHandler,
  createLeaveTypeHandler,
  updateLeaveTypeHandler,
  deleteLeaveTypeHandler
} from "../controllers/leaveType.controller";
const router = Router();

// Auth routes
router.post("/login", login);
router.post("/register", register);
router.get("/profile", authMiddleware, getProfile);

// Leave routes  
router.post("/leaves", authMiddleware, createLeave);
router.get("/leaves/my", authMiddleware, getMyLeaves);
router.get("/leaves", authMiddleware, adminOnly, getAllLeaves);
router.patch("/leaves/:id/approve", authMiddleware, adminOnly, approveLeave);
router.patch("/leaves/:id/reject", authMiddleware, adminOnly, rejectLeave);

// Leave types & balance
router.get("/leave-types/active", authMiddleware, getActiveLeaveTypesHandler);
router.get("/leave-types", authMiddleware, adminOnly, getAllLeaveTypesHandler);
router.post("/leave-types", authMiddleware, adminOnly, createLeaveTypeHandler);
router.patch("/leave-types/:id", authMiddleware, adminOnly, updateLeaveTypeHandler);
router.delete("/leave-types/:id", authMiddleware, adminOnly, deleteLeaveTypeHandler);
router.get("/leave-balance", authMiddleware, getMyLeaveBalance);

// User management (admin only)
router.get("/users", authMiddleware, adminOnly, getAllEmployees);
router.get("/users/:id", authMiddleware, adminOnly, getEmployeeDetail);
router.post("/users", authMiddleware, adminOnly, createEmployee);
router.patch("/users/:id", authMiddleware, adminOnly, updateEmployee);
router.delete("/users/:id", authMiddleware, adminOnly, removeEmployee);
router.patch("/users/:id/leave-balances", authMiddleware, adminOnly, updateEmployeeLeaveBalances);

export default router;
