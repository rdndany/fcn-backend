import { Request } from "express";

export function extractClientIP(req: Request): string {
  const rawIp = String(
    req.headers["x-forwarded-for"] || req.socket.remoteAddress
  );
  return rawIp.split(",").pop()?.trim() || "";
}
