const cloudinary = require('cloudinary').v2;
require('dotenv').config()
const fs = require('fs');

async function uploadOnCloudinary(localFilepath) {

    try {

        if (!localFilepath) {
            return null;
        }

        // Configuration
        cloudinary.config({
            cloud_name: process.env.CLOUDNAME,
            api_key: process.env.API_KEY_CLOUDINARY,
            api_secret: process.env.CLOUDINARY_SECRET // Click 'View Credentials' below to copy your API secret
        });

        // Upload an image
        const uploadResult = await cloudinary.uploader
            .upload(localFilepath, {
                resource_type: 'auto',
            })
            .catch((error) => {
                console.log(error);
            });

        console.log(`${uploadResult.url} is Uploded in Cloudinary!`);

        fs.unlinkSync(localFilepath);
        return uploadResult;

    } catch (err) {
        fs.unlinkSync(localFilepath) // remove the locally saved temporary file as the upload operation got failed.
        console.log(`Cloudinary Error : ${err}`);
    }
}


const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Image deleted:', result);
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};


module.exports = {
    uploadOnCloudinary,
    deleteImage
};