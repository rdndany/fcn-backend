import { clerkClient, getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";

export const checkAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get authentication state
    const auth = getAuth(req);

    if (!auth?.userId) {
      res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
      return;
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(auth.userId);

    // Check admin status from publicMetadata (not privateMetadata)
    const role = user.publicMetadata?.role;

    const isAdmin = role === "admin";

    if (!isAdmin) {
      res
        .status(HTTPSTATUS.FORBIDDEN)
        .json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res
      .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};
