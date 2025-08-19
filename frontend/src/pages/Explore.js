import React, { useState, useEffect } from 'react';
import { usersAPI, postsAPI } from '../services/api';
import PostCard from '../components/common/PostCard';
import UserCard from '../components/common/UserCard';
import { InlineLoader } from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

import { getDefaultAvatar, getPlaceholderImage } from '../utils/helpers';

const Explore = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchExplorePosts();
    fetchSuggestedUsers();
    fetchTrendingTopics();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchExplorePosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getExplorePosts();
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching explore posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const response = await usersAPI.getSuggestedUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setUsers([]);
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      const response = await postsAPI.getTrendingTopics();
      setTrending(response.data.data || []);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      setTrending([]);
    }
  };

  const performSearch = async () => {
    try {
      setSearchLoading(true);
      const response = await usersAPI.searchUsers({ q: searchQuery });
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const tabs = [
    { id: 'posts', label: 'Posts', icon: 'grid' },
    { id: 'people', label: 'People', icon: 'users' },
    { id: 'trending', label: 'Trending', icon: 'fire' }
  ];

  const getTabIcon = (iconType) => {
    switch (iconType) {
      case 'grid':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clipRule="evenodd" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'fire':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-[1920px] mx-auto pt-20 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Explore
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover new content and connect with people
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search people, posts, or topics..."
              className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800/50 backdrop-blur-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg transition-all duration-200"
            />
            {searchLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <InlineLoader />
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="mt-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search Results ({searchResults.length})</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {searchResults.map(user => (
                  <div key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-xl transition-colors duration-200">
                    <UserCard user={user} size="small" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-10">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="mr-2">
                    {getTabIcon(tab.icon)}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="pb-20">
          {activeTab === 'posts' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, i) => (
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
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <div 
                      key={post._id}
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        animation: 'fadeInUp 0.6s ease-out forwards',
                        opacity: 0
                      }}
                      className="transform hover:scale-[1.02] transition-all duration-300"
                    >
                      <PostCard post={post} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative mx-auto mb-6 w-32 h-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-ping opacity-20"></div>
                    <div className="absolute inset-4 rounded-full border border-purple-200 dark:border-purple-800 animate-pulse opacity-30"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    No posts to explore
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    Check back later for new content to discover, or be the first to share something amazing!
                  </p>
                  <div className="mt-6">
                    <button className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Post</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div>
              {users.length > 0 ? (
                <div className="grid grid-cols-4 gap-6 w-full">
                  {users.map((user, index) => (
                    <div 
                      key={user._id} 
                      className="w-full transform hover:scale-[1.02] transition-all duration-300"
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        animation: 'fadeInUp 0.6s ease-out forwards',
                        opacity: 0
                      }}
                    >
                      <UserCard user={user} size="large" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="relative mx-auto mb-6 w-32 h-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-green-200 dark:border-green-800 animate-ping opacity-20"></div>
                    <div className="absolute inset-4 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse opacity-30"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    No people to discover
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    We'll suggest people to follow when they're available. Connect with amazing people and grow your network!
                  </p>
                  <div className="mt-6">
                    <button className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-full hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span>Invite Friends</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trending' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.length > 0 ? (
                trending.map((topic, index) => (
                  <div 
                    key={index} 
                    className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 dark:hover:shadow-red-400/10 hover:-translate-y-1 p-6 cursor-pointer group"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.6s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-pink-500/5 dark:from-red-400/10 dark:via-orange-400/10 dark:to-pink-400/10"></div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full translate-y-10 -translate-x-10"></div>
                    
                    <div className="relative z-10">
                      {/* Header with trending indicator and rank */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75"></div>
                          </div>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30 px-2 py-1 rounded-full border border-red-200/50 dark:border-red-700/50">
                            🔥 Trending
                          </span>
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          #{index + 1}
                        </div>
                      </div>

                      {/* Hashtag */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                        #{topic.hashtag}
                      </h3>

                      {/* Post count with icon */}
                      <div className="flex items-center space-x-2 mb-4">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
                        </svg>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {topic.count.toLocaleString()} posts
                        </p>
                      </div>

                      {/* User avatars and engagement */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            {topic.recentUsers?.slice(0, 3).map((user, userIndex) => (
                              <img
                                key={userIndex}
                                src={user.profilePicture || getDefaultAvatar(32)}
                                alt={user.fullName}
                                className="w-8 h-8 rounded-full border-3 border-white dark:border-gray-800 shadow-lg hover:scale-110 transition-transform duration-200"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            +{(topic.count - 3).toLocaleString()} others
                          </span>
                        </div>
                        
                        {/* Trending arrow */}
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-xs font-bold">Rising</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                                  <div className="col-span-full">
                  <div className="text-center py-16">
                    <div className="relative mx-auto mb-6 w-32 h-32">
                      {/* Animated fire icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {/* Decorative rings */}
                      <div className="absolute inset-0 rounded-full border-2 border-orange-200 dark:border-orange-800 animate-ping opacity-20"></div>
                      <div className="absolute inset-4 rounded-full border border-red-200 dark:border-red-800 animate-pulse opacity-30"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                      No trending topics yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                      Popular hashtags and topics will appear here as the community grows. Be the first to start a trending conversation!
                    </p>
                    <div className="mt-6">
                      <button className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create Post</span>
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
