const ApIError = require("../Utils/ApIError");
const asyncHandler = require("../Utils/AsyncHandler");
const jwt = require('jsonwebtoken');
const User = require('../Models/user.models');

const verifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessTocken || req.header('Authorization')?.replace('Bearer ', '').trim();

        if (!token) {
            throw new ApIError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACESS_TOCKEN_SECRET); // Use `verify` instead of `decode` for signature verification

        const user = await User.findById(decodedToken._id).select('-password -refreshTocken');

        if (!user) {
            throw new ApIError(401, 'Invalid access token');
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApIError(401, error?.message || "Invalid access token");
    }
});

module.exports = verifyJwt;