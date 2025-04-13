const cloudinary = require("cloudinary").v2;
const logger = require("./logger");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      const errorMessage = "No file or buffer found in the request.";
      logger.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    // Ensure the buffer is a proper Node.js Buffer if it's an ArrayBuffer
    const fileBuffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: `media/${file.originalname}`,
      },
      (error, result) => {
        if (error) {
          logger.error("Error while uploading media to Cloudinary", {
            error: error.message,
            stack: error.stack,
            fileName: file.originalname,
          });
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          logger.info(
            `File uploaded to Cloudinary successfully. Public ID: ${result.public_id}`
          );
          resolve(result);
        }
      }
    );

    uploadStream.on("error", (streamError) => {
      logger.error("Stream error while uploading media to Cloudinary", {
        error: streamError.message,
        fileName: file.originalname,
      });
      reject(new Error(`Stream upload failed: ${streamError.message}`));
    });

    // Pass the correct buffer to the upload stream
    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadMediaToCloudinary;
