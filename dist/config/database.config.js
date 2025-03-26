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
const mongoose_1 = __importDefault(require("mongoose"));
const app_config_1 = require("./app.config");
const log4js_1 = require("log4js");
const moralis_1 = __importDefault(require("moralis"));
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const logger = (0, log4js_1.getLogger)("database");
    const loggerMoralis = (0, log4js_1.getLogger)("moralis");
    try {
        yield mongoose_1.default.connect(app_config_1.config.MONGO_URI);
        logger.info("✅ Database connected!");
        yield moralis_1.default.start({
            apiKey: app_config_1.config.MORALIS_API_KEY,
        });
        loggerMoralis.info("🧡 Moralis connected!");
    }
    catch (error) {
        logger.error("❌ Error connecting to DB");
        process.exit(1);
    }
});
exports.default = connectDatabase;
