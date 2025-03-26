"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const get_env_1 = require("../utils/get-env");
const appConfig = () => ({
    NODE_ENV: (0, get_env_1.getEnv)("NODE_ENV", "development"),
    PORT: (0, get_env_1.getEnv)("PORT", "5000"),
    BASE_PATH: (0, get_env_1.getEnv)("BASE_PATH", "/api"),
    MONGO_URI: (0, get_env_1.getEnv)("MONGO_URI"),
    CLERK_WEBHOOK_SECRET: (0, get_env_1.getEnv)("CLERK_WEBHOOK_SECRET"),
    CLERK_PUBLISHABLE_KEY: (0, get_env_1.getEnv)("CLERK_PUBLISHABLE_KEY"),
    CLERK_SECRET_KEY: (0, get_env_1.getEnv)("CLERK_SECRET_KEY"),
    SESSION_SECRET: (0, get_env_1.getEnv)("SESSION_SECRET"),
    SESSION_EXPIRES_IN: (0, get_env_1.getEnv)("SESSION_EXPIRES_IN"),
    FRONTEND_ORIGIN: (0, get_env_1.getEnv)("FRONTEND_ORIGIN", "localhost"),
    CLOUDINARY_CLOUD_NAME: (0, get_env_1.getEnv)("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: (0, get_env_1.getEnv)("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: (0, get_env_1.getEnv)("CLOUDINARY_API_SECRET"),
    CLOUDINARY_URL: (0, get_env_1.getEnv)("CLOUDINARY_URL"),
    MORALIS_API_KEY: (0, get_env_1.getEnv)("MORALIS_API_KEY"),
    REDIS_HOST: (0, get_env_1.getEnv)("REDIS_HOST"),
    REDIS_PORT: (0, get_env_1.getEnv)("REDIS_PORT"),
    REDIS_PASSWORD: (0, get_env_1.getEnv)("REDIS_PASSWORD"),
    REDIS_DB: (0, get_env_1.getEnv)("REDIS_DB"),
    RESEND_API_KEY: (0, get_env_1.getEnv)("RESEND_API_KEY"),
});
exports.config = appConfig();
