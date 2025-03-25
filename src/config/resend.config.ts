import { getLogger } from "log4js";
import { initializeResend } from "../services/email.service";
import { config } from "./app.config";

const logger = getLogger("resend-email");
/**
 * Initializes the Resend email service with the API key from environment variables
 * @returns {boolean} True if initialization was successful, false otherwise
 */
export const setupResend = (): boolean => {
  try {
    const resendApiKey = config.RESEND_API_KEY;

    if (!resendApiKey) {
      logger.error("RESEND_API_KEY is not defined in environment variables");
      return false;
    }

    // Initialize Resend
    initializeResend(resendApiKey);
    logger.log("✅ Resend email service initialized successfully");
    return true;
  } catch (error) {
    logger.error("❌ Failed to initialize Resend email service:", error);
    return false;
  }
};

/**
 * Validates that the Resend configuration is valid
 * @returns {boolean} True if configuration is valid, false otherwise
 */
export const validateResendConfig = (): boolean => {
  const resendApiKey = config.RESEND_API_KEY;
  return !!resendApiKey;
};
