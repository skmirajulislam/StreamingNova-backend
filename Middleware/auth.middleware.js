const ApIError = require("../Utils/ApIError");
const asyncHandler = require("../Utils/AsyncHandler");
const jwt = require('jsonwebtoken');
const User = require('../Models/user.models');

exports.varifyJwt = asyncHandler(async (req, _, next) => {
    try {
        const tocken = req.cookies?.accessTocken || req.header('Authorization')?.replace('Bearer', "");

        if (!tocken) {
            throw new ApIError(401, "Unauthorize request");
        }

        const decodedTocken = jwt.decode(tocken, process.env.ACESS_TOCKEN_SECRET);

        const user = await User.findByid(decodedTocken._id).select('-password -refreshTocken');

        if (!user) {
            throw new ApIError(401, 'invalid access token');
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApIError(401,error?.message|| "invalid access token");
    }

}); 