import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

export const cloudinaryConnect = () => {
    try {
        cloudinary.config({
            // Configuration to connect cloudinary with my project
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
        });
        console.log("Cloudinary connected successfully");
    } catch (err) {
        console.log(err);
    }
}