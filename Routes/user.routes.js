const express = require('express');
const router = express.Router();
const upload = require('../Middleware/multer.middleware')

/* Imports Controllers */
const { registerUser, postTesting, getTesting } = require('../Controllers/user.controller');


/* Tell me which controller you want to fire On Internet through middleware Users by using which HTTP method */
router.post('/postTester', postTesting);
router.post('/register', registerUser);
router.get('/getTester', upload.fields([
    {
        name: "avater",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), getTesting);

module.exports = router;