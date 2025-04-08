const Post = require("../models/Post");
const logger = require("../utils/logger");

const createPost = async (req, res) => {
  try {
    const { content, mediaIds } = req.body;

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    res.status(201).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by id",
    });
  }
};
const getAllPosts = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by id",
    });
  }
};
const getPost = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by id",
    });
  }
};
const deletePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error delete post", error);
    res.status(500).json({
      success: false,
      message: "Error delete post by id",
    });
  }
};

module.exports = { createPost, getAllPosts, deletePost, getPost };
