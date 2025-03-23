"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = void 0;
const express_1 = require("@clerk/express");
const http_config_1 = require("../config/http.config");
const checkAuth = (req, res, next) => {
    const auth = (0, express_1.getAuth)(req);
    if (!auth || !auth.userId) {
        res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
        return; // return explicitly, avoid any further execution
    }
    next(); // move on to next middleware/controller
};
exports.checkAuth = checkAuth;
