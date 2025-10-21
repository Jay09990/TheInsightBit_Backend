import { User } from "../models/user.model.js";
import { generateOTP, sendOTPEmail } from "../utils/emailService.js";

// Send OTP for registration
export const sendRegistrationOTP = async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // If user exists but not verified, update OTP
    if (existingUser) {
      existingUser.emailVerificationOTP = otp;
      existingUser.otpExpiry = otpExpiry;
      await existingUser.save();
    } else {
      // Create temporary user with OTP
      await User.create({
        email,
        fullName,
        emailVerificationOTP: otp,
        otpExpiry,
        isEmailVerified: false,
      });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, fullName);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Verify OTP and complete registration
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp, password, userName, address } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please request OTP again." });
    }

    // Check if OTP is expired
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Update user with complete registration details
    user.password = password;
    user.userName = userName;
    user.address = address;
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;

    await user.save();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens = refreshToken;
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// Send OTP for password reset
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email not verified" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.fullName);

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if OTP is expired
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Update password
    user.password = newPassword;
    user.emailVerificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};