import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffTime = now - postDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await postsAPI.unlikePost(post._id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await postsAPI.likePost(post._id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to update like');
      console.error('Like error:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getComments(post._id, { limit: 20 });
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Load comments error:', error);
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await commentsAPI.createComment({
        content: newComment,
        post: post._id
      });
      
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Comment error:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(post._id);
        if (onDelete) onDelete(post._id);
        toast.success('Post deleted');
      } catch (error) {
        toast.error('Failed to delete post');
        console.error('Delete error:', error);
      }
    }
  };

  const truncatedContent = post.content?.length > 200 
    ? post.content.substring(0, 200) + '...' 
    : post.content;

  return (
    <div className="card card-hover p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in bg-gradient-to-br from-white to-gray-50">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author?.username}`}>
            <Avatar
              user={post.author}
              size="lg"
              className="hover:scale-105 transition-transform duration-200"
            />
          </Link>
          <div>
            <Link 
              to={`/profile/${post.author?.username}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {post.author?.name}
            </Link>
            <p className="text-sm text-gray-500">
              @{post.author?.username} • {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Post Menu */}
        {user?._id === post.author?._id && (
          <div className="relative group">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleDeletePost}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {showFullContent ? post.content : truncatedContent}
        </p>
        {post.content?.length > 200 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
          >
            {showFullContent ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className={`mb-4 ${post.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
          {post.images.map((image, index) => (
            <div key={index} className="relative overflow-hidden rounded-lg">
              <img
                src={image}
                alt={`Content ${index + 1}`}
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleShowComments}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-medium">{post.commentsCount || 0}</span>
          </button>

          {/* Share Button */}
          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>

        {/* View Post Link */}
        <Link
          to={`/post/${post._id}`}
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          View post
        </Link>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex space-x-3">
              <Avatar
                user={user}
                size="md"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isSubmittingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <Link to={`/profile/${comment.author?.username}`}>
                  <Avatar
                    user={comment.author}
                    size="md"
                    className="hover:scale-105 transition-transform duration-200"
                  />
                </Link>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link
                        to={`/profile/${comment.author?.username}`}
                        className="font-semibold text-sm text-gray-900 hover:text-blue-600"
                      >
                        {comment.author?.name}
                      </Link>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
