const asyncHandler = require('../Utils/AsyncHandler');
const User = require('../Models/user.models');
const ApIError = require('../Utils/ApIError');
const { uploadOnCloudinary, deleteImage } = require('../Utils/cloudINary');
const ApIResponse = require('../Utils/ApIResponse');
const jwt = require('jsonwebtoken');
/**
 * GET /testing
 * This controller handles GET requests to the /testing endpoint.
 * It logs the request and sends a success response with a message.
 */
const getTesting = asyncHandler(async (_, res) => {
    try {
        console.log("Received GET request at /testing");

        res.status(200).json({
            success: true,
            message: "GET request successful",
            data: {
                response: 'Controller GET API is working fine!'
            }
        });
    } catch (error) {
        console.error("Error in GET /testing:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

/**
 * POST /testing
 * This controller handles POST requests to the /testing endpoint.
 * It logs the request with the received data and sends a success response.
 */
const postTesting = asyncHandler(async (req, res) => {
    try {
        console.log("Received POST request at /testing with data:", req.body);

        res.status(200).json({
            success: true,
            message: "POST request successful",
            data: {
                response: 'Controller POST API is working fine!'
            }
        });
    } catch (error) {
        console.error("Error in POST /testing:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

/**
 * POST /register
 * This controller handles user registration.
 * It validates the incoming request, checks for existing users, 
 * and uploads the avatar and cover image to Cloudinary.
 * If successful, it creates a new user and responds with the created user details.
 */
const registerUser = asyncHandler(async (req, res,) => {
    try {
        const { fullname, email, username, password } = req.body;

        // Check if any field is empty
        if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
            throw new ApIError(400, 'All fields are required');
        }

        // Check if a user with the given email or username already exists
        const exstedUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        console.log(exstedUser, 2);

        if (exstedUser) {
            throw new ApIError(409, 'User with email already exists!');
        }

        // Handle avatar and cover image upload
        const avaterLocalPath = req.files?.avater?.[0]?.path;
        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files?.coverImage?.[1]?.path;
            console.log('we have cover Image ', coverImageLocalPath)
        }

        if (!avaterLocalPath) {
            throw new ApIError(400, "Avatar file is required")
        }

        const avatar = await uploadOnCloudinary(avaterLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!avatar) {
            throw new ApIError(400, "Avatar file is required")
        }


        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApIError(500, "Something went wrong while registering the user")
        }

        return res.status(201).json(
            new ApIResponse(200, createdUser, "User registered Successfully")
        )

    } catch (err) {
        console.log(err);
    }
});

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accesTocken = user.generateAccessTocken();
        const refreshTocken = user.generateRefreshTocken();

        user.refreshTocken = refreshTocken;
        await user.save({ validateBeforeSave: false });

        return { accesTocken, refreshTocken };

    } catch (error) {
        throw new ApIError(500, "Something Went wrong while generating refresh and acces token");
    }
}

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApIError(400, "username and password is required");
    }

    // Add await to resolve the promise
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // Check if user is null
    if (!user) {
        throw new ApIError(400, "user does not exist");
    }

    // Use the isPasswordCorrect method on the resolved user document
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApIError(401, "invalid user credentials");
    }

    const { accesTocken, refreshTocken } = await generateAccessAndRefreshTokens(user._id);

    // Add await to resolve the promise
    const loggedInUser = await User.findById(user._id).select('-password -refreshTocken');

    // Cookies are only modifiable from the server
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" // Only secure in production
    };


    res.status(200)
        .cookie("accessTocken", accesTocken, options)
        .cookie("refreshTocken", refreshTocken, options)
        .json(
            new ApIResponse(
                200,
                {
                    user: loggedInUser,
                    accesTocken,
                    refreshTocken
                },
                "user logged in successfully"
            )
        );
});


const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshTocken: undefined,
            }
        },
        {
            new: true // Return the updated document
        }
    );

    // Cookies are only modifiable from the server
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" // Only secure in production
    };

    return res.status(200)
        .clearCookie("accessTocken", options)
        .clearCookie("refreshTocken", options)
        .json(
            new ApIResponse(
                200,
                {},
                "user logged out successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshTocken = req.cookies?.refreshTocken || req.body?.refreshToken;

    if (!incomingRefreshTocken) {
        throw new ApIError(401, "Unauthorized request");
    }

    try {
        const decodedTocken = jwt.verify(
            incomingRefreshTocken,
            process.env.REFRESH_TOCKEN_SECRET // Ensure this matches your environment variable
        );

        const user = await User.findById(decodedTocken?._id);

        if (!user) {
            throw new ApIError(401, "Invalid refresh token");
        }

        if (incomingRefreshTocken !== user?.refreshTocken) {
            throw new ApIError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        };

        const { accesTocken, newRefreshTocken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessTocken", accesTocken, options)
            .cookie("refreshTocken", newRefreshTocken, options)
            .json(
                new ApIResponse(
                    200,
                    { accesTocken, refreshTocken: newRefreshTocken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        console.error("Error refreshing token:", error);
        throw new ApIError(401, error?.message || "Invalid refresh token");
    }
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body;

    if (!(newPassword === confPassword)) {
        throw new ApIError(401, "invalid new Password");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApIError(401, "invalid old Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApIResponse(
            200,
            {},
            "password changed successfully"
        )
    );
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApIResponse(
            200,
            req.user,
            "current user fetched successfully"
        )
    );
});


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApIError(401, "fullname and email is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApIResponse(
            200,
            user,
            "user details updated successfully"
        )
    );
});

const updateUserAvater = asyncHandler(async (req, res) => {
    const avaterLocalPath = req.file?.path;

    if (!avaterLocalPath) {
        throw new ApIError(401, "Avatar file is missing");
    }

    const avater = await uploadOnCloudinary(avaterLocalPath);

    if (!avater.url) {
        throw new ApIError(401, "Avatar file is required");
    }

    // Retrieve user before using it
    const user = await User.findById(req.user?._id);
    const oldAvatarUrl = user?.avatar;

    if (oldAvatarUrl) {
        const oldPublicId = extractPublicId(oldAvatarUrl);

        if (oldPublicId) {
            // Delete the old avatar from Cloudinary
            await deleteImage(oldPublicId);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avater.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(
        new ApIResponse(200, updatedUser, "Avatar updated Successfully")
    );
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApIError(401, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApIError(401, "Cover image file is required");
    }

    // Retrieve user before using it
    const user = await User.findById(req.user?._id);
    const oldCoverImageUrl = user?.coverImage;

    if (oldCoverImageUrl) {
        const oldPublicId = extractPublicId(oldCoverImageUrl);

        if (oldPublicId) {
            // Delete the old cover image from Cloudinary
            await deleteImage(oldPublicId);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res.status(200).json(
        new ApIResponse(200, updatedUser, "Cover Image updated Successfully")
    );
});


const extractPublicId = (url) => {
    try {
        // Parse the URL
        const parsedUrl = new URL(url);

        // Extract the pathname and split it into parts
        const pathParts = parsedUrl.pathname.split('/');

        // Get the last part, which includes the publicId and extension
        const lastPart = pathParts.pop();

        // Extract the publicId by removing the file extension
        const [publicId] = lastPart.split('.');

        return publicId;
    } catch (error) {
        console.error('Invalid URL:', error);
        return null; // Return null or handle the error as needed
    }
}


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApIError(400, "usename is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subsciptions",
                localField: "_id",
                foreignFeild: "channel",
                as: 'subscribers'
            }
        },
        {
            $lookup: {
                from: "subsciptions",
                localField: "_id",
                foreignFeild: "subscriber",
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscriberscount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubcribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subsciptions.subscribers"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberscount: 1,
                channelSubscribedToCount: 1,
                isSubcribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApIError(404, "Channel dosent exists");
    }

    return res.status(200)
        .json(
            new ApIResponse(
                200,
                channel[0],
                "user profile fetched successfully"
            )
        )
});



const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
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
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
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
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


// Export controllers for use in routes
module.exports = {
    getTesting,
    postTesting,
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvater,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
