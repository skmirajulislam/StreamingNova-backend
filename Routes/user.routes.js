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
    refreshAccessToken
} = require('../Controllers/user.controller');


// Define routes
router.post('/postTester', postTesting);
router.get('/getTester', getTesting);

// Route for user registration with file upload
router.post(
    '/register',
    upload.fields([
        { name: 'avater', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
    ]),
    registerUser
);

router.post("/login", loginUser)
router.post('/logout', varifyJwt, logOutUser);
router.post('/refresh-tocken', refreshAccessToken)

module.exports = router;
