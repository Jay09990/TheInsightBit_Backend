import mongoose, { Schema } from "mongoose";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    fullName: { type: String, trim: true },
    userName: { type: String, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String },
    address: { type: String },
    avatar: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    refreshTokens: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    
    // ✅ Add these fields for email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOTP: { type: String },
    otpExpiry: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
    return JWT.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return JWT.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );
};

export const User = mongoose.model("User", userSchema);