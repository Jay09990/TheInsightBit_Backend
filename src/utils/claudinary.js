import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import streamifier from "streamifier"; // required for buffer uploads


cloudinary.config({
    cloud_name: process.env.CLOUDE_NAME,
    api_key: process.env.CLAUDINARY_API_KEY,
    api_secret: process.env.CLAUDINARY_API_SECRET
});

// const uploadToCloudinary = async (localFilePath) => {
//     let uploadResult;
    
//     try {
//         uploadResult = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         });

//         // console.log(uploadResult);

//         // Optimize delivery by resizing and applying auto-format and auto-quality
//         const optimizeUrl = cloudinary.url(uploadResult.public_id, {
//             fetch_format: 'auto',
//             quality: 'auto'
//         });

//         // console.log(optimizeUrl);

//         // Transform the image: auto-crop to square aspect_ratio
//         const autoCropUrl = cloudinary.url(uploadResult.public_id, {
//             crop: 'auto',
//             gravity: 'auto',
//             width: 500,   // example value
//             height: 500   // example value
//         });

//         // console.log(autoCropUrl);

//         return uploadResult;
//     } catch (error) {
//         fs.unlinkSync(localFilePath);
//         console.log(error);
//         return null;
//     }
// }

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