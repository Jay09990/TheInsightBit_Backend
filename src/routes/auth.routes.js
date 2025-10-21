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
    failureRedirect: "https://the-insightbit.vercel.app/login", // ⚠️ Update to your local frontend URL
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

      // ✅ Redirect user to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || "https://the-insightbit.vercel.app/";
      res.redirect(
        `${frontendURL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch (error) {
      console.error("Google OAuth Error:", error);
      const frontendURL = process.env.FRONTEND_URL || "https://the-insightbit.vercel.app/";
      res.redirect(`${frontendURL}/login?error=auth_failed`);
    }
  }
);

export default router;