const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,

        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary Service
            required: true
        },
        coverImage: {
            type: String, // cloudinary Service
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video',
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is Required!']
        },
        refreshTocken: {
            type: String,
        }
    },
    {
        timestamps: true
    }
);

/* This middleware execute before we saved the data in MongoDb And encrypt it Password */
userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

/* Creating on methods in mongoose For checking password is correct or not */
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}


/* JWT authorization uses a JWT to represent the user's identity and access rights */
/* for generating access tocken using jwt */
userSchema.methods.generateAccessTocken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACESS_TOCKEN_SECRET,
        {
            expiresIn: process.env.ACESS_TOCKEN_EXPIRY
        }
    )
}

/* for generating Refresh tocken using jwt */
userSchema.methods.generateRefreshTocken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOCKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOCKEN_EXPIRY
        }
    )
}

const User = mongoose.model('User', userSchema);
module.exports = User;