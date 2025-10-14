import mongoose from "mongoose";
import { User } from "./user.model.js";

const postSchema = new mongoose.Schema(
    {
        headline: {
            type: String,
            required: true,
            trim: true,
        },

        detail: {
            type: String,
            required: true,
        },

        mediaUrl: {
            type: String,
            required: false,
        },

        mediaType: {
            type: String,
            enum: ["image", "video", null],
            default: null,
        },

        tags: [
            {
                type: String,
                trim: true,
            },
        ],

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
