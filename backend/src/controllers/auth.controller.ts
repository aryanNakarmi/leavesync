import { Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { getUserByEmail, getUserById, verifyPassword, createUser } from "../repositories/user.repo";

export async function register(req: AuthRequest, res: Response) {
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
      name,
      email,
      password,
      role: "EMPLOYEE",
      isActive: true
    });

    const token = jwt.sign(
      { id: userId, email, role: "EMPLOYEE" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        role: "EMPLOYEE"
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;
 
  try {
    const user = await getUserByEmail(email);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = await getUserById(req.user?.id || "");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...safe } = user;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}
