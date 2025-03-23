import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";

export const checkAdminAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const auth = getAuth(req);

  if (!auth || !auth.userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
    return;
  }

  const role = auth.sessionClaims?.role;
  const isAdmin = role === "admin";

  if (!isAdmin) {
    res.status(HTTPSTATUS.FORBIDDEN).json({ message: "Admin access required" });
    return;
  }

  next();
};
