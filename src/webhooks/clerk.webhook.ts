import { Webhook } from "svix";
import { Request, Response, RequestHandler } from "express";
import { config } from "../config/app.config";
import UserModel, { UserDocument } from "../models/user.model";
import { Clerk } from "@clerk/clerk-sdk-node";

// Initialize Clerk with proper typing
const clerkClient = Clerk({
  secretKey: config.CLERK_SECRET_KEY,
});

export const clerkWebhooks: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Ensure required headers are present
    const svixId = req.headers["svix-id"] as string | undefined;
    const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
    const svixSignature = req.headers["svix-signature"] as string | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: "Missing Svix headers" });
      return;
    }

    // Create a Svix instance with Clerk webhook secret
    const whook = new Webhook(config.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });

    // Getting data from request body
    const { data, type } = req.body;

    // Define the type of userData as Partial<UserDocument> to allow missing fields
    let userData: Partial<UserDocument>;

    // Switch Cases for different Events
    switch (type) {
      case "user.created":
        // (1) Save user to your DB
        userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name,
          image: data.image_url,
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await UserModel.create(userData);

        // (2) DEBUG: Log the user ID and metadata before update
        console.log(`Updating Clerk metadata for user: ${data.id}`);

        // (3) Update Clerk's publicMetadata
        try {
          await clerkClient.users.updateUser(data.id, {
            publicMetadata: { role: "user" },
          });
          console.log("Clerk metadata updated successfully");
        } catch (err) {
          console.error("Failed to update Clerk metadata:", err);
          // Still respond with 200 to avoid retries
        }

        res.status(200).json({ success: true });
        return;

      case "user.updated":
        userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name,
          image: data.image_url,
          updatedAt: new Date(), // Update timestamp
        };
        await UserModel.findByIdAndUpdate(data.id, userData);
        res.status(200).json({ success: true });
        return;

      case "user.deleted":
        await UserModel.findByIdAndDelete(data.id);
        res.status(200).json({ success: true });
        return;

      default:
        res.status(400).json({ error: "Unknown event type" });
        return;
    }
  } catch (error) {
    console.error("Webhook verification failed:", error);
    res.status(400).json({ error: "Webhook verification failed" });
    return;
  }
};

export default clerkWebhooks;
