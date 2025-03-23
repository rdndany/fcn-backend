"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = require("log4js");
const log4js_2 = __importDefault(require("log4js"));
// Configure log4js to log to the console
log4js_2.default.configure({
    appenders: {
        console: { type: "console" }, // Log to the console
    },
    categories: {
        default: { appenders: ["console"], level: "info" }, // Default logger with console output
        requests: { appenders: ["console"], level: "info" }, // Logger specifically for requests
    },
});
const logger = (0, log4js_1.getLogger)("requests");
function LogMiddleware(req, _res, next) {
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    const ip = rawIp.split(",")[rawIp.split(",").length - 1].trim();
    logger.info(`(${ip}) ${req.method} ${req.path}`);
    next();
}
exports.default = LogMiddleware;
