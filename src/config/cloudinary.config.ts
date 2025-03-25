import { v2 as cloudinary } from "cloudinary";
import { config } from "./app.config";

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: config.CLOUDINARY_API_KEY, // Your Cloudinary API key
  api_secret: config.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});

export default cloudinary;
