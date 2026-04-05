import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// cloudinary.config({
//   cloud_name: "dpdqysgk0",
//   api_key: "294962678986942",
//   api_secret: "rqYt117WBcRDVYTd4GZQyK1Basg",
// });

cloudinary.config({
  cloud_name: "drhy7ltsk",
  api_key: "446677976217947",
  api_secret: "C-fY8xW8_-xy9gf2XOgUJe-BvoU",
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      secure: true, // ✅ Ensures HTTPS URL
    });

    // Ensure we use the secure URL
    const secureUrl = response.secure_url;

    // Cleanup local file
    await fs.promises.unlink(localFilePath);

    return secureUrl; // ✅ Return HTTPS secure URL
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);

    // Cleanup in case of error
    await fs.promises.unlink(localFilePath);

    return null;
  }
};


export const removeFromCloudinary = async (imageUrl) => {
  try {
    // Extract publicId from the image URL
    const publicId = imageUrl.split("/").pop().split(".")[0];

    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary deletion result:", result);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return null;
  }
};
