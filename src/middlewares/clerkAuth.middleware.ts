import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";

export const checkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const auth = getAuth(req);

  if (!auth || !auth.userId) {
    res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
    return; // return explicitly, avoid any further execution
  }

  next(); // move on to next middleware/controller
};
