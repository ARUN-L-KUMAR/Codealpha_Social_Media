const { validationResult } = require('express-validator');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationController');
const { deleteFile, getFileUrl } = require('../middleware/upload');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('followers', 'username firstName lastName profilePicture')
      .populate('following', 'username firstName lastName profilePicture');

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username firstName lastName profilePicture')
      .populate('following', 'username firstName lastName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ author: user._id });

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      isFollowing = await Follow.isFollowing(req.user.id, user._id);
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        postsCount,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, bio, username, isPrivate } = req.body;

    // Check if username is already taken (if being updated)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(username && { username }),
        ...(isPrivate !== undefined && { isPrivate })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/upload/profile
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const user = await User.findById(req.user.id);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldFilename = user.profilePicture.split('/').pop();
      deleteFile(`uploads/profiles/${oldFilename}`);
    }

    // Update user with new profile picture
    const profilePictureUrl = getFileUrl(req, req.file.filename, 'profiles');
    user.profilePicture = profilePictureUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload cover picture
// @route   POST /api/users/upload/cover
// @access  Private
const uploadCoverPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const user = await User.findById(req.user.id);

    // Delete old cover picture if exists
    if (user.coverPicture) {
      const oldFilename = user.coverPicture.split('/').pop();
      deleteFile(`uploads/profiles/${oldFilename}`);
    }

    // Update user with new cover picture
    const coverPictureUrl = getFileUrl(req, req.file.filename, 'profiles');
    user.coverPicture = coverPictureUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cover picture uploaded successfully',
      coverPicture: coverPictureUrl
    });
  } catch (error) {
    console.error('Upload cover picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Follow user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: req.params.id
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user'
      });
    }

    // Create follow relationship
    await Follow.create({
      follower: req.user.id,
      following: req.params.id
    });

    // Update user documents
    await User.findByIdAndUpdate(req.user.id, {
      $push: { following: req.params.id }
    });

    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.user.id }
    });

    // Create notification
    const senderUser = await User.findById(req.user.id).select('firstName lastName username');
    await createNotification({
      recipient: req.params.id,
      sender: req.user.id,
      type: 'follow',
      message: `${senderUser.firstName} ${senderUser.lastName} started following you`
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(req.params.id).emit('new_follower', {
      follower: {
        id: req.user.id,
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture
      }
    });

    res.status(200).json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/:id/follow
// @access  Private
const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove follow relationship
    await Follow.findOneAndDelete({
      follower: req.user.id,
      following: req.params.id
    });

    // Update user documents
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: req.params.id }
    });

    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.id }
    });

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
const getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const followers = await Follow.find({ following: req.params.id })
      .populate('follower', 'username firstName lastName profilePicture bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Follow.countDocuments({ following: req.params.id });

    res.status(200).json({
      success: true,
      count: followers.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      followers: followers.map(f => f.follower)
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
const getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const following = await Follow.find({ follower: req.params.id })
      .populate('following', 'username firstName lastName profilePicture bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Follow.countDocuments({ follower: req.params.id });

    res.status(200).json({
      success: true,
      count: following.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      following: following.map(f => f.following)
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { bio: searchRegex }
      ]
    })
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
const getSuggestedUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Get users that current user is not following
    const currentUser = await User.findById(req.user.id);
    const followingIds = currentUser.following;

    const suggestedUsers = await User.find({
      _id: { 
        $nin: [...followingIds, req.user.id] 
      }
    })
    .select('-password')
    .sort({ followersCount: -1, createdAt: -1 })
    .limit(limit);

    res.status(200).json({
      success: true,
      count: suggestedUsers.length,
      users: suggestedUsers
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by username
// @route   GET /api/users/profile/:username
// @access  Public
const getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username firstName lastName profilePicture')
      .populate('following', 'username firstName lastName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ author: user._id });

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      isFollowing = await Follow.isFollowing(req.user.id, user._id);
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        postsCount,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};
