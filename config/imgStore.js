const cloudinary = require('cloudinary')
if (!process.env.CLOUDINARY_URL) {
    var { cloudConfig } = require('../.env')
} else {
    var cloudConfig = {
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET 
    }
}

cloudinary.config(cloudConfig);