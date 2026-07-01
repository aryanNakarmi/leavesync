import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createLeaveRequest, getLeaveRequestsByUser, updateLeaveRequest, getOverlappingLeaves, getLeaveRequestById, getAllLeaveRequests } from "../repositories/leave.repo";
import { getActiveLeaveTypes } from "../repositories/leaveType.repo";
import { getLeaveBalance } from "../repositories/leaveBalance.repo";
import { getAllUsers } from "../repositories/user.repo";

export async function createLeave(req: AuthRequest, res: Response) {
  const { leaveTypeId, startDate, endDate, reason } = req.body;
  const userId = req.user?.id;
 
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for overlapping leaves
    const overlap = await getOverlappingLeaves(userId!, start, end);
    if (overlap) {
      return res.status(422).json({ error: "You have overlapping approved leave" });
    }

    // Calculate days
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const balances = await getLeaveBalance(userId!, currentYear);
    const typeBalance = balances.find((b: any) => b.leaveTypeId === leaveTypeId);

    if (typeBalance) {
      const remaining = (typeBalance.allocated + typeBalance.carriedOver) - typeBalance.used;
      if (totalDays > remaining) {
        return res.status(422).json({
          error: `Insufficient balance. You have ${remaining} day${remaining === 1 ? "" : "s"} remaining for this leave type.`
        });
      }
    } else {
      // No balance record found - check if this leave type exists and has quota
      const leaveTypes = await getActiveLeaveTypes();
      const leaveType = leaveTypes.find((t: any) => t._id.toString() === leaveTypeId || t._id === leaveTypeId);
      if (leaveType && leaveType.annualQuota > 0) {
        return res.status(422).json({
          error: `No balance record found for this leave type. Please contact an administrator.`
        });
      }
    }

    const requestId = await createLeaveRequest({
      userId: userId!,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "PENDING"
    });

    res.status(201).json({ _id: requestId, status: "PENDING" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create leave request" });
  }
}

export async function getMyLeaves(req: AuthRequest, res: Response) {
  try {
    const requests = await getLeaveRequestsByUser(req.user?.id || "");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
}

export async function approveLeave(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { adminComment } = req.body;

  try {
    await updateLeaveRequest(id, {
      status: "APPROVED",
      adminComment
    });

    res.json({ status: "APPROVED" });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve leave" });
  }
}

export async function rejectLeave(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { adminComment } = req.body;

  try {
    await updateLeaveRequest(id, {
      status: "REJECTED",
      adminComment
    });

    res.json({ status: "REJECTED" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject leave" });
  }
}

export async function getAllLeaves(req: AuthRequest, res: Response) {
  try {
    const [requests, users, leaveTypes] = await Promise.all([
      getAllLeaveRequests(),
      getAllUsers(),
      getActiveLeaveTypes()
    ]);

    const userMap = new Map(users.map((u: any) => [u._id.toString(), { name: u.name, email: u.email }]));
    const typeMap = new Map(leaveTypes.map((t: any) => [t._id.toString(), t.name]));

    const enriched = requests.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      user: userMap.get(r.userId) || { name: "Unknown", email: "" },
      leaveTypeName: typeMap.get(r.leaveTypeId) || "Unknown"
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}

export async function getAllLeaveTypes(req: AuthRequest, res: Response) {
  try {
    const types = await getActiveLeaveTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
}

export async function getMyLeaveBalance(req: AuthRequest, res: Response) {
  try {
    const currentYear = new Date().getFullYear();
    const balance = await getLeaveBalance(req.user?.id || "", currentYear);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave balance" });
  }
}
