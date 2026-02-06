import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1️⃣ Check if user exists by Google ID

        // console.log("Verifying user...", profile.id);
        let user = await User.findOne({ googleId: profile.id });

        // 2️⃣ If not, check if same email already exists (manual sign up)
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
        }

        // 3️⃣ If still not found, create a new one
        if (!user) {
          const randomUsername =
            profile.displayName?.replace(/\s+/g, "").toLowerCase() +
            Math.floor(Math.random() * 1000);

          user = await User.create({
            googleId: profile.id,
            fullName: profile.displayName,
            userName: randomUsername,
            email: profile.emails[0].value,
            avatar: profile.photos?.[0]?.value,
            role: "user",
            isEmailVerified: true,
          });
        } else {
          // 4️⃣ If user exists but doesn't have a role, set it
          if (!user.role) {
            user.role = "user";
            await user.save();
          }
        }

        console.log("Google OAuth user:", user);

        done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        done(err, null);
      }
    }
  )
);

export default passport;