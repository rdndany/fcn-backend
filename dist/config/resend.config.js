"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResendConfig = exports.setupResend = void 0;
const log4js_1 = require("log4js");
const email_service_1 = require("../services/email.service");
const app_config_1 = require("./app.config");
const logger = (0, log4js_1.getLogger)("resend-email");
/**
 * Initializes the Resend email service with the API key from environment variables
 * @returns {boolean} True if initialization was successful, false otherwise
 */
const setupResend = () => {
    try {
        const resendApiKey = app_config_1.config.RESEND_API_KEY;
        if (!resendApiKey) {
            logger.error("RESEND_API_KEY is not defined in environment variables");
            return false;
        }
        // Initialize Resend
        (0, email_service_1.initializeResend)(resendApiKey);
        logger.log("✅ Resend email service initialized successfully");
        return true;
    }
    catch (error) {
        logger.error("❌ Failed to initialize Resend email service:", error);
        return false;
    }
};
exports.setupResend = setupResend;
/**
 * Validates that the Resend configuration is valid
 * @returns {boolean} True if configuration is valid, false otherwise
 */
const validateResendConfig = () => {
    const resendApiKey = app_config_1.config.RESEND_API_KEY;
    return !!resendApiKey;
};
exports.validateResendConfig = validateResendConfig;
