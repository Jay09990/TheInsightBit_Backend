import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/claudinary.js";
import Post from "../models/post.model.js";
import fs from "fs";

export const createPost = asyncHandler(async (req, res) => {

    const { headline, detail } = req.body;

    if (!headline || !detail) {
        console.log("❌ Missing headline or detail");
        throw new ApiError(400, "Headline and detail are required");
    }

    if (!req.user) {
        console.log("❌ req.user missing — check token middleware");
        throw new ApiError(401, "Unauthorized: Missing user in request");
    }

    if (req.user.role !== "admin") {
        console.log("❌ User is not admin:", req.user.role);
        throw new ApiError(403, "Only admins can create posts");
    }

    let mediaUrl = "";
    let mediaType = null;

    // 🔹 Upload media to Cloudinary if provided
    if (req.file) {
        try {
            console.log("🟢 Uploading media from buffer to Cloudinary...");

            // Upload directly from buffer
            const uploadedFile = await uploadToCloudinary(req.file.buffer);

            console.log("✅ Cloudinary response:", uploadedFile);

            if (!uploadedFile) {
                throw new ApiError(500, "Error uploading media to Cloudinary");
            }

            mediaType = uploadedFile.resource_type === "video" ? "video" : "image";
            mediaUrl = uploadedFile.secure_url;

        } catch (err) {
            console.error("❌ Cloudinary upload failed:", err);
            throw new ApiError(500, `Media upload failed: ${err.message}`);
        }
    }

    // 🔹 Normalize any value into array (handles array or comma string)
    const normalizeToArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
        if (typeof value === "string")
            return value.split(",").map((v) => v.trim()).filter(Boolean);
        return [];
    };

    const categoriesArray = normalizeToArray(req.body.categories || req.body['categories[]']);
    const tagsArray = normalizeToArray(req.body.tags || req.body['tags[]']);

    console.log("🟣 Parsed tags:", tagsArray);
    console.log("🟢 Parsed categories:", categoriesArray);

    try {
        const newPost = await Post.create({
            headline,
            detail,
            tags: tagsArray,
            categories: categoriesArray,
            mediaUrl,
            mediaType,
            author: req.user._id,
        });

        console.log("✅ Post created successfully:", newPost._id);

        return res
            .status(201)
            .json(new ApiResponse(201, newPost, "Post created successfully"));
    } catch (dbError) {
        console.error("❌ Database error while creating post:", dbError);
        throw new ApiError(500, "Database error: " + dbError.message);
    }
});

// 🟡 FETCH ALL POSTS
export const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate("author", "userName email");

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "No posts found");
    }

    return res.status(200).json(new ApiResponse(200, posts, "All posts fetched successfully"));
});

// 🟠 FETCH HEADLINES (headline + mediaUrl)
export const getHeadlines = asyncHandler(async (req, res) => {
    const posts = await Post.find({}, "headline mediaUrl createdAt categories").sort({ createdAt: -1 });

    if (!posts || posts.length === 0) {
        throw new ApiError(404, "No headlines found");
    }

    return res.status(200).json(new ApiResponse(200, posts, "Headlines fetched successfully"));
});

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id)
            .populate("author", "userName email")
            .populate("categories", "name")
            .populate("tags", "name");

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        res.status(200).json({
            success: true,
            data: post,
        });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch post",
        });
    }
};

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
export const getSliderPosts = async (req, res) => {
    try {
        // Optional: use query param ?limit=5
        const limit = parseInt(req.query.limit) || 5;

        const sliderPosts = await Post.find()
            .sort({ createdAt: -1 }) // recent first
            .limit(limit)
            .select("headline detail mediaUrl tags createdAt")
            .populate("author", "userName fullName"); // only required fields

        res.status(200).json({
            success: true,
            count: sliderPosts.length,
            data: sliderPosts,
        });
    } catch (error) {
        console.error("Error fetching slider posts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch slider posts",
        });
    }
};
