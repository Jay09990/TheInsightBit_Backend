import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Post  from  "../models/post.model.js";

// ➕ Add a new comment
export const addComment = asyncHandler(async (req, res) => {
  const { postId, content } = req.body;

  if (!postId || !content) {
    throw new ApiError(400, "Post ID and content are required");
  }

  const comment = await Comment.create({
    post: postId,
    user: req.user._id,
    content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// 👑 Admin Reply
export const replyToComment = asyncHandler(async (req, res) => {
  const { commentId, reply } = req.body;

  if (!commentId || !reply) {
    throw new ApiError(400, "Comment ID and reply text are required");
  }

  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Only admins can reply to comments");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  comment.reply = reply;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Reply added successfully"));
});

// 🔍 Get all comments for a post
export const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    throw new ApiError(400, "Post ID is required");
  }

  const comments = await Comment.find({ post: postId })
    .populate("user", "username role")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const updates = req.body;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "You can only edit your own posts");
  }

  const updated = await Post.findByIdAndUpdate(postId, updates, { new: true });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Post updated successfully"));
});

