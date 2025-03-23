import "dotenv/config";

// EXTERNAL MODULES
import express from "express";
import cors from "cors";
import session from "cookie-session";
import http from "http";
import { getLogger } from "log4js";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";

// INTERNAL MODULES
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { clerkWebhooks } from "./webhooks/clerk.webhook";
import coinRoutes from "./routes/coin.route";
import voteRoutes from "./routes/vote.route";
import LogMiddleware from "./middlewares/logMiddleware";
import { startCronJobs } from "./crons/cronJobs";
import favoritesRoutes from "./routes/favorites.route";
import userRoutes from "./routes/user.route";
import adminRoutes from "./routes/admin.route";

const BASE_PATH = config.BASE_PATH;

const logger = getLogger("server");
const app = express();
//app.set("trust proxy", 1);
//const server = new http.Server(app);

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "5mb" })); // Set the maximum payload size to 5 MB
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// app.use(
//   session({
//     name: "session",
//     keys: [config.SESSION_SECRET],
//     maxAge: 24 * 60 * 60 * 1000,
//     secure: config.NODE_ENV === "production",
//     httpOnly: true,
//     sameSite: "lax",
//   })
// );

// const allowedOrigins = process.env.FRONTEND_ORIGIN
//   ? process.env.FRONTEND_ORIGIN.split(",")
//   : [];

app.use(cors());

// MIDDLEWARES
app.use(clerkMiddleware());
app.use(express.json());
app.use(LogMiddleware);
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
app.post("/webhooks/clerk", clerkWebhooks);
app.use(`${BASE_PATH}/coin`, coinRoutes);
app.use(`${BASE_PATH}/user`, userRoutes);
app.use(`${BASE_PATH}/vote`, voteRoutes);
app.use(`${BASE_PATH}/favorites`, favoritesRoutes);
app.use(`${BASE_PATH}/admin`, adminRoutes);

// FOR ERRORS
app.use(errorHandler);

// CRONS
// nodeCron.schedule("*/1 * * * *", async () => {
//   console.log("Running both vote counters every 1 minute...");
//   await updateTotalVotesCount();
//   await updateTodayVotesCount();
// });

app.listen(config.PORT, async () => {
  logger.info(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
  // Start cron jobs after the database connection is established
  startCronJobs(); // Initialize Redis connection
});
