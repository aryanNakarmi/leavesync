import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from "../repositories/notification.repo";

export async function getMyNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || "";
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await getNotificationsByUser(userId, limit);
    const safe = notifications.map((n: any) => ({
      _id: n._id.toString(),
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      relatedId: n.relatedId,
      isRead: n.isRead,
      createdAt: n.createdAt
    }));
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

export async function getMyUnreadCount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || "";
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || "";
    const { id } = req.params;
    await markAsRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id || "";
    await markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
}
