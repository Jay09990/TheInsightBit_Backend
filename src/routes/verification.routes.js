import express from "express";
import { 
  sendRegistrationOTP, 
  verifyOTPAndRegister,
  sendForgotPasswordOTP,
  resetPassword
} from "../controller/auth.controller.js";

const router = express.Router();

// Registration routes
router.post("/send-otp", sendRegistrationOTP);
router.post("/verify-otp", verifyOTPAndRegister);

// Forgot password routes
router.post("/forgot-password", sendForgotPasswordOTP);
router.post("/reset-password", resetPassword);

export default router;