import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multur.middleware.js";
import {
    createPost,
    getAllPosts,
    getHeadlines,
    getSliderPosts,
    deletePost,
    // getAllCategories ,
    getPostById, // 👈 import this new controller
} from "../controller/post.controller.js";

const router = express.Router();

router.post("/create", verifyJWT, upload.single("media"), createPost);
router.get("/all", getAllPosts);
router.get("/headlines", getHeadlines);
router.get("/slider", getSliderPosts);
router.get("/:id", getPostById); // 👈 NEW: fetch a single post by ID
router.delete("/:postId", verifyJWT, deletePost);
// router.get("/all", getAllCategories);


export default router;
