"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminAuth = void 0;
const express_1 = require("@clerk/express");
const http_config_1 = require("../config/http.config");
const checkAdminAuth = (req, res, next) => {
    const auth = (0, express_1.getAuth)(req);
    if (!auth || !auth.userId) {
        res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
    }
    const role = auth.sessionClaims?.role;
    const isAdmin = role === "admin";
    if (!isAdmin) {
        res.status(http_config_1.HTTPSTATUS.FORBIDDEN).json({ message: "Admin access required" });
        return;
    }
    next();
};
exports.checkAdminAuth = checkAdminAuth;
