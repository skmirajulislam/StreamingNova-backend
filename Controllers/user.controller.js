const asyncHandler = require('../Utils/AsyncHandler');
const User = require('../Models/user.models');
const ApIError = require('../Utils/ApIError');
const uploadOnCloudinary = require('../Utils/cloudINary');
const ApIResponse =  require('../Utils/ApIResponse');


const getTesting = asyncHandler(async (req, res) => {
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



const registerUser = asyncHandler(async (req, res,) => {
    try {
        const { fullname, email, username, password } = req.body;

        if ([fullname, email, username, password].some((field) => field.trim() === "")) {
            throw new ApIError(400, 'All field is required');
        }

        const exstedUser = User.findOne({
            $or: [{ username }, { email }]
        });

        console.log(exstedUser);

        if(exstedUser){
            throw new ApIError(409, 'User with email already exist!');
        }

        const avaterLocalPath = req.files?.avater[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if(!avaterLocalPath){
            throw new Apierror(400, 'Avater file is required!')
        }

        const avater = await uploadOnCloudinary(avaterLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!avater){
            throw new ApIError(400, 'Avater file is required!')
        }

        const user = await User.create({
            fullname,
            avater: avater.url,
            coverImage: coverImage?.url || '',
            email,
            password,
            username: username.toLowerCase()
        });

        // remove password & refreshTocken from payload if user created
        const createdUser = await User.findById(user._id).select('-password -refreshTocken');

        if(!createdUser){
            throw new ApIError(500, 'Something went wrong when restarting the user!')
        }

        return res.status(201).json(
            new ApIResponse(200,createdUser,'User registered successfully!')
        )


    } catch (err) {
        console.log(err);
    }
});


module.exports = { getTesting, postTesting, registerUser };


