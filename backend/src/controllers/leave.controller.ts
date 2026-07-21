import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createLeaveRequest, getLeaveRequestsByUser, updateLeaveRequest, getOverlappingLeaves, getLeaveRequestById, getAllLeaveRequests } from "../repositories/leave.repo";
import { getActiveLeaveTypes } from "../repositories/leaveType.repo";
import { getLeaveBalance, upsertLeaveBalance } from "../repositories/leaveBalance.repo";
import { getAllUsers, getAllAdmins, getUserById } from "../repositories/user.repo";
import { createNotification } from "../repositories/notification.repo";

// Simple date formatter for notification messages (avoids needing date-fns in backend)
function fmtShort(d: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
function fmtFull(d: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

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

    // Check leave balance — dynamically calculate used from approved leaves
    const currentYear = new Date().getFullYear();
    const allUserLeaves = await getLeaveRequestsByUser(userId!);
    const approvedLeaves = allUserLeaves.filter((l: any) =>
      l.status === "APPROVED" &&
      l.leaveTypeId === leaveTypeId &&
      new Date(l.startDate).getFullYear() === currentYear
    );
    const actualUsed = approvedLeaves.reduce((sum: number, l: any) => sum + (l.totalDays || 0), 0);

    const balances = await getLeaveBalance(userId!, currentYear);
    const typeBalance = balances.find((b: any) => b.leaveTypeId === leaveTypeId);

    if (typeBalance) {
      const remaining = (typeBalance.allocated + typeBalance.carriedOver) - actualUsed;
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

    // Notify all admins about the new leave request
    try {
      const user = await getUserById(userId!);
      const userName = (user as any)?.name || "An employee";
      const leaveTypes = await getActiveLeaveTypes();
      const leaveType = leaveTypes.find((t: any) => t._id.toString() === leaveTypeId || t._id === leaveTypeId);
      const typeName = (leaveType as any)?.name || "Leave";

      const admins = await getAllAdmins();
      for (const admin of admins) {
        await createNotification({
          userId: admin._id.toString(),
          type: "LEAVE_SUBMITTED",
          title: "New Leave Request",
          message: `${userName} submitted a ${typeName} request for ${totalDays} day${totalDays > 1 ? "s" : ""}.`,
          link: "/admin/leave-requests",
          relatedId: requestId.toString(),
          isRead: false
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    res.status(201).json({ _id: requestId, status: "PENDING" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create leave request" });
  }
}

export async function getMyLeaves(req: AuthRequest, res: Response) {
  try {
    const requests = await getLeaveRequestsByUser(req.user?.id || "");
    const leaveTypes = await getActiveLeaveTypes();
    const typeMap = new Map(leaveTypes.map((t: any) => [t._id.toString(), t.name]));
    const enriched = requests.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      leaveTypeName: typeMap.get(r.leaveTypeId) || "Unknown"
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
}

export async function approveLeave(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { adminComment } = req.body;

  try {
    // Fetch the leave request to get leaveTypeId and totalDays
    const leaveRequest = await getLeaveRequestById(id);
    if (!leaveRequest) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    // Mark leave as APPROVED first
    await updateLeaveRequest(id, {
      status: "APPROVED",
      adminComment
    });

    // Then update the stored balance (redundant with dynamic calc but useful as fallback)
    const currentYear = new Date().getFullYear();
    const userId = leaveRequest.userId;
    const leaveTypeId = leaveRequest.leaveTypeId;
    const totalDays = leaveRequest.totalDays;

    try {
      // Recalculate total used from actual approved leaves to stay accurate
      const allUserLeaves = await getLeaveRequestsByUser(userId);
      const approvedThisYear = allUserLeaves.filter((l: any) =>
        l.status === "APPROVED" &&
        l.leaveTypeId === leaveTypeId &&
        new Date(l.startDate).getFullYear() === currentYear
      );
      const actualUsed = approvedThisYear.reduce((sum: number, l: any) => sum + (l.totalDays || 0), 0);

      const balances = await getLeaveBalance(userId, currentYear);
      const typeBalance = balances.find((b: any) => b.leaveTypeId === leaveTypeId);

      if (typeBalance) {
        await upsertLeaveBalance({
          userId,
          leaveTypeId,
          year: currentYear,
          allocated: typeBalance.allocated,
          used: actualUsed,
          carriedOver: typeBalance.carriedOver || 0
        });
      }
    } catch (balanceError) {
      console.error("Failed to update leave balance:", balanceError);
      // Continue — the dynamic calculation in getMyLeaveBalance will correct it
    }

    // Notify the employee
    try {
      const leaveTypeId = leaveRequest.leaveTypeId;
      const leaveTypes = await getActiveLeaveTypes();
      const leaveType = leaveTypes.find((t: any) => t._id.toString() === leaveTypeId || t._id === leaveTypeId);
      const typeName = (leaveType as any)?.name || "Leave";
      const startStr = fmtShort(new Date(leaveRequest.startDate));
      const endStr = fmtFull(new Date(leaveRequest.endDate));
      const commentSuffix = adminComment ? ` — "${adminComment}"` : "";

      await createNotification({
        userId: leaveRequest.userId,
        type: "LEAVE_APPROVED",
        title: "Leave Approved",
        message: `Your ${typeName} request (${startStr} → ${endStr}) was approved.${commentSuffix}`,
        link: "/employee/status",
        relatedId: id,
        isRead: false
      });
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

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

    // Notify the employee
    try {
      const leaveRequest = await getLeaveRequestById(id);
      if (leaveRequest) {
        const leaveTypes = await getActiveLeaveTypes();
        const leaveType = leaveTypes.find((t: any) => t._id.toString() === leaveRequest.leaveTypeId || t._id === leaveRequest.leaveTypeId);
        const typeName = (leaveType as any)?.name || "Leave";
        const startStr = fmtShort(new Date(leaveRequest.startDate));
        const endStr = fmtFull(new Date(leaveRequest.endDate));
        const commentSuffix = adminComment ? ` — "${adminComment}"` : "";

        await createNotification({
          userId: leaveRequest.userId,
          type: "LEAVE_REJECTED",
          title: "Leave Rejected",
          message: `Your ${typeName} request (${startStr} → ${endStr}) was rejected.${commentSuffix}`,
          link: "/employee/status",
          relatedId: id,
          isRead: false
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    res.json({ status: "REJECTED" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject leave" });
  }
}

export async function cancelLeave(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const leaveRequest = await getLeaveRequestById(id);
    if (!leaveRequest) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    // Only the owner of the leave can cancel
    if (leaveRequest.userId !== userId) {
      return res.status(403).json({ error: "You can only cancel your own leave requests" });
    }

    // Only PENDING leaves can be cancelled
    if (leaveRequest.status !== "PENDING") {
      return res.status(422).json({ error: "Only pending leave requests can be cancelled" });
    }

    await updateLeaveRequest(id, {
      status: "REJECTED",
      adminComment: "Cancelled by employee"
    });

    // Notify all admins
    try {
      const user = await getUserById(userId!);
      const userName = (user as any)?.name || "An employee";
      const leaveTypes = await getActiveLeaveTypes();
      const leaveType = leaveTypes.find((t: any) => t._id.toString() === leaveRequest.leaveTypeId || t._id === leaveRequest.leaveTypeId);
      const typeName = (leaveType as any)?.name || "Leave";

      const admins = await getAllAdmins();
      for (const admin of admins) {
        await createNotification({
          userId: admin._id.toString(),
          type: "LEAVE_CANCELLED",
          title: "Leave Cancelled",
          message: `${userName} cancelled their ${typeName} request.`,
          link: "/admin/leave-requests",
          relatedId: id,
          isRead: false
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    res.json({ status: "REJECTED" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel leave request" });
  }
}

export async function getAllLeaves(req: AuthRequest, res: Response) {
  try {
    const [requests, users, leaveTypes] = await Promise.all([
      getAllLeaveRequests(),
      getAllUsers(),
      getActiveLeaveTypes()
    ]);

    const userMap = new Map(users.map((u: any) => [u._id.toString(), { name: u.name, email: u.email, profilePicture: u.profilePicture || "" }]));
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
    const userId = req.user?.id || "";

    // Get stored balances
    const balances = await getLeaveBalance(userId, currentYear);

    // Calculate actual used days from approved leaves for the current year
    // Use startDate year (not createdAt year) so leaves count against the year they're taken in
    const allLeaves = await getLeaveRequestsByUser(userId);
    const approvedLeavesThisYear = allLeaves.filter((l: any) =>
      l.status === "APPROVED" &&
      new Date(l.startDate).getFullYear() === currentYear
    );

    // Sum totalDays by leave type
    const usedByType = new Map<string, number>();
    for (const leave of approvedLeavesThisYear) {
      const key = leave.leaveTypeId;
      usedByType.set(key, (usedByType.get(key) || 0) + leave.totalDays);
    }

    // Override stored `used` with the dynamically calculated value
    const correctedBalances = balances.map((b: any) => ({
      ...b,
      _id: b._id.toString(),
      used: usedByType.get(b.leaveTypeId) || 0
    }));

    res.json(correctedBalances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave balance" });
  }
}
