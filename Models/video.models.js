const mongoose = require('mongoose');
const aggrigatePaginate = require('mongoose-aggregate-paginate-v2');

const videoSchema = mongoose.Schema(
    {
        videofile: {
            type: String, // cloudinary url
            required: true
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        discription: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // cloudinary response
            required: true
        },
        views: {
            type: Number,
            default: 0,
            required: true
        },
        ispublished: {
            type: Boolean,
            default: true,
            required: true
        }
    },
    {
        timestamps: true
    }
);

videoSchema.plugin(aggrigatePaginate)

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;

