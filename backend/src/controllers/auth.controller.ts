import { Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { getUserByEmail, getUserById, verifyPassword, createUser } from "../repositories/user.repo";

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
