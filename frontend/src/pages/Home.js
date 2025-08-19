import React, { useState, useEffect } from 'react';
import { postsAPI, usersAPI } from '../services/api';
import CreatePost from '../components/common/CreatePost';
import PostCard from '../components/common/PostCard';
import UserCard from '../components/common/UserCard';
import Avatar from '../components/common/Avatar';
import LoadingSpinner, { CardSkeleton, UserCardSkeleton } from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import InfiniteScroll from 'react-infinite-scroll-component';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadFeedPosts();
    loadSuggestedUsers();
  }, []);

  const loadFeedPosts = async (pageNum = 1, isRefresh = false) => {
    try {
      const response = await postsAPI.getFeedPosts({ 
        page: pageNum, 
        limit: 10,
        sort: '-createdAt'
      });
      
      const newPosts = response.data.posts || [];
      
      if (isRefresh || pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 10);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Load feed error:', error);
      // If feed fails, try loading all posts
      try {
        const fallbackResponse = await postsAPI.getPosts({ 
          page: pageNum, 
          limit: 10,
          sort: '-createdAt'
        });
        const newPosts = fallbackResponse.data.posts || [];
        
        if (isRefresh || pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMore(newPosts.length === 10);
        setPage(pageNum + 1);
      } catch (fallbackError) {
        console.error('Load posts fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedUsers = async () => {
    try {
      const response = await usersAPI.getSuggestedUsers({ limit: 5 });
      setSuggestedUsers(response.data.users || []);
    } catch (error) {
      console.error('Load suggested users error:', error);
      // Fallback to regular users
      try {
        const fallbackResponse = await usersAPI.getUsers({ limit: 5 });
        setSuggestedUsers(fallbackResponse.data.users || []);
      } catch (fallbackError) {
        console.error('Load users fallback error:', fallbackError);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadFeedPosts(page);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleRefresh = () => {
    setLoading(true);
    setPage(1);
    loadFeedPosts(1, true);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 pt-16">
        <div className="container-max section-padding py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="card p-6 mb-6 animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                  </div>
                </div>
              </div>
              {Array(3).fill(0).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
            
            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="card p-6 mb-6">
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  {Array(3).fill(0).map((_, index) => (
                    <UserCardSkeleton key={index} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 pt-16">
      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 xl:col-span-3">
            {/* Welcome Message */}
            <div className="card p-4 sm:p-6 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-fade-in">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {user?.firstName || user?.name}!</h1>
              <p className="text-blue-100 text-sm sm:text-base">What's happening in your world today?</p>
            </div>

            {/* Create Post */}
            <CreatePost onPostCreated={handlePostCreated} />

            {/* Refresh Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Latest Posts</h2>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 btn-ghost"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>

            {/* Posts Feed */}
            {posts.length === 0 && !loading ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to share something or follow some users to see their posts here.
                </p>
                <button
                  onClick={() => window.location.href = '/explore'}
                  className="btn-primary"
                >
                  Explore Users
                </button>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={posts.length}
                next={loadMorePosts}
                hasMore={hasMore}
                loader={<LoadingSpinner size="medium" className="my-8" />}
                endMessage={
                  <div className="text-center py-8">
                    <p className="text-gray-500">You've seen all posts!</p>
                  </div>
                }
                refreshFunction={handleRefresh}
                pullDownToRefresh={true}
                pullDownToRefreshThreshold={50}
                pullDownToRefreshContent={
                  <div className="text-center py-4">
                    <p className="text-gray-500">Pull down to refresh</p>
                  </div>
                }
                releaseToRefreshContent={
                  <div className="text-center py-4">
                    <p className="text-gray-500">Release to refresh</p>
                  </div>
                }
              >
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handlePostDeleted}
                  />
                ))}
              </InfiniteScroll>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block xl:block">
            <div className="sticky top-24 space-y-6">
              {/* User Profile Card */}
              <div className="card card-hover p-6 bg-gradient-to-br from-white to-blue-50">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar
                    user={user}
                    size="xl"
                    showOnlineStatus={true}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500">@{user?.username}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{user?.followersCount || 0}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{user?.followingCount || 0}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                </div>
              </div>

              {/* Suggested Users */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Who to follow
                </h3>
                
                {loadingSuggestions ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, index) => (
                      <UserCardSkeleton key={index} />
                    ))}
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map((suggestedUser) => (
                      <UserCard
                        key={suggestedUser._id}
                        user={suggestedUser}
                        size="small"
                        showFollowButton={true}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No suggestions available</p>
                )}
              </div>

              {/* Trending Topics */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Trending
                </h3>
                
                <div className="space-y-3">
                  {['#SocialMedia', '#TechNews', '#Design', '#Programming', '#WebDev'].map((trend, index) => (
                    <div key={index} className="hover:bg-gray-50 p-2 -mx-2 rounded cursor-pointer">
                      <p className="font-medium text-blue-600">{trend}</p>
                      <p className="text-sm text-gray-500">{Math.floor(Math.random() * 1000) + 100} posts</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
