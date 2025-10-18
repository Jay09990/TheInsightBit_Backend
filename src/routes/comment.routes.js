import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    replyToComment,
    getCommentsByPost,
} from "../controller/comment.controller.js";

const router = express.Router();

router.get("/:postId", getCommentsByPost);
router.post("/add", verifyJWT, addComment);
router.post("/reply", verifyJWT, replyToComment);

export default router;
