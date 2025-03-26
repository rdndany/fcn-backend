"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminAuth = void 0;
const express_1 = require("@clerk/express");
const http_config_1 = require("../config/http.config");
const checkAdminAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get authentication state
        const auth = (0, express_1.getAuth)(req);
        if (!(auth === null || auth === void 0 ? void 0 : auth.userId)) {
            res.status(http_config_1.HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }
        // Get user from Clerk
        const user = yield express_1.clerkClient.users.getUser(auth.userId);
        // Check admin status from publicMetadata (not privateMetadata)
        const role = (_a = user.publicMetadata) === null || _a === void 0 ? void 0 : _a.role;
        const isAdmin = role === "admin";
        if (!isAdmin) {
            res
                .status(http_config_1.HTTPSTATUS.FORBIDDEN)
                .json({ message: "Admin access required" });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Admin check error:", error);
        res
            .status(http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
});
exports.checkAdminAuth = checkAdminAuth;
