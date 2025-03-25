"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractClientIP = extractClientIP;
function extractClientIP(req) {
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    return rawIp.split(",").pop()?.trim() || "";
}
