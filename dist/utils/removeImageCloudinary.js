"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicIdFromUrl = exports.removeImageFromCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const removeImageFromCloudinary = async (publicId) => {
    try {
        // Delete the image from Cloudinary using the publicId.
        const cloudinaryResponse = await cloudinary_1.v2.api.delete_resources([publicId], { type: "upload", resource_type: "image" });
        console.log("Cloudinary Response:", cloudinaryResponse);
    }
    catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw new Error("Failed to delete image from Cloudinary");
    }
};
exports.removeImageFromCloudinary = removeImageFromCloudinary;
// Helper function to extract the public_id from a Cloudinary URL
const getPublicIdFromUrl = (url) => {
    const matches = url.match(/\/([^/]+)\/image\/upload\/v\d+\/(.+)\.\w+/);
    return matches ? matches[2] : null;
};
exports.getPublicIdFromUrl = getPublicIdFromUrl;
