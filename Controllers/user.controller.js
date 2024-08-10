const asyncHandler = require('../Utils/AsyncHandler');
const User = require('../Models/user.models');
const ApIError = require('../Utils/ApIError');
const uploadOnCloudinary = require('../Utils/cloudINary');
const ApIResponse = require('../Utils/ApIResponse');

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
            coverImageLocalPath = req.files?.coverImage?.[0]?.path;
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

    if (!username || !email) {
        throw new ApIError(400, "username and password is required");
    }

    const user = User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApIError(400, "user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApIError(401, "invalid user craditential");
    }

    const { accesTocken, refreshTocken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = User.findById(user._id).select('-password -refreshTocken');

    // cookies Is only modifiable from Server 
    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .cookies("accessTocken", accesTocken, options)
        .cookies("refreshTocken", refreshTocken, options)
        .json(
            new ApIResponse(
                200,
                {
                    user: loggedInUser,
                    accesTocken,
                    refreshTocken
                },
                "user logged in sucessfully"
            ))

});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findById(
        req.user._id,
        {
            $set: {
                refreshTocken: undefined,
            }
        },
        {
            new: true // Return only updated new value
        } 
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessTocken", accesTocken, options)
    .clearCookie("refreshTocken", refreshTocken, options)
    .json(
        new ApIResponse(
            200,
            {},
            "user logged out sucessfully"
        ))

});


// Export controllers for use in routes
module.exports = { getTesting, postTesting, registerUser, loginUser, logOutUser };
