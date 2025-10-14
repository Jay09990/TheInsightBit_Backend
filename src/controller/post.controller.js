import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/claudinary.js";
import Post from "../models/post.model.js";
import fs from "fs";

export const createPost = asyncHandler(async (req, res) => {
    const { headline, detail, tags } = req.body;

    if (!headline || !detail) {
        throw new ApiError(400, "Headline and detail are required");
    }

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can create posts");
    }

    let mediaUrl = "";
    let mediaType = null;

    if (req.file) {
        const localFilePath = req.file.path;
        const uploadedFile = await uploadToCloudinary(localFilePath);

        if (!uploadedFile) {
            throw new ApiError(500, "Error uploading media to Cloudinary");
        }

        mediaType = uploadedFile.resource_type === "video" ? "video" : "image";
        mediaUrl = uploadedFile.secure_url;

        fs.unlinkSync(localFilePath); // cleanup
    }

    const newPost = await Post.create({
        headline,
        detail,
        tags: tags ? tags.split(",").map(t => t.trim()) : [],
        mediaUrl,
        mediaType,
        author: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, newPost, "Post created successfully"));
});

// 🟡 FETCH ALL POSTS
export const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate("author", "username email");

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "No posts found");
    }

    return res.status(200).json(new ApiResponse(200, posts, "All posts fetched successfully"));
});

// 🟠 FETCH HEADLINES (headline + mediaUrl)
export const getHeadlines = asyncHandler(async (req, res) => {
    const posts = await Post.find({}, "headline mediaUrl createdAt").sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "No headlines found");
    }

    return res.status(200).json(new ApiResponse(200, posts, "Headlines fetched successfully"));
});

// 🔴 DELETE POST (Admin Only)
export const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can delete posts");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    await post.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

// Get limited slider posts
// export const getSliderPosts = async (req, res) => {
//     try {
//         // Optional: use query param ?limit=5
//         const limit = parseInt(req.query.limit) || 5;

//         const sliderPosts = await Post.find()
//             .sort({ createdAt: -1 }) // recent first
//             .limit(limit)
//             .select("headline detail mediaUrl tags createdAt"); // only required fields

//         res.status(200).json({
//             success: true,
//             count: sliderPosts.length,
//             data: sliderPosts,
//         });
//     } catch (error) {
//         console.error("Error fetching slider posts:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch slider posts",
//         });
//     }
// };
