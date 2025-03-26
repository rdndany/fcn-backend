"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractClientIP = extractClientIP;
function extractClientIP(req) {
    var _a;
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress);
    return ((_a = rawIp.split(",").pop()) === null || _a === void 0 ? void 0 : _a.trim()) || "";
}
