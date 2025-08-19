const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  getUserByUsername,
  updateProfile,
  uploadProfilePicture,
  uploadCoverPicture,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
];

// Routes
router.get('/', optionalAuth, getUsers);
router.get('/search', optionalAuth, searchUsers);
router.get('/suggested', protect, getSuggestedUsers);
router.get('/profile/:username', optionalAuth, getUserByUsername);
router.get('/:id', optionalAuth, getUser);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.post('/upload/profile', protect, upload.single('profilePicture'), uploadProfilePicture);
router.post('/upload/cover', protect, upload.single('coverPicture'), uploadCoverPicture);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);

module.exports = router;
