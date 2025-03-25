"use strict";
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
const BASE_PATH = app_config_1.config.BASE_PATH;
const logger = (0, log4js_1.getLogger)("server");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
//const server = new http.Server(app);
app.use((0, helmet_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json({ limit: "5mb" })); // Set the maximum payload size to 5 MB
app.use(express_1.default.urlencoded({ limit: "5mb", extended: true }));
app.use((0, cookie_session_1.default)({
    name: "session",
    keys: [app_config_1.config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
}));
// const allowedOrigins = process.env.FRONTEND_ORIGIN
//   ? process.env.FRONTEND_ORIGIN.split(",")
//   : [];
app.use((0, cors_1.default)());
// MIDDLEWARES
app.use((0, express_2.clerkMiddleware)());
app.use(express_1.default.json());
app.use(logMiddleware_1.default);
// app.use(cors());
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Ensure 'origin' is defined and check if it's in the allowedOrigins list
//       if (
//         (typeof origin === "string" && allowedOrigins.includes(origin)) ||
//         !origin
//       ) {
//         callback(null, true); // Allow the request
//       } else {
//         callback(new Error("Not allowed by CORS")); // Reject the request
//       }
//     },
//     credentials: true, // Enable credentials (cookies, headers, etc.)
//   })
// );
// ROUTES
app.post("/webhooks/clerk", clerk_webhook_1.clerkWebhooks);
app.use(`${BASE_PATH}/coin`, coin_route_1.default);
app.use(`${BASE_PATH}/user`, user_route_1.default);
app.use(`${BASE_PATH}/vote`, vote_route_1.default);
app.use(`${BASE_PATH}/favorites`, favorites_route_1.default);
app.use(`${BASE_PATH}/admin`, admin_route_1.default);
// FOR ERRORS
app.use(errorHandler_middleware_1.errorHandler);
// CRONS
// nodeCron.schedule("*/1 * * * *", async () => {
//   console.log("Running both vote counters every 1 minute...");
//   await updateTotalVotesCount();
//   await updateTodayVotesCount();
// });
app.listen(app_config_1.config.PORT, async () => {
    logger.info(`🚀 Server running on port ${app_config_1.config.PORT} in ${app_config_1.config.NODE_ENV}`);
    await (0, database_config_1.default)();
    // Start cron jobs after the database connection is established
    (0, cronJobs_1.startCronJobs)(); // Initialize Redis connection
});
