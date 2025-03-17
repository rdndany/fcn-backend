import mongoose from "mongoose";
import { config } from "./app.config";
import { getLogger } from "log4js";
import Moralis from "moralis";

const connectDatabase = async () => {
  const logger = getLogger("database");
  const loggerMoralis = getLogger("moralis");
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info("✅ Database connected!");
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    loggerMoralis.info("🧡 Moralis connected!");
  } catch (error) {
    logger.error("❌ Error connecting to DB");
    process.exit(1);
  }
};

export default connectDatabase;
