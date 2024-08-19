const express = require('express');
const router = express.Router();
const upload = require('../Middleware/multer.middleware');
const varifyJwt = require('../Middleware/auth.middleware');

// Import Controllers
const {
    registerUser,
    postTesting,
    getTesting,
    logOutUser,
    loginUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} = require('../Controllers/user.controller');


// Define routes
router.post('/postTester', postTesting);
router.get('/getTester', getTesting);

// Route for user registration with file upload
router.route("/register").post(
    upload.fields([
        {
            name: "avater",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.post("/login", loginUser);
router.post('/logout', varifyJwt, logOutUser);
router.post("/change-password", varifyJwt, changeCurrentPassword);
router.post('/refresh-tocken', refreshAccessToken);

router.get("/current-user",varifyJwt, getCurrentUser);

router.patch("/update-account", varifyJwt, updateAccountDetails);
router.patch("/avatar", varifyJwt, upload.single("avatar"), updateUserAvater);
router.patch("/cover-image", varifyJwt, upload.single("coverImage"), updateUserCoverImage);
router.get("/c/:username",varifyJwt, getUserChannelProfile)
router.get("/history",varifyJwt, getWatchHistory)

module.exports = router;
