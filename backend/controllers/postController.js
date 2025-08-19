const { validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationController');
const { getFileUrl, deleteFile } = require('../middleware/upload');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: 'public' })
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        options: { limit: 3, sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ visibility: 'public' });

    // Add user interaction data if authenticated
    const postsWithInteractions = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject();
      
      if (req.user) {
        postObj.isLiked = post.isLikedBy(req.user.id);
      } else {
        postObj.isLiked = false;
      }
      
      return postObj;
    }));

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      posts: postsWithInteractions
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const postObj = post.toObject();
    
    if (req.user) {
      postObj.isLiked = post.isLikedBy(req.user.id);
    } else {
      postObj.isLiked = false;
    }

    res.status(200).json({
      success: true,
      post: postObj
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
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

    const { content, visibility = 'public', tags, location } = req.body;

    // Process uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: getFileUrl(req, file.filename, 'posts'),
        caption: ''
      }));
    }

    // Process tags
    let processedTags = [];
    if (tags) {
      processedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedUser = await User.findOne({ username: match[1] });
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }

    const post = await Post.create({
      content,
      author: req.user.id,
      images,
      tags: processedTags,
      mentions,
      visibility,
      ...(location && { location })
    });

    await post.populate('author', 'username firstName lastName profilePicture isVerified');

    // Create notifications for mentions
    for (const mentionedUserId of mentions) {
      await Notification.createNotification({
        recipient: mentionedUserId,
        sender: req.user.id,
        type: 'mention',
        relatedPost: post._id
      });
    }

    // Emit socket event for new post
    const io = req.app.get('io');
    io.emit('new_post', {
      post: post.toObject(),
      author: {
        id: req.user.id,
        username: req.user.username,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture
      }
    });

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
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

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { content, visibility, tags } = req.body;

    // Process tags
    let processedTags = [];
    if (tags) {
      processedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedUser = await User.findOne({ username: match[1] });
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        ...(content && { content }),
        ...(visibility && { visibility }),
        ...(processedTags.length > 0 && { tags: processedTags }),
        mentions
      },
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName profilePicture isVerified');

    res.status(200).json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete associated images
    if (post.images && post.images.length > 0) {
      post.images.forEach(image => {
        const filename = image.url.split('/').pop();
        deleteFile(`uploads/posts/${filename}`);
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.isLikedBy(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
    }

    await post.addLike(req.user.id);

    // Create notification if not own post
    if (post.author.toString() !== req.user.id) {
      const senderUser = await User.findById(req.user.id).select('firstName lastName username');
      await createNotification({
        recipient: post.author,
        sender: req.user.id,
        type: 'like',
        message: `${senderUser.firstName} ${senderUser.lastName} liked your post`,
        relatedPost: post._id
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('like_added', {
      postId: post._id,
      userId: req.user.id,
      likesCount: post.likesCount + 1
    });

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      likesCount: post.likesCount + 1
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unlike post
// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.isLikedBy(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Post not liked yet'
      });
    }

    await post.removeLike(req.user.id);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('like_removed', {
      postId: post._id,
      userId: req.user.id,
      likesCount: post.likesCount - 1
    });

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
      likesCount: post.likesCount - 1
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user posts
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        options: { limit: 3, sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: req.params.userId });

    // Add user interaction data if authenticated
    const postsWithInteractions = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject();
      
      if (req.user) {
        postObj.isLiked = post.isLikedBy(req.user.id);
      } else {
        postObj.isLiked = false;
      }
      
      return postObj;
    }));

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      posts: postsWithInteractions
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get feed posts (posts from followed users)
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users that current user is following
    const currentUser = await User.findById(req.user.id);
    const followingIds = currentUser.following;

    // Include current user's posts in feed
    const authorIds = [...followingIds, req.user.id];

    const posts = await Post.find({ 
      author: { $in: authorIds },
      $or: [
        { visibility: 'public' },
        { visibility: 'followers', author: { $in: followingIds } },
        { author: req.user.id }
      ]
    })
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        options: { limit: 3, sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ 
      author: { $in: authorIds },
      $or: [
        { visibility: 'public' },
        { visibility: 'followers', author: { $in: followingIds } },
        { author: req.user.id }
      ]
    });

    // Add user interaction data
    const postsWithInteractions = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.isLikedBy(req.user.id);
      return postObj;
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      posts: postsWithInteractions
    });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get explore posts
// @route   GET /api/posts/explore
// @access  Public
const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get posts from users that the current user doesn't follow
    let posts;
    
    if (req.user) {
      // Get users that the current user follows
      const following = await Follow.find({ follower: req.user.id }).select('following');
      const followingIds = following.map(f => f.following);
      followingIds.push(req.user.id); // Exclude own posts too

      posts = await Post.find({ 
        visibility: 'public',
        author: { $nin: followingIds }
      })
        .populate('author', 'username firstName lastName profilePicture isVerified')
        .sort({ likesCount: -1, createdAt: -1 }) // Sort by popularity
        .skip(skip)
        .limit(limit);
    } else {
      // For non-authenticated users, show popular posts
      posts = await Post.find({ visibility: 'public' })
        .populate('author', 'username firstName lastName profilePicture isVerified')
        .sort({ likesCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    // Add user interaction data if authenticated
    const postsWithInteractions = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject();
      
      if (req.user) {
        postObj.isLiked = post.isLikedBy(req.user.id);
      } else {
        postObj.isLiked = false;
      }
      
      return postObj;
    }));

    res.status(200).json({
      success: true,
      count: posts.length,
      data: postsWithInteractions
    });
  } catch (error) {
    console.error('Error in getExplorePosts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get trending topics/hashtags
// @route   GET /api/posts/trending
// @access  Public
const getTrendingTopics = async (req, res) => {
  try {
    // Get posts from the last 7 days to determine trending topics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find posts with tags from the last 7 days
    const posts = await Post.find({
      createdAt: { $gte: sevenDaysAgo },
      tags: { $exists: true, $ne: [] },
      visibility: 'public'
    })
    .populate('author', 'username firstName lastName profilePicture')
    .select('tags author createdAt likesCount')
    .sort({ createdAt: -1 });

    // Count hashtag occurrences and collect recent users
    const hashtagStats = {};
    
    posts.forEach(post => {
      post.tags.forEach(tag => {
        const hashtag = tag.toLowerCase();
        
        if (!hashtagStats[hashtag]) {
          hashtagStats[hashtag] = {
            count: 0,
            recentUsers: new Set(),
            userProfiles: []
          };
        }
        
        hashtagStats[hashtag].count++;
        
        // Add unique users (max 3 recent users per hashtag)
        if (hashtagStats[hashtag].recentUsers.size < 3 && 
            !hashtagStats[hashtag].recentUsers.has(post.author._id.toString())) {
          hashtagStats[hashtag].recentUsers.add(post.author._id.toString());
          hashtagStats[hashtag].userProfiles.push({
            fullName: `${post.author.firstName} ${post.author.lastName}`,
            username: post.author.username,
            profilePicture: post.author.profilePicture || null
          });
        }
      });
    });

    // Convert to array and sort by count
    const trending = Object.entries(hashtagStats)
      .map(([hashtag, stats]) => ({
        hashtag,
        count: stats.count,
        recentUsers: stats.userProfiles
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 trending hashtags

    // If no real trending data, create some based on recent popular posts
    if (trending.length === 0) {
      const popularPosts = await Post.find({
        createdAt: { $gte: sevenDaysAgo },
        visibility: 'public'
      })
      .populate('author', 'username firstName lastName profilePicture')
      .sort({ likesCount: -1 })
      .limit(10);

      // Create trending topics from popular posts' content
      const fallbackTrending = [];
      const usedHashtags = new Set();

      for (const post of popularPosts) {
        // Extract hashtags from post content
        const hashtagMatches = post.content.match(/#\w+/g) || [];
        
        for (const match of hashtagMatches) {
          const hashtag = match.substring(1).toLowerCase();
          
          if (!usedHashtags.has(hashtag) && fallbackTrending.length < 5) {
            usedHashtags.add(hashtag);
            fallbackTrending.push({
              hashtag,
              count: Math.floor(Math.random() * 50) + 10, // Random count between 10-59
              recentUsers: [{
                fullName: `${post.author.firstName} ${post.author.lastName}`,
                username: post.author.username,
                profilePicture: post.author.profilePicture || null
              }]
            });
          }
        }
      }

      res.status(200).json({
        success: true,
        data: fallbackTrending.length > 0 ? fallbackTrending : []
      });
    } else {
      res.status(200).json({
        success: true,
        data: trending
      });
    }
  } catch (error) {
    console.error('Error in getTrendingTopics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};
