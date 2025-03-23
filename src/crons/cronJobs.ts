import cron from "node-cron";

import { getLogger } from "log4js";
import {
  deleteAllFavorites,
  resetAllVotes,
  resetPriceMkapLiq,
  resetTodayVotes,
  updateEVMCoinPricesInBatches,
  updateSOLCoinPricesInBatches,
} from "./jobs";

const logger = getLogger("cron-jobs");
// Schedule the cron job to run every minute (for demonstration, you can adjust this as needed)
export const startCronJobs = () => {
  // Cron job to run updateSOLCoinPricesInBatches every minute (you can adjust the timing as needed)
  cron.schedule("0 0 * * *", async () => {
    try {
      await updateSOLCoinPricesInBatches();
      logger.info("SOL prices update started at: ", new Date().toISOString());
    } catch (error) {
      logger.error("Error occurred while updating coin prices:", error);
    }
  });

  // Cron job to run updateEVMCoinPricesInBatches every minute (you can adjust the timing as needed)
  cron.schedule("0 0 * * *", async () => {
    try {
      await updateEVMCoinPricesInBatches();
      logger.info("EVM prices update started at: ", new Date().toISOString());
    } catch (error) {
      logger.error("Error occurred while updating coin prices:", error);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      await resetAllVotes();
      logger.info("Today votes reseted: ", new Date().toISOString());
    } catch (error) {
      logger.error("Error occurred while reseting the today votes:", error);
    }
  });

  // cron.schedule("* * * * *", async () => {
  //   try {
  //     await resetPriceMkapLiq();
  //     logger.info("Today votes reseted: ", new Date().toISOString());
  //   } catch (error) {
  //     logger.error("Error occurred while reseting the today votes:", error);
  //   }
  // });
};
