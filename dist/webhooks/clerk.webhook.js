"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clerkWebhooks = void 0;
const svix_1 = require("svix");
const app_config_1 = require("../config/app.config");
const user_model_1 = __importDefault(require("../models/user.model"));
// API Controller function to manage Clerk user with database
const clerkWebhooks = async (req, res) => {
    try {
        // Ensure required headers are present
        const svixId = req.headers["svix-id"];
        const svixTimestamp = req.headers["svix-timestamp"];
        const svixSignature = req.headers["svix-signature"];
        if (!svixId || !svixTimestamp || !svixSignature) {
            res.status(400).json({ error: "Missing Svix headers" });
            return;
        }
        // Create a Svix instance with Clerk webhook secret
        const whook = new svix_1.Webhook(app_config_1.config.CLERK_WEBHOOK_SECRET);
        await whook.verify(JSON.stringify(req.body), {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });
        // Getting data from request body
        const { data, type } = req.body;
        // Define the type of userData as Partial<UserDocument> to allow missing fields
        let userData;
        // Switch Cases for different Events
        switch (type) {
            case "user.created":
                // Add publicMetadata with role "user"
                userData = {
                    _id: data.id,
                    email: data.email_addresses[0].email_address,
                    name: data.first_name,
                    image: data.image_url,
                    role: "user", // Assign role "user"
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                await user_model_1.default.create(userData);
                res.status(200).json({ success: true });
                return;
            case "user.updated":
                userData = {
                    email: data.email_addresses[0].email_address,
                    name: data.first_name,
                    image: data.image_url,
                    updatedAt: new Date(), // Update timestamp
                };
                await user_model_1.default.findByIdAndUpdate(data.id, userData);
                res.status(200).json({ success: true });
                return;
            case "user.deleted":
                await user_model_1.default.findByIdAndDelete(data.id);
                res.status(200).json({ success: true });
                return;
            default:
                res.status(400).json({ error: "Unknown event type" });
                return;
        }
    }
    catch (error) {
        console.error("Webhook verification failed:", error);
        res.status(400).json({ error: "Webhook verification failed" });
        return;
    }
};
exports.clerkWebhooks = clerkWebhooks;
exports.default = exports.clerkWebhooks;
