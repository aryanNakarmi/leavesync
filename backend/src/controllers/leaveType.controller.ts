import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ObjectId } from "mongodb";
import {
  getActiveLeaveTypes,
  getAllLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
} from "../repositories/leaveType.repo";

export async function getAllLeaveTypesHandler(req: AuthRequest, res: Response) {
  try {
    const types = await getAllLeaveTypes();
    const safe = types.map((t: any) => ({
      _id: t._id.toString(),
      name: t.name,
      isPaid: t.isPaid,
      annualQuota: t.annualQuota,
      accrualMethod: t.accrualMethod,
      maxCarryover: t.maxCarryover,
      status: t.status,
      createdAt: t.createdAt
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
}

export async function getActiveLeaveTypesHandler(req: AuthRequest, res: Response) {
  try {
    const types = await getActiveLeaveTypes();
    const safe = types.map((t: any) => ({
      _id: t._id.toString(),
      name: t.name,
      isPaid: t.isPaid,
      annualQuota: t.annualQuota,
      accrualMethod: t.accrualMethod,
      maxCarryover: t.maxCarryover,
      status: t.status
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
}

export async function createLeaveTypeHandler(req: AuthRequest, res: Response) {
  const { name, isPaid, annualQuota, accrualMethod, maxCarryover, status } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Leave type name is required" });
  }

  try {
    const id = await createLeaveType({
      name: name.trim(),
      isPaid: isPaid ?? true,
      annualQuota: annualQuota ?? 0,
      accrualMethod: accrualMethod || "ANNUAL",
      maxCarryover: maxCarryover ?? 0,
      status: status || "ACTIVE"
    });

    const created = await getLeaveTypeById(id.toString());
    res.status(201).json({
      _id: id.toString(),
      name: created?.name,
      isPaid: created?.isPaid,
      annualQuota: created?.annualQuota,
      accrualMethod: created?.accrualMethod,
      maxCarryover: created?.maxCarryover,
      status: created?.status,
      createdAt: created?.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create leave type" });
  }
}

export async function updateLeaveTypeHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, isPaid, annualQuota, accrualMethod, maxCarryover, status } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid leave type ID" });
  }

  try {
    const existing = await getLeaveTypeById(id);
    if (!existing) {
      return res.status(404).json({ error: "Leave type not found" });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (isPaid !== undefined) updates.isPaid = isPaid;
    if (annualQuota !== undefined) updates.annualQuota = annualQuota;
    if (accrualMethod !== undefined) updates.accrualMethod = accrualMethod;
    if (maxCarryover !== undefined) updates.maxCarryover = maxCarryover;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await updateLeaveType(id, updates);

    const updated = await getLeaveTypeById(id);
    res.json({
      _id: updated?._id.toString(),
      name: updated?.name,
      isPaid: updated?.isPaid,
      annualQuota: updated?.annualQuota,
      accrualMethod: updated?.accrualMethod,
      maxCarryover: updated?.maxCarryover,
      status: updated?.status
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update leave type" });
  }
}

export async function deleteLeaveTypeHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid leave type ID" });
  }

  try {
    const existing = await getLeaveTypeById(id);
    if (!existing) {
      return res.status(404).json({ error: "Leave type not found" });
    }

    await deleteLeaveType(id);
    res.json({ message: "Leave type deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete leave type" });
  }
}
