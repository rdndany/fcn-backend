import { v2 as cloudinary } from "cloudinary";

export const removeImageFromCloudinary = async (
  publicId: string
): Promise<void> => {
  try {
    // Delete the image from Cloudinary using the publicId.
    const cloudinaryResponse = await cloudinary.api.delete_resources(
      [publicId],
      { type: "upload", resource_type: "image" }
    );
    console.log("Cloudinary Response:", cloudinaryResponse);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};

// Helper function to extract the public_id from a Cloudinary URL
export const getPublicIdFromUrl = (url: string) => {
  const matches = url.match(/\/([^/]+)\/image\/upload\/v\d+\/(.+)\.\w+/);
  return matches ? matches[2] : null;
};
