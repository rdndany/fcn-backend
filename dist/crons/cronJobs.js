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
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const log4js_1 = require("log4js");
const jobs_1 = require("./jobs");
const logger = (0, log4js_1.getLogger)("cron-jobs");
// Schedule the cron job to run every minute (for demonstration, you can adjust this as needed)
const startCronJobs = () => {
    // Cron job to run updateSOLCoinPricesInBatches every minute (you can adjust the timing as needed)
    node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, jobs_1.updateSOLCoinPricesInBatches)();
            logger.info("SOL prices update started at: ", new Date().toISOString());
        }
        catch (error) {
            logger.error("Error occurred while updating coin prices:", error);
        }
    }));
    // Cron job to run updateEVMCoinPricesInBatches every minute (you can adjust the timing as needed)
    node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, jobs_1.updateEVMCoinPricesInBatches)();
            logger.info("EVM prices update started at: ", new Date().toISOString());
        }
        catch (error) {
            logger.error("Error occurred while updating coin prices:", error);
        }
    }));
    node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield (0, jobs_1.resetTodayVotes)();
            logger.info("Today votes reseted: ", new Date().toISOString());
        }
        catch (error) {
            logger.error("Error occurred while reseting the today votes:", error);
        }
    }));
    // cron.schedule("* * * * *", async () => {
    //   try {
    //     await resetPriceMkapLiq();
    //     logger.info("Today votes reseted: ", new Date().toISOString());
    //   } catch (error) {
    //     logger.error("Error occurred while reseting the today votes:", error);
    //   }
    // });
};
exports.startCronJobs = startCronJobs;
