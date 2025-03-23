"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const favorites_controller_1 = require("../controllers/favorites.controller");
const clerkAuth_middleware_1 = require("../middlewares/clerkAuth.middleware");
const favoritesRoutes = (0, express_1.Router)();
favoritesRoutes.get("/:coinId", clerkAuth_middleware_1.checkAuth, favorites_controller_1.favoriteCoinController);
favoritesRoutes.get("/", clerkAuth_middleware_1.checkAuth, favorites_controller_1.getUserFavorites);
exports.default = favoritesRoutes;
