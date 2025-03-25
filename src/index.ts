import "dotenv/config";

// EXTERNAL MODULES
import express from "express";
import cors from "cors";
import session from "cookie-session";
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
import { setupResend } from "./config/resend.config";

const BASE_PATH = config.BASE_PATH;

const logger = getLogger("server");
const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "5mb" })); // Set the maximum payload size to 5 MB
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  })
);

// MIDDLEWARES
app.use(clerkMiddleware());
app.use(LogMiddleware);

// ROUTES
app.post("/webhooks/clerk", clerkWebhooks);
app.use(`${BASE_PATH}/coin`, coinRoutes);
app.use(`${BASE_PATH}/user`, userRoutes);
app.use(`${BASE_PATH}/vote`, voteRoutes);
app.use(`${BASE_PATH}/favorites`, favoritesRoutes);
app.use(`${BASE_PATH}/admin`, adminRoutes);

// FOR ERRORS
app.use(errorHandler);

app.listen(config.PORT, async () => {
  logger.info(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();

  // Initialize Resend email service
  if (!setupResend()) {
    logger.error("Failed to initialize Resend email service. Exiting...");
    process.exit(1);
  }

  // Start cron jobs after the database connection is established
  startCronJobs(); // Initialize Redis connection
});
