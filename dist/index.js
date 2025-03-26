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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
// EXTERNAL MODULES
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const log4js_1 = require("log4js");
const helmet_1 = __importDefault(require("helmet"));
const express_2 = require("@clerk/express");
// INTERNAL MODULES
const app_config_1 = require("./config/app.config");
const database_config_1 = __importDefault(require("./config/database.config"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const clerk_webhook_1 = require("./webhooks/clerk.webhook");
const coin_route_1 = __importDefault(require("./routes/coin.route"));
const vote_route_1 = __importDefault(require("./routes/vote.route"));
const logMiddleware_1 = __importDefault(require("./middlewares/logMiddleware"));
const cronJobs_1 = require("./crons/cronJobs");
const favorites_route_1 = __importDefault(require("./routes/favorites.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
const resend_config_1 = require("./config/resend.config");
const coinView_route_1 = __importDefault(require("./routes/coinView.route"));
const BASE_PATH = app_config_1.config.BASE_PATH;
const logger = (0, log4js_1.getLogger)("server");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json({ limit: "5mb" })); // Set the maximum payload size to 5 MB
app.use(express_1.default.urlencoded({ limit: "5mb", extended: true }));
app.use((0, cookie_session_1.default)({
    name: "session",
    keys: [app_config_1.config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: app_config_1.config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
}));
// MIDDLEWARES
app.use((0, express_2.clerkMiddleware)());
app.use(logMiddleware_1.default);
// ROUTES
app.post("/api/webhooks", clerk_webhook_1.clerkWebhooks);
app.use(`${BASE_PATH}/coin`, coin_route_1.default);
app.use(`${BASE_PATH}/user`, user_route_1.default);
app.use(`${BASE_PATH}/vote`, vote_route_1.default);
app.use(`${BASE_PATH}/favorites`, favorites_route_1.default);
app.use(`${BASE_PATH}/admin`, admin_route_1.default);
app.use(`${BASE_PATH}/coin-view`, coinView_route_1.default);
// FOR ERRORS
app.use(errorHandler_middleware_1.errorHandler);
app.listen(app_config_1.config.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    logger.info(`🚀 Server running on port ${app_config_1.config.PORT} in ${app_config_1.config.NODE_ENV}`);
    yield (0, database_config_1.default)();
    // Initialize Resend email service
    if (!(0, resend_config_1.setupResend)()) {
        logger.error("Failed to initialize Resend email service. Exiting...");
        process.exit(1);
    }
    // Start cron jobs after the database connection is established
    (0, cronJobs_1.startCronJobs)(); // Initialize Redis connection
}));
