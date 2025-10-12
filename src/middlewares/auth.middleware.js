import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            return next(new ApiError(401, "Access token is missing"));
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshTokens")

        if (!user) {
            throw new ApiError(401, "access token is invalid");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Access token is invalid or expired");
    }
})