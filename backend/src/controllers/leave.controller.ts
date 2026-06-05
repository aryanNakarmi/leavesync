import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createLeaveRequest, getLeaveRequestsByUser, updateLeaveRequest, getOverlappingLeaves, getLeaveRequestById, getAllLeaveRequests } from "../repositories/leave.repo";
import { getDB } from "../config/database";

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
    const requests = await getAllLeaveRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
}
