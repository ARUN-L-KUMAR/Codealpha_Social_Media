import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const UserCard = ({ user: profileUser, showFollowButton = true, size = 'medium', onFollowChange }) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profileUser?.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    if (profileUser._id === currentUser._id) {
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(profileUser._id);
        setIsFollowing(false);
        toast.success(`Unfollowed ${profileUser.fullName || profileUser.name}`);
      } else {
        await usersAPI.followUser(profileUser._id);
        setIsFollowing(true);
        toast.success(`Following ${profileUser.fullName || profileUser.name}`);
      }
      
      if (onFollowChange) {
        onFollowChange(profileUser._id, !isFollowing);
      }
    } catch (error) {
      toast.error('Failed to update follow status');
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Small card layout for sidebar
  if (size === 'small') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${profileUser.username}`}>
            <Avatar
              user={profileUser}
              size="md"
              showOnlineStatus={false}
              className="ring-2 ring-white/60 dark:ring-gray-700/60"
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${profileUser.username}`}
              className="block text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
            >
              {profileUser.fullName || `${profileUser.firstName} ${profileUser.lastName}` || profileUser.name || 'User'}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{profileUser.username || 'username'}
            </p>
          </div>
          
          {showFollowButton && currentUser && profileUser._id !== currentUser._id && (
            <button
              onClick={handleFollowToggle}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isFollowing ? 'Following' : 'Follow'
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Medium/Large card layout for explore page
  return (
    <div className="relative w-full h-[420px] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
      
      {/* Content Container */}
      <div className="relative z-10 h-full p-6 flex flex-col">
        
        {/* Header Section - Avatar and Username */}
        <div className="flex items-center space-x-4 mb-6">
          <Link to={`/profile/${profileUser.username}`} className="flex-shrink-0">
            <Avatar
              user={profileUser}
              size="xl"
              showOnlineStatus={true}
              className="ring-3 ring-white/60 dark:ring-gray-700/60 shadow-lg hover:scale-110 transition-transform duration-300"
            />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${profileUser.username}`}
              className="block text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 truncate"
            >
              {profileUser.fullName || `${profileUser.firstName} ${profileUser.lastName}` || profileUser.name || 'User'}
            </Link>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                @{profileUser.username || 'username'}
              </p>
              {profileUser.isOnline && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Tag and Follow Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H6a2 2 0 00-2-2V4m8 0H8m8 0v2a2 2 0 002 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2V6a2 2 0 012-2h8z" />
              </svg>
              {profileUser.bio && profileUser.bio.trim() ? 
                profileUser.bio.split(' ').slice(0, 2).join(' ') + '...' : 
                'Professional'
              }
            </div>
          </div>
          
          {showFollowButton && currentUser && profileUser._id !== currentUser._id && (
            <button
              onClick={handleFollowToggle}
              disabled={isLoading}
              className={`ml-3 px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg ${
                isFollowing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {!isFollowing && (
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  {isFollowing ? 'Following' : 'Follow'}
                </>
              )}
            </button>
          )}
        </div>

        {/* Bio Section */}
        <div className="flex-1 mb-6">
          <div className="h-full p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">About</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                  {profileUser.bio || 'No bio available. This user hasn\'t added a description yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-auto">
          <div className="border-t border-gray-200/60 dark:border-gray-700/60 pt-4">
            <div className="flex items-center justify-center space-x-8">
              {/* Followers */}
              <div className="text-center group cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl px-4 py-2 transition-all duration-200">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                  {(profileUser.followersCount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                  Followers
                </div>
              </div>
              
              {/* Following */}
              <div className="text-center group cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl px-4 py-2 transition-all duration-200">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200">
                  {(profileUser.followingCount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                  Following
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Button for own profile */}
          {currentUser && profileUser._id === currentUser._id && (
            <div className="mt-4 pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
              <Link
                to="/settings"
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
