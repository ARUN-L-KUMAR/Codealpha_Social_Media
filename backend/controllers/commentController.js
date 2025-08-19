const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationController');

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
const getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ 
      post: req.params.postId,
      parentComment: null,
      isDeleted: false
    })
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        match: { isDeleted: false },
        options: { limit: 3, sort: { createdAt: 1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ 
      post: req.params.postId,
      parentComment: null,
      isDeleted: false
    });

    // Add user interaction data if authenticated
    const commentsWithInteractions = comments.map(comment => {
      const commentObj = comment.toObject();
      
      if (req.user) {
        commentObj.isLiked = comment.isLikedBy(req.user.id);
      } else {
        commentObj.isLiked = false;
      }
      
      return commentObj;
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      comments: commentsWithInteractions
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single comment
// @route   GET /api/comments/:id
// @access  Public
const getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username firstName lastName profilePicture'
        },
        match: { isDeleted: false },
        options: { sort: { createdAt: 1 } }
      });

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const commentObj = comment.toObject();
    
    if (req.user) {
      commentObj.isLiked = comment.isLikedBy(req.user.id);
    } else {
      commentObj.isLiked = false;
    }

    res.status(200).json({
      success: true,
      comment: commentObj
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new comment or reply
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
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

    const { content, postId, parentCommentId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // If it's a reply, check if parent comment exists
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
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

    const comment = await Comment.create({
      content,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null,
      mentions
    });

    await comment.populate('author', 'username firstName lastName profilePicture isVerified');

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentComment) {
      await parentComment.addReply(comment._id);
    }

    // Create notification for post author (if not commenting on own post)
    if (post.author.toString() !== req.user.id) {
      const senderUser = await User.findById(req.user.id).select('firstName lastName username');
      await createNotification({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        message: `${senderUser.firstName} ${senderUser.lastName} commented on your post`,
        relatedPost: post._id,
        relatedComment: comment._id
      });
    }

    // Create notifications for mentions
    for (const mentionedUserId of mentions) {
      if (mentionedUserId.toString() !== req.user.id) {
        const senderUser = await User.findById(req.user.id).select('firstName lastName username');
        await createNotification({
          recipient: mentionedUserId,
          sender: req.user.id,
          type: 'mention',
          message: `${senderUser.firstName} ${senderUser.lastName} mentioned you in a comment`,
          relatedPost: post._id,
          relatedComment: comment._id
        });
      }
    }

    // Emit socket event for real-time comment
    const io = req.app.get('io');
    io.emit('comment_added', {
      comment: comment.toObject(),
      postId: post._id,
      parentCommentId: parentCommentId
    });

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
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

    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    const { content } = req.body;

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

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content, mentions },
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName profilePicture isVerified');

    res.status(200).json({
      success: true,
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete the comment
    await comment.softDelete();

    // Remove comment from post
    const post = await Post.findById(comment.post);
    if (post) {
      await post.removeComment(comment._id);
    }

    // If it's a reply, remove from parent comment
    if (comment.parentComment) {
      const parentComment = await Comment.findById(comment.parentComment);
      if (parentComment) {
        await parentComment.removeReply(comment._id);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like comment
// @route   POST /api/comments/:id/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.isLikedBy(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Comment already liked'
      });
    }

    await comment.addLike(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      likesCount: comment.likesCount + 1
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unlike comment
// @route   DELETE /api/comments/:id/like
// @access  Private
const unlikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (!comment.isLikedBy(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Comment not liked yet'
      });
    }

    await comment.removeLike(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Comment unliked successfully',
      likesCount: comment.likesCount - 1
    });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get replies for a comment
// @route   GET /api/comments/:id/replies
// @access  Public
const getReplies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const replies = await Comment.find({ 
      parentComment: req.params.id,
      isDeleted: false
    })
      .populate('author', 'username firstName lastName profilePicture isVerified')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ 
      parentComment: req.params.id,
      isDeleted: false
    });

    // Add user interaction data if authenticated
    const repliesWithInteractions = replies.map(reply => {
      const replyObj = reply.toObject();
      
      if (req.user) {
        replyObj.isLiked = reply.isLikedBy(req.user.id);
      } else {
        replyObj.isLiked = false;
      }
      
      return replyObj;
    });

    res.status(200).json({
      success: true,
      count: replies.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      replies: repliesWithInteractions
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getReplies
};
