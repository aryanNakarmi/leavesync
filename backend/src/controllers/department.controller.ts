import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ObjectId } from "mongodb";
import {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByName,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "../repositories/department.repo";

export async function listDepartments(req: AuthRequest, res: Response) {
  try {
    const departments = await getAllDepartments();
    const safe = departments.map((d: any) => ({
      _id: d._id.toString(),
      name: d.name,
      createdAt: d.createdAt
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
}

export async function createDepartmentHandler(req: AuthRequest, res: Response) {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Department name is required" });
  }

  try {
    const existing = await getDepartmentByName(name.trim());
    if (existing) {
      return res.status(409).json({ error: "A department with this name already exists" });
    }

    const id = await createDepartment(name.trim());

    res.status(201).json({
      _id: id.toString(),
      name: name.trim(),
      createdAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create department" });
  }
}

export async function updateDepartmentHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid department ID" });
  }

  if (!name?.trim()) {
    return res.status(400).json({ error: "Department name is required" });
  }

  try {
    const existing = await getDepartmentById(id);
    if (!existing) {
      return res.status(404).json({ error: "Department not found" });
    }

    const duplicate = await getDepartmentByName(name.trim());
    if (duplicate && duplicate._id.toString() !== id) {
      return res.status(409).json({ error: "A department with this name already exists" });
    }

    await updateDepartment(id, name.trim());

    res.json({
      _id: id,
      name: name.trim()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update department" });
  }
}

export async function deleteDepartmentHandler(req: AuthRequest, res: Response) {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid department ID" });
  }

  try {
    const existing = await getDepartmentById(id);
    if (!existing) {
      return res.status(404).json({ error: "Department not found" });
    }

    await deleteDepartment(id);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete department" });
  }
}
