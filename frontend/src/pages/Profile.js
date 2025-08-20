import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usersAPI, postsAPI } from '../services/api';
import PostCard from '../components/common/PostCard';
import Avatar from '../components/common/Avatar';
import { PageLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams(); // Changed from userId to username
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = !username || username === currentUser?.username;
  const profileIdentifier = username || currentUser?.username || currentUser?.id;
  
  // Add refs to track ongoing requests
  const userDataAbortController = useRef(null);
  const postsAbortController = useRef(null);

  useEffect(() => {
    if (profileIdentifier) {
      fetchUserData();
    }
    
    // Cleanup function to cancel requests
    return () => {
      if (userDataAbortController.current) {
        userDataAbortController.current.abort();
      }
    };
  }, [profileIdentifier]);

  // Fetch posts when user data is available
  useEffect(() => {
    if (user?._id || (isOwnProfile && currentUser?.id)) {
      fetchUserPosts();
    }
    
    // Cleanup function to cancel requests
    return () => {
      if (postsAbortController.current) {
        postsAbortController.current.abort();
      }
    };
  }, [user, isOwnProfile, currentUser?.id]);

  const fetchUserData = async () => {
    try {
      // Cancel any ongoing request
      if (userDataAbortController.current) {
        userDataAbortController.current.abort();
      }
      
      // Create new AbortController
      userDataAbortController.current = new AbortController();
      
      setLoading(true);
      console.log('Fetching user data for:', profileIdentifier);
      console.log('API base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      const startTime = Date.now();
      const response = await usersAPI.getProfile(profileIdentifier);
      const endTime = Date.now();
      console.log(`API call took ${endTime - startTime}ms`);
      
      const userData = response.data?.user || response.user || response.data || response;
      console.log('Profile user data:', userData);
      setUser(userData);
      setFollowersCount(userData.followersCount || 0);
      setFollowingCount(userData.followingCount || 0);
      setPostsCount(userData.postsCount || 0);
      
      if (!isOwnProfile && currentUser) {
        setFollowing(userData.isFollowing || false);
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('Error fetching user data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        config: error.config
      });
      if (error.response?.status === 404) {
        toast.error('User not found');
        // If looking for own profile by ID failed, try navigating to username-based profile
        if (isOwnProfile && currentUser?.username && username !== currentUser.username) {
          navigate(`/profile/${currentUser.username}`, { replace: true });
          return;
        }
        navigate('/404', { replace: true });
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      // Cancel any ongoing request
      if (postsAbortController.current) {
        postsAbortController.current.abort();
      }
      
      // Create new AbortController
      postsAbortController.current = new AbortController();
      
      setPostsLoading(true);
      // Need to use user ID for posts, so get it from user data first
      const userToFetch = user?._id || (isOwnProfile ? currentUser?.id : null);
      if (userToFetch) {
        const response = await postsAPI.getUserPosts(userToFetch);
        console.log('User posts response:', response);
        // Handle different response structures
        const userPosts = response.data?.posts || response.posts || response.data || response;
        setPosts(Array.isArray(userPosts) ? userPosts : []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Posts request was cancelled');
        return;
      }
      
      console.error('Error fetching user posts:', error);
      setPosts([]);
      toast.error('Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const userId = user?._id;
      if (!userId) {
        toast.error('User not found');
        return;
      }
      
      if (following) {
        await usersAPI.unfollowUser(userId);
        setFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success('Unfollowed successfully');
      } else {
        await usersAPI.followUser(userId);
        setFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleMessage = () => {
    const userId = user?._id || user?.id;
    if (userId) {
      navigate(`/messages/${userId}`);
    } else {
      toast.error('Unable to start conversation');
    }
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto pt-20 px-4">
          <PageLoader />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The profile you're looking for doesn't exist.</p>
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

  const tabs = [
    { id: 'posts', label: 'Posts', count: postsCount },
    { id: 'media', label: 'Media', count: Array.isArray(posts) ? posts.filter(post => post.images?.length > 0).length : 0 },
    { id: 'likes', label: 'Likes', count: 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-4xl mx-auto pt-20 px-4">
        {/* Glassmorphism Card */}
        <div className="relative mb-6">
          <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 shadow-xl">
            {user.coverPhoto ? (
              <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                <div className="text-white/20 text-6xl">
                  <svg fill="currentColor" viewBox="0 0 20 20" className="w-20 h-20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-6">
            <div className="relative">
              <Avatar
                user={user}
                size="3xl"
                showOnlineStatus={true}
                className="border-4 border-white dark:border-gray-800 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="mb-8 pt-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.fullName}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-1">@{user.username}</p>
              {user.bio && <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">{user.bio}</p>}
              {/* Stats */}
              <div className="flex space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{postsCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{followersCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{followingCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                </div>
              </div>
              {/* Additional Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {user.location && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {user.location}
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {user.joinedAt && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Joined {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6 md:mt-0">
              {isOwnProfile ? (
                <button onClick={handleEditProfile} className="btn-secondary flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button onClick={handleFollow} className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${following ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600' : 'btn-primary'}`}>{following ? 'Following' : 'Follow'}</button>
                  <button onClick={handleMessage} className="btn-secondary flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Message</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                {tab.label}
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-1 px-2 rounded-full text-xs">{tab.count}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="pb-20">
          {activeTab === 'posts' && (
            <div>
              {postsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                      <div className="h-40 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(posts) && posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{isOwnProfile ? "Share your thoughts and connect with others!" : "When this user posts something, it will appear here."}</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'media' && (
            <div>
              {Array.isArray(posts) && posts.filter(post => post.images?.length > 0).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {posts.filter(post => post.images?.length > 0).flatMap(post => post.images).map((image, index) => {
                    // Ensure image is a valid string URL
                    const imageUrl = typeof image === 'string' ? image : (image?.url || '');
                    if (!imageUrl) return null;
                    
                    return (
                      <div key={index} className="aspect-square overflow-hidden rounded-lg shadow">
                        <img 
                          src={imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No media</h3>
                  <p className="text-gray-600 dark:text-gray-400">Photos and videos will appear here.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'likes' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Liked posts</h3>
              <p className="text-gray-600 dark:text-gray-400">Posts you've liked will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
