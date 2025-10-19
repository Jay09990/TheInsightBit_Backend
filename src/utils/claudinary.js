import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import streamifier from "streamifier"; // required for buffer uploads


cloudinary.config({
    cloud_name: process.env.CLOUDE_NAME,
    api_key: process.env.CLAUDINARY_API_KEY,
    api_secret: process.env.CLAUDINARY_API_SECRET
});

export const uploadToCloudinary = async (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "the-insightbit", resource_type: "auto" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};