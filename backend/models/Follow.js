const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'accepted'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for better performance
followSchema.index({ follower: 1, createdAt: -1 });
followSchema.index({ following: 1, createdAt: -1 });
followSchema.index({ status: 1 });

// Prevent users from following themselves
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error('Users cannot follow themselves');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

// Static method to check if user is following another user
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId,
    status: 'accepted'
  });
  return !!follow;
};

// Static method to get followers count
followSchema.statics.getFollowersCount = async function(userId) {
  return await this.countDocuments({
    following: userId,
    status: 'accepted'
  });
};

// Static method to get following count
followSchema.statics.getFollowingCount = async function(userId) {
  return await this.countDocuments({
    follower: userId,
    status: 'accepted'
  });
};

// Static method to get mutual followers
followSchema.statics.getMutualFollowers = async function(userId1, userId2) {
  const user1Followers = await this.find({
    following: userId1,
    status: 'accepted'
  }).select('follower');

  const user2Followers = await this.find({
    following: userId2,
    status: 'accepted'
  }).select('follower');

  const user1FollowerIds = user1Followers.map(f => f.follower.toString());
  const user2FollowerIds = user2Followers.map(f => f.follower.toString());

  const mutualFollowerIds = user1FollowerIds.filter(id => user2FollowerIds.includes(id));
  
  return mutualFollowerIds;
};

module.exports = mongoose.model('Follow', followSchema);
