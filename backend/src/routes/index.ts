import { Router } from "express";
import { authMiddleware, adminOnly } from "../middleware/auth";
import { login, register, getProfile } from "../controllers/auth.controller";
import { createLeave, getMyLeaves, approveLeave, rejectLeave, getAllLeaves, getAllLeaveTypes, getMyLeaveBalance } from "../controllers/leave.controller";
import { getAllEmployees, createEmployee, updateEmployee, removeEmployee } from "../controllers/user.controller";

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
router.get("/leave-types", authMiddleware, getAllLeaveTypes);
router.get("/leave-balance", authMiddleware, getMyLeaveBalance);

// User management (admin only)
router.get("/users", authMiddleware, adminOnly, getAllEmployees);
router.post("/users", authMiddleware, adminOnly, createEmployee);
router.patch("/users/:id", authMiddleware, adminOnly, updateEmployee);
router.delete("/users/:id", authMiddleware, adminOnly, removeEmployee);

export default router;
