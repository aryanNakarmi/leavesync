import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ObjectId } from "mongodb";
import {
  getHolidaysByYear,
  getHolidaysBetween,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getHolidayByDate
} from "../repositories/holiday.repo";

export async function getHolidaysHandler(req: AuthRequest, res: Response) {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  try {
    const holidays = await getHolidaysByYear(year);
    const safe = holidays.map((h: any) => ({
      _id: h._id.toString(),
      name: h.name,
      date: h.date,
      description: h.description || "",
      isRecurringYearly: h.isRecurringYearly || false,
      createdAt: h.createdAt
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
}

export async function getMonthHolidaysHandler(req: AuthRequest, res: Response) {
  const { year, month } = req.params;
  const y = parseInt(year);
  const m = parseInt(month);

  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return res.status(400).json({ error: "Invalid year or month" });
  }

  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const endDate = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

  try {
    const holidays = await getHolidaysBetween(startDate, endDate);
    const safe = holidays.map((h: any) => ({
      _id: h._id.toString(),
      name: h.name,
      date: h.date,
      description: h.description || "",
      isRecurringYearly: h.isRecurringYearly || false
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
}

export async function createHolidayHandler(req: AuthRequest, res: Response) {
  const { name, date, description, isRecurringYearly } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Holiday name is required" });
  }

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
  }

  try {
    // Check for duplicate holiday on same date
    const existing = await getHolidayByDate(date);
    if (existing) {
      return res.status(409).json({ error: `A holiday already exists on this date: "${existing.name}"` });
    }

    const id = await createHoliday({
      name: name.trim(),
      date,
      description: description?.trim() || "",
      isRecurringYearly: isRecurringYearly ?? false
    });

    res.status(201).json({
      _id: id.toString(),
      name: name.trim(),
      date,
      description: description?.trim() || "",
      isRecurringYearly: isRecurringYearly ?? false
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create holiday" });
  }
}

export async function updateHolidayHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, date, description, isRecurringYearly } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid holiday ID" });
  }

  try {
    const existing = await getHolidayById(id);
    if (!existing) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
      }
      updates.date = date;
    }
    if (description !== undefined) updates.description = description?.trim() || "";
    if (isRecurringYearly !== undefined) updates.isRecurringYearly = isRecurringYearly;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await updateHoliday(id, updates);
    const updated = await getHolidayById(id);

    res.json({
      _id: updated?._id.toString(),
      name: updated?.name,
      date: updated?.date,
      description: updated?.description || "",
      isRecurringYearly: updated?.isRecurringYearly || false
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update holiday" });
  }
}

export async function deleteHolidayHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid holiday ID" });
  }

  try {
    const existing = await getHolidayById(id);
    if (!existing) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    await deleteHoliday(id);
    res.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete holiday" });
  }
}
