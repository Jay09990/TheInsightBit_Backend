import mongoose from "mongoose";
import { User } from "./user.model.js";
import Post from "./post.model.js";

const commentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        reply: {
            type: String, // Only admin can reply, so we keep one optional reply per comment
            default: "",
        },
    },
    { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
