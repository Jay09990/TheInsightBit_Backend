import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadToCloudinary } from "../utils/claudinary.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from 'cloudinary';

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshTokens = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        throw new ApiError(500, "Internal server error while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, userName, email, password, address } = req.body;

    // Basic validation
    if (!fullName || !userName || !email || !password || !address) {
        throw new ApiError(400, "All fields are required!");
    }

    // Check existing user
    const existingUser = await User.findOne({
        $or: [{ userName: userName.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
        throw new ApiError(
            409,
            `User already exists with ${existingUser.email === email.toLowerCase() ? "email" : "username"}`
        );
    }

    // Create user
    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email: email.toLowerCase(),
        password,
        address,
        role:"user"
    });

    // Return created user without password/refreshTokens
    const createdUser = await User.findById(user._id).select("-password -refreshTokens");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    console.log("Login request body:", req.body);
    console.log("Request headers:", req.headers);

    if (!req.body || Object.keys(req.body).length === 0) {
        throw new ApiError(400, "Request body is missing or empty");
    }

    const { email, userName, password } = req.body;

    // Validate email/username + password
    if ((!email || email.trim() === "") && (!userName || userName.trim() === "")) {
        throw new ApiError(400, "Email or username is required for login.");
    }

    if (!password || password.trim() === "") {
        throw new ApiError(400, "Password is required for login.");
    }

    // Find user
    const user = await User.findOne({
        $or: [
            { userName: userName?.toLowerCase() },
            { email: email?.toLowerCase() }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User not found with the provided email or username.");
    }

    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password.");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    // Fetch clean user (without sensitive fields)
    const loggedInUser = await User.findById(user._id).select("-password -refreshTokens");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    // ✅ Include role explicitly in response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: {
                        _id: loggedInUser._id,
                        name: loggedInUser.name,
                        email: loggedInUser.email,
                        userName: loggedInUser.userName,
                        role: loggedInUser.role || "user", // 👈 Make sure frontend gets it
                    },
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});


const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        { $unset: { refreshTokens: 1 } }, // Fix: Use $unset instead of $set with undefined
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required for refreshing access token.");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);

        if (!user || !user.refreshTokens || user.refreshTokens !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid or expired refresh token.");
        }

        if (incomingRefreshToken !== user?.refreshTokens) {
            throw new ApiError(403, "Refresh token mismatch.");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { newAccessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);


        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, null, "Access token refreshed successfully"));
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token." || error?.message);
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully."))
})

const getCurrentUsr = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched  successully."))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email, } = req.body

    if (!fullName && !email) {
        throw new ApiError(400, "Both data is requred  to update.")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")
    return res
        .status(200)
        .json(200, user, "Account details udated successfully")
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const oldAvtarUrl = req?.user.avatar
    const oldAvatarPublicId = oldAvtarUrl.split('/').pop().split('.')[0]

    console.log(oldAvtarUrl)

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing or Incorrect path.")
    }

    const avatar = await uploadToCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Problem while uploading avatar.")
    }

    if (oldAvatarPublicId) {
        await cloudinary.uploader.destroy(oldAvatarPublicId)
        console.log("old image deleted successfully")
    }

    const user = await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar Image updated successfully"))
})

const updateUsercoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    const oldCoverImageUrl = req?.user.coverImage

    const oldCoverImagePublicId = oldCoverImageUrl.split('/').pop().split('.')[0]

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing or Incorrect path.")
    }

    const coverImage = await uploadToCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Problem while uploading cover image.")
    }

    if (oldCoverImagePublicId) {
        await cloudinary.uploader.destroy(oldCoverImagePublicId)
        console.log("old image deleted successfully")
    }

    const user = await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})

const getChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing!")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel"
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "susbcribedTo"
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$susbcribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length === 0) {
        throw new ApiError(404, "Channel does not exist")
    }

    res.status(200)
        .json(new ApiResponse(200, channel[0], "Channnel fetched successfully."))
})

const getWatchHistory = asyncHandler(async (res, req) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user.id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, user[0].watchHistory, "Watch history fetched successfully.")
        )
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    getCurrentUsr,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getWatchHistory,
    getChannelProfile
}