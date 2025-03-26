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
exports.clerkWebhooks = void 0;
const svix_1 = require("svix");
const app_config_1 = require("../config/app.config");
const user_model_1 = __importDefault(require("../models/user.model"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
// Initialize Clerk with proper typing
const clerkClient = (0, clerk_sdk_node_1.Clerk)({
    secretKey: app_config_1.config.CLERK_SECRET_KEY,
});
const clerkWebhooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ensure required headers are present
        const svixId = req.headers["svix-id"];
        const svixTimestamp = req.headers["svix-timestamp"];
        const svixSignature = req.headers["svix-signature"];
        if (!svixId || !svixTimestamp || !svixSignature) {
            return void res.status(400).json({ error: "Missing Svix headers" });
        }
        // Getting data from request body
        const { data, type } = req.body;
        // Create a Svix instance with Clerk webhook secret
        const whook = new svix_1.Webhook(app_config_1.config.CLERK_WEBHOOK_SECRET);
        yield whook.verify(JSON.stringify(req.body), {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });
        // Define the type of userData as Partial<UserDocument> to allow missing fields
        let userData;
        // Switch Cases for different Events
        switch (type) {
            case "user.created":
                // 1. Check if user exists in YOUR DB (not Clerk)
                const existingUser = yield user_model_1.default.findOne({ _id: data.id });
                if (existingUser) {
                    return void res.status(200).json({ success: true }); // Avoid duplicates in your DB
                }
                // 2. Save to your DB
                yield user_model_1.default.create({
                    _id: data.id, // Ensure this is Clerk's user ID (e.g., "user_2abc123")
                    email: (_a = data.email_addresses[0]) === null || _a === void 0 ? void 0 : _a.email_address,
                    name: data.first_name,
                    image: data.image_url,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    role: "user",
                });
                // 3. Update Clerk's metadata (CRITICAL: Use Clerk's user ID!)
                try {
                    yield clerkClient.users.updateUser(data.id, {
                        publicMetadata: { role: "user" }, // Attaches to existing Clerk user
                    });
                }
                catch (err) {
                    console.error("Failed to update Clerk metadata:", err);
                }
                return void res.status(200).json({ success: true });
            case "user.updated":
                userData = {
                    email: data.email_addresses[0].email_address,
                    name: data.first_name,
                    image: data.image_url,
                    updatedAt: new Date(), // Update timestamp
                };
                yield user_model_1.default.findByIdAndUpdate(data.id, userData);
                return void res.status(200).json({ success: true });
            case "user.deleted":
                yield user_model_1.default.findByIdAndDelete(data.id);
                return void res.status(200).json({ success: true });
            default:
                return void res.status(400).json({ error: "Unknown event type" });
        }
    }
    catch (error) {
        console.error("Webhook verification failed:", error);
        return void res.status(400).json({ error: "Webhook verification failed" });
    }
});
exports.clerkWebhooks = clerkWebhooks;
exports.default = exports.clerkWebhooks;
