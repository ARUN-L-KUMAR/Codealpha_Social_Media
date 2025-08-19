const express = require('express');
const { body } = require('express-validator');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts,
  getFeedPosts,
  getExplorePosts,
  getTrendingTopics
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const createPostValidation = [
  body('content')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters')
];

const updatePostValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Post content must be between 1 and 2000 characters')
];

// Routes
router.get('/', optionalAuth, getPosts);
router.get('/feed', protect, getFeedPosts);
router.get('/explore', optionalAuth, getExplorePosts);
router.get('/trending', getTrendingTopics);
router.get('/user/:userId', optionalAuth, getUserPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', protect, upload.array('images', 5), createPostValidation, createPost);
router.put('/:id', protect, updatePostValidation, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.delete('/:id/like', protect, unlikePost);

module.exports = router;
