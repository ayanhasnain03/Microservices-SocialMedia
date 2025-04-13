const Media = require("../models/Media");
const uploadMediaToCloudinary = require("../utils/cloudinary");

const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");

  try {
    console.log(req.file, "req.filereq.file");

    if (!req.file) {
      logger.error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info("Uploading to Cloudinary starting...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(
      buffer,
      originalname
    );
    logger.info(
      `Cloudinary upload successful. Public Id: - ${cloudinaryUploadResult.public_id}`
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error creating media", error);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({ userId: req.user.userId });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cannot find any media for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (e) {
    logger.error("Error fetching medias", e);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};

module.exports = { uploadMedia, getAllMedias };
