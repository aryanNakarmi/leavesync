import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getAllUsers, getUserByEmail, getUserById, createUser, updateUser, deactivateUser } from "../repositories/user.repo";
import { WithId, Document } from "mongodb";

export async function getAllEmployees(req: AuthRequest, res: Response) {
  try {
    const users = await getAllUsers();
    const safe = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
}

export async function createEmployee(req: AuthRequest, res: Response) {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await getUserByEmail(email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const userId = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "EMPLOYEE",
      isActive: true
    });

    res.status(201).json({
      _id: userId.toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "EMPLOYEE",
      isActive: true
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
}

export async function updateEmployee(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, email, password, isActive } = req.body;

  if (!name?.trim() && !email?.trim() && !password && isActive === undefined) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Check email uniqueness if changing email
    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await getUserByEmail(email.trim().toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
    }

    const updates: any = {};
    if (name?.trim()) updates.name = name.trim();
    if (email?.trim()) updates.email = email.trim().toLowerCase();
    if (password) updates.password = password;
    if (isActive !== undefined) updates.isActive = isActive;

    await updateUser(id, updates);

    const updated = await getUserById(id);
    const { password: _, ...safe } = updated as WithId<Document> & { password?: string };

    res.json({ ...safe, _id: safe._id.toString() });
  } catch (error) {
    res.status(500).json({ error: "Failed to update employee" });
  }
}

export async function removeEmployee(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    await deactivateUser(id);
    res.json({ message: "Employee deactivated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to deactivate employee" });
  }
}
