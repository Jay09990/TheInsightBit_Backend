import { User } from "../models/user.model.js";
import { generateOTP, sendOTPEmail } from "../utils/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const sendRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.isEmailVerified) {
    throw new ApiError(400, "Email already registered");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (existingUser) {
    existingUser.emailVerificationOTP = otp;
    existingUser.otpExpiry = otpExpiry;
    await existingUser.save();
  } else {
    await User.create({
      email,
      fullName,
      emailVerificationOTP: otp,
      otpExpiry,
      isEmailVerified: false,
    });
  }

  const emailResult = await sendOTPEmail(email, otp, fullName);
  if (!emailResult.success) throw new ApiError(500, "Failed to send OTP email");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully to your email"));
});


export const verifyOTPAndRegister = asyncHandler(async (req, res) => {
  const { email, otp, password, userName, address } = req.body;

  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await User.findOne({ email });
  if (!user)
    throw new ApiError(404, "User not found. Please request OTP again.");

  if (user.otpExpiry < new Date()) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  if (user.emailVerificationOTP !== otp) throw new ApiError(400, "Invalid OTP");

  user.password = password;
  user.userName = userName;
  user.address = address;
  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.otpExpiry = undefined;

  await user.save();

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshTokens = refreshToken;
  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: userResponse, accessToken, refreshToken },
        "Registration successful"
      )
    );
});


export const sendForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (!user.isEmailVerified) throw new ApiError(400, "Email not verified");

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.emailVerificationOTP = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  const emailResult = await sendOTPEmail(email, otp, user.fullName);
  if (!emailResult.success) throw new ApiError(500, "Failed to send OTP email");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully to your email"));
});


export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    throw new ApiError(400, "All fields are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (user.otpExpiry < new Date())
    throw new ApiError(400, "OTP has expired. Please request a new one.");

  if (user.emailVerificationOTP !== otp)
    throw new ApiError(400, "Invalid OTP");

  user.password = newPassword;
  user.emailVerificationOTP = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successful"));
});
