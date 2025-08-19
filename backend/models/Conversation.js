const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  groupImage: {
    type: String
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

// Virtual for messages count
conversationSchema.virtual('messagesCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
  count: true
});

// Method to get unread count for a specific user
conversationSchema.methods.getUnreadCount = function(userId) {
  const userUnread = this.unreadCounts.find(uc => uc.user.toString() === userId.toString());
  return userUnread ? userUnread.count : 0;
};

// Method to reset unread count for a specific user
conversationSchema.methods.resetUnreadCount = function(userId) {
  const userUnreadIndex = this.unreadCounts.findIndex(uc => uc.user.toString() === userId.toString());
  if (userUnreadIndex !== -1) {
    this.unreadCounts[userUnreadIndex].count = 0;
  }
  return this.save();
};

// Method to increment unread count for participants (except sender)
conversationSchema.methods.incrementUnreadCount = function(senderId) {
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const userUnreadIndex = this.unreadCounts.findIndex(uc => uc.user.toString() === participantId.toString());
      if (userUnreadIndex !== -1) {
        this.unreadCounts[userUnreadIndex].count += 1;
      } else {
        this.unreadCounts.push({ user: participantId, count: 1 });
      }
    }
  });
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
