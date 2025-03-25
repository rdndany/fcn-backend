"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clerkAuth_middleware_1 = require("../middlewares/clerkAuth.middleware");
const user_controller_1 = require("../controllers/user.controller");
const userRoutes = (0, express_1.Router)();
userRoutes.get("/coins", clerkAuth_middleware_1.checkAuth, user_controller_1.getUserCoinsController);
exports.default = userRoutes;
