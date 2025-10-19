import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multur.middleware.js";
import {
    createPost,
    getAllPosts,
    getHeadlines,
    getSliderPosts,
    deletePost,
    getPostById,
    editPost,
} from "../controller/post.controller.js";

const router = express.Router();

router.post("/create", verifyJWT, upload.single("media"), createPost);
router.get("/all", getAllPosts);
router.get("/headlines", getHeadlines);
router.get("/slider", getSliderPosts);
router.get("/:id", getPostById); // 👈 NEW: fetch a single post by ID
router.route("/:postId").patch(verifyJWT, upload.single("media"), editPost);
router.delete("/:postId", verifyJWT, deletePost);

export default router;
