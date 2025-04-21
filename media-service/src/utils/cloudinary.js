const cloudinary = require("cloudinary").v2;
const logger = require("./logger");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/**
 * Uploads a media file to Cloudinary
 * @param {Object} file - File object from multer (with buffer, originalname)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      const errorMessage = "No file or buffer found in the request.";
      logger.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: `media/${Date.now()}-${file.originalname}`,
      },
      (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error", {
            error: error.message,
            fileName: file.originalname,
          });
          return reject(new Error("Cloudinary upload failed."));
        }

        logger.info(`File uploaded successfully: ${result.public_id}`);
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Deletes a file from Cloudinary by its public ID
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} Cloudinary destroy result
 */
const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info("Media deleted successfully from cloud storage", { publicId });
    return result;
  } catch (error) {
    logger.error("Error deleting media from Cloudinary", {
      publicId,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
};
