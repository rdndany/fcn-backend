import { Webhook } from "svix";
import { Request, Response, RequestHandler } from "express";
import { config } from "../config/app.config";
import UserModel, { UserDocument } from "../models/user.model";

// API Controller function to manage Clerk user with database
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
        await UserModel.create(userData);
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
