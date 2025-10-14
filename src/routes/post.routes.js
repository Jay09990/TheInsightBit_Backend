import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multur.middleware.js";
import {
    createPost,
    getAllPosts,
    getHeadlines,
    getSliderPosts,
    deletePost,
} from "../controller/post.controller.js";

const router = express.Router();

router.post("/create", verifyJWT, upload.single("media"), createPost);
router.get("/all", getAllPosts);
router.get("/headlines", getHeadlines);
router.delete("/:postId", verifyJWT, deletePost);
// router.get("/slider", getSliderPosts);


export default router;
