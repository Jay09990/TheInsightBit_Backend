import { Router } from "express"
import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    updateUserAvatar,
    updateUsercoverImage,
    changeCurrentPassword,
    getCurrentUsr,
    updateAccountDetails,
    getChannelProfile,
    getWatchHistory
} from "../controller/user.controller.js"
import { upload } from "../middlewares/multur.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

// secured routes

router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-Token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").post(verifyJWT, getCurrentUsr)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage)
router.route("/c/:username").get(verifyJWT, getChannelProfile)
router.route("history").get(verifyJWT, getWatchHistory)


export default router