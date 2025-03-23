"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_config_1 = require("./app.config");
const log4js_1 = require("log4js");
const moralis_1 = __importDefault(require("moralis"));
const connectDatabase = async () => {
    const logger = (0, log4js_1.getLogger)("database");
    const loggerMoralis = (0, log4js_1.getLogger)("moralis");
    try {
        await mongoose_1.default.connect(app_config_1.config.MONGO_URI);
        logger.info("✅ Database connected!");
        await moralis_1.default.start({
            apiKey: process.env.MORALIS_API_KEY,
        });
        loggerMoralis.info("🧡 Moralis connected!");
    }
    catch (error) {
        logger.error("❌ Error connecting to DB");
        process.exit(1);
    }
};
exports.default = connectDatabase;
