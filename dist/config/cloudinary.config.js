"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const app_config_1 = require("./app.config");
// Configure Cloudinary with your credentials
cloudinary_1.v2.config({
    cloud_name: app_config_1.config.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
    api_key: app_config_1.config.CLOUDINARY_API_KEY, // Your Cloudinary API key
    api_secret: app_config_1.config.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});
exports.default = cloudinary_1.v2;
