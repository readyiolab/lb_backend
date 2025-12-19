const cloudinary = require('cloudinary').v2;
const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = require('./dotenvConfig');

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret
});

const uploadToCloudinary = async (file, folder = 'lb-blog') => {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };