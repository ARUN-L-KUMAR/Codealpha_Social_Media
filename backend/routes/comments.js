const express = require('express');
const { body } = require('express-validator');
const {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getReplies
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createCommentValidation = [
  body('content')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content must be between 1 and 500 characters'),
  body('postId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid post ID is required')
];

const updateCommentValidation = [
  body('content')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content must be between 1 and 500 characters')
];

const createReplyValidation = [
  body('content')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reply content must be between 1 and 500 characters'),
  body('postId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid post ID is required'),
  body('parentCommentId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid parent comment ID is required')
];

// Routes
router.get('/post/:postId', optionalAuth, getComments);
router.get('/:id', optionalAuth, getComment);
router.get('/:id/replies', optionalAuth, getReplies);
router.post('/', protect, createCommentValidation, createComment);
router.post('/reply', protect, createReplyValidation, createComment);
router.put('/:id', protect, updateCommentValidation, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.delete('/:id/like', protect, unlikeComment);

module.exports = router;
