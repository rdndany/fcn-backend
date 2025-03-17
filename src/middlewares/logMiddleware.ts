import { Request, Response, NextFunction } from "express";
import { getLogger } from "log4js";
import log4js from "log4js";

// Configure log4js to log to the console
log4js.configure({
  appenders: {
    console: { type: "console" }, // Log to the console
  },
  categories: {
    default: { appenders: ["console"], level: "info" }, // Default logger with console output
    requests: { appenders: ["console"], level: "info" }, // Logger specifically for requests
  },
});

const logger = getLogger("requests");

function LogMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const rawIp = String(
    req.headers["x-forwarded-for"] || req.socket.remoteAddress
  );
  const ip = rawIp.split(",")[rawIp.split(",").length - 1].trim();
  logger.info(`(${ip}) ${req.method} ${req.path}`);
  next();
}

export default LogMiddleware;
