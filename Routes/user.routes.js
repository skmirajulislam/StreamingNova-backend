const express = require('express');
const router = express.Router();
const upload = require('../Middleware/multer.middleware');
const varifyJwt = require('../Middleware/auth.middleware');

// Import Controllers
const { registerUser, postTesting, getTesting, logOutUser } = require('../Controllers/user.controller');


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

router.post('/logout',varifyJwt,logOutUser);

module.exports = router;
