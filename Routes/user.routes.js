const express = require('express');
const router = express.Router();

/* Imports Controllers */
const registerUser = require('../Controllers/user.controller');

/* Tell me which controller you want to fire On Internet through middleware Users by using which HTTP method */
router.route('/register').post(registerUser); 

module.exports = router;