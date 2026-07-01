import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getAllUsers, getUserByEmail, getUserById, createUser, updateUser, deactivateUser, activateUser, getEmployeeWithDetails, setLeaveBalance } from "../repositories/user.repo";
import { WithId, Document, ObjectId } from "mongodb";

export async function getAllEmployees(req: AuthRequest, res: Response) {
  try {
    const users = await getAllUsers();
    const safe = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || "",
      address: u.address || "",
      profilePicture: u.profilePicture || "",
      department: u.department || "",
      jobTitle: u.jobTitle || "",
      isActive: u.isActive,
      createdAt: u.createdAt
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
}

export async function getEmployeeDetail(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const result = await getEmployeeWithDetails(id);

    if (!result.user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const u = result.user as any;

    const safeLeaveTypes = result.leaveTypes.map((t: any) => ({
      _id: t._id.toString(),
      name: t.name,
      annualQuota: t.annualQuota,
      isPaid: t.isPaid,
      accrualMethod: t.accrualMethod,
      maxCarryover: t.maxCarryover,
      status: t.status
    }));

    res.json({
      employee: {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || "",
        address: u.address || "",
        profilePicture: u.profilePicture || "",
        department: u.department || "",
        jobTitle: u.jobTitle || "",
        dateOfBirth: u.dateOfBirth || "",
        gender: u.gender || "",
        employmentType: u.employmentType || "Full-Time",
        joinDate: u.joinDate || "",
        isActive: u.isActive,
        createdAt: u.createdAt
      },
      leaveRequests: result.leaveRequests,
      leaveBalances: result.leaveBalances,
      leaveTypes: safeLeaveTypes
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee details" });
  }
}

export async function createEmployee(req: AuthRequest, res: Response) {
  const { name, email, password, phone, address, profilePicture, department, jobTitle } = req.body;

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
      phone: phone || "",
      address: address || "",
      profilePicture: profilePicture || "",
      department: department || "",
      jobTitle: jobTitle || "",
      isActive: true
    });

    // Create initial leave balances if provided
    const { leaveBalances } = req.body;
    if (leaveBalances && Array.isArray(leaveBalances)) {
      const currentYear = new Date().getFullYear();
      for (const lb of leaveBalances) {
        if (lb.leaveTypeId && lb.allocated > 0) {
          await setLeaveBalance(
            userId.toString(),
            lb.leaveTypeId,
            currentYear,
            lb.allocated
          );
        }
      }
    }

    res.status(201).json({
      _id: userId.toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "EMPLOYEE",
      phone: phone || "",
      address: address || "",
      profilePicture: profilePicture || "",
      department: department || "",
      jobTitle: jobTitle || "",
      isActive: true
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
}

export async function updateEmployee(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, phone, address, profilePicture, department, jobTitle, dateOfBirth, gender, employmentType, joinDate, password, isActive } = req.body;

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Email is NOT allowed to be changed from this endpoint
    if ("email" in req.body && req.body.email !== user.email) {
      return res.status(400).json({ error: "Email address cannot be changed. Contact support for email changes." });
    }

    const updates: any = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (department !== undefined) updates.department = department;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updates.gender = gender;
    if (employmentType !== undefined) updates.employmentType = employmentType;
    if (joinDate !== undefined) updates.joinDate = joinDate;
    if (password) updates.password = password;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

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

    // Toggle active status
    if (user.isActive) {
      await deactivateUser(id);
      res.json({ message: "Employee deactivated successfully", isActive: false });
    } else {
      await activateUser(id);
      res.json({ message: "Employee activated successfully", isActive: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update employee status" });
  }
}

export async function updateEmployeeLeaveBalances(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { leaveBalances } = req.body;

  if (!leaveBalances || !Array.isArray(leaveBalances)) {
    return res.status(400).json({ error: "leaveBalances array is required" });
  }

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const currentYear = new Date().getFullYear();
    for (const lb of leaveBalances) {
      if (lb.leaveTypeId && lb.allocated !== undefined) {
        await setLeaveBalance(id, lb.leaveTypeId, currentYear, lb.allocated);
      }
    }

    res.json({ message: "Leave balances updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update leave balances" });
  }
}
