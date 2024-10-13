import cloudinary from "cloudinary";

export const uploadImageToCloudinary = async (req, res) => {
    try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: "amazon-store",
            width: 1200,
            height: 1200,
            crop: "limit",
        }
        );
    }
    catch (err) {
        res.status(500).json({
            message: 'Error uploading image',
            error: err,
        });
    }w
}