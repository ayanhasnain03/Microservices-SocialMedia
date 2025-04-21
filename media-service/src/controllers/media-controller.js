const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

/**
 * Upload media file to Cloudinary and save details to the database
 */
const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");

  try {
    // Check if file is provided in the request
    if (!req.file) {
      logger.error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    // Destructure file data from request
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId; // Assuming req.user is populated by authentication middleware

    logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info("Uploading to Cloudinary starting...");

    // Upload to Cloudinary
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successful. Public ID: ${cloudinaryUploadResult.public_id}`
    );

    // Create media document in the database
    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    // Save media details to the database
    await newlyCreatedMedia.save();

    // Respond with the uploaded media details
    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error during media upload", error);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

/**
 * Get all media files uploaded by a specific user
 */
const getAllMedias = async (req, res) => {
  try {
    // Fetch media by userId from the database
    const result = await Media.find({ userId: req.user.userId });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No media found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching medias", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};

module.exports = { uploadMedia, getAllMedias };
