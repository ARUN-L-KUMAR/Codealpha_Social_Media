import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { postsAPI, commentsAPI } from '../services/api';
import { PageLoader, ButtonLoader } from '../components/common/LoadingSpinner';
import { getDefaultAvatar } from '../utils/helpers';
import toast from 'react-hot-toast';

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingPost, setLikingPost] = useState(false);

  useEffect(() => {
    console.log('Post component mounted, postId:', postId);
    if (postId) {
      console.log('PostId exists, calling fetchPost');
      fetchPost();
      // Don't block post loading with comments
      setTimeout(() => {
        fetchComments();
      }, 100);
    } else {
      console.log('No postId found, setting loading to false');
      setLoading(false);
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      console.log('Fetching post with ID:', postId);
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const apiPromise = postsAPI.getPost(postId);
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('Post API response:', response);
      const postData = response.data?.post || response.post || response.data || response;
      console.log('Extracted post data:', postData);
      
      if (!postData || !postData._id) {
        throw new Error('Invalid post data received');
      }
      
      setPost(postData);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      // Don't navigate away immediately, show error state instead
      setPost(null);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await commentsAPI.getComments(postId);
      const commentsData = response.data?.comments || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Don't show error toast for comments, just log it
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (likingPost || !currentUser) return;

    try {
      setLikingPost(true);
      const isLiked = post.likes.includes(currentUser.id);
      
      if (isLiked) {
        await postsAPI.unlikePost(postId);
        setPost(prev => ({
          ...prev,
          likes: prev.likes.filter(id => id !== currentUser.id),
          likesCount: prev.likesCount - 1
        }));
      } else {
        await postsAPI.likePost(postId);
        setPost(prev => ({
          ...prev,
          likes: [...prev.likes, currentUser.id],
          likesCount: prev.likesCount + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setLikingPost(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment || !currentUser) return;

    try {
      setSubmittingComment(true);
      const response = await commentsAPI.createComment({
        content: newComment,
        postId: postId
      });
      const commentData = response.data?.comment || response.comment || response.data || response;
      setComments(prev => [commentData, ...prev]);
      setNewComment('');
      setPost(prev => ({
        ...prev,
        commentsCount: prev.commentsCount + 1
      }));
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      setPost(prev => ({
        ...prev,
        commentsCount: prev.commentsCount - 1
      }));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <PageLoader />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The post you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isLiked = currentUser && post.likes.includes(currentUser.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-20">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back</span>
        </button>

        {/* Post Card */}
        <div className="card mb-6">
          {/* Post Header */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={post.author.profilePicture || getDefaultAvatar(48)}
              alt={post.author.fullName}
              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => navigate(`/profile/${post.author._id}`)}
            />
            <div className="flex-1">
              <h3 
                className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => navigate(`/profile/${post.author._id}`)}
              >
                {post.author.fullName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                @{post.author.username} • {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-lg leading-relaxed">
              {post.content}
            </p>
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

          {/* Post Meta */}
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            {formatDate(post.createdAt)}
          </div>

          {/* Post Stats */}
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <span>{post.likesCount} likes</span>
            <span>{post.commentsCount} comments</span>
            <span>{post.sharesCount || 0} shares</span>
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-around">
            <button
              onClick={handleLike}
              disabled={likingPost || !currentUser}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <svg className={`w-5 h-5 ${likingPost ? 'animate-pulse' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Like</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Comment</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Add Comment */}
        {currentUser && (
          <div className="card mb-6">
            <form onSubmit={handleComment}>
              <div className="flex space-x-3">
                <img
                  src={currentUser.profilePicture || getDefaultAvatar(40)}
                  alt={currentUser.fullName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows={3}
                    disabled={submittingComment}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {submittingComment && <ButtonLoader />}
                      <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Comments Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Comments ({post.commentsCount})
          </h3>

          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-3">
                  <img
                    src={comment.author.profilePicture || getDefaultAvatar(40)}
                    alt={comment.author.fullName}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => navigate(`/profile/${comment.author._id}`)}
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 
                          className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => navigate(`/profile/${comment.author._id}`)}
                        >
                          {comment.author.fullName}
                        </h4>
                        {currentUser && comment.author._id === currentUser.id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(comment.createdAt)}</span>
                      <button className="hover:text-blue-500 transition-colors">Like</button>
                      <button className="hover:text-blue-500 transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No comments yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to comment on this post!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;
