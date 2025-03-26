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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicIdFromUrl = exports.removeImageFromCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const removeImageFromCloudinary = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete the image from Cloudinary using the publicId.
        const cloudinaryResponse = yield cloudinary_1.v2.api.delete_resources([publicId], { type: "upload", resource_type: "image" });
        console.log("Cloudinary Response:", cloudinaryResponse);
    }
    catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        throw new Error("Failed to delete image from Cloudinary");
    }
});
exports.removeImageFromCloudinary = removeImageFromCloudinary;
// Helper function to extract the public_id from a Cloudinary URL
const getPublicIdFromUrl = (url) => {
    const matches = url.match(/\/([^/]+)\/image\/upload\/v\d+\/(.+)\.\w+/);
    return matches ? matches[2] : null;
};
exports.getPublicIdFromUrl = getPublicIdFromUrl;
