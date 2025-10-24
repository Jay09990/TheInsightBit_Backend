import express from "express";
import passport from "passport";
import { User } from "../models/user.model.js";
import "../config/passport.js";

const router = express.Router();

// 🧭 Step 1: Redirect user to Google for authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🧭 Step 2: Google redirects user back here after login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL,
    session: false,
  }),
  async (req, res) => {
    try {
      // ✅ req.user is already the User document from passport.js
      const user = req.user;

      // ✅ Generate JWT tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      // ✅ Save refresh token
      user.refreshTokens = refreshToken;
      await user.save();

      // ✅ Prepare user data to send to frontend (remove sensitive fields)
      const userResponse = {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        userName: user.userName,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        googleId: user.googleId
      };

      // ✅ Redirect user to frontend with tokens AND user data
      const frontendURL = process.env.FRONTEND_URL;
      res.redirect(
        `${frontendURL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userResponse))}`
      );
    } catch (error) {
      console.error("Google OAuth Error:", error);
      const frontendURL = process.env.FRONTEND_URL;
      res.redirect(`${frontendURL}/login?error=auth_failed`);
    }
  }
);

export default router;