import React, { useState } from 'react';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  onClick = null 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl'
  };

  const onlineIndicatorSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
    '3xl': 'w-6 h-6'
  };

  // Get user initials
  const getInitials = (user) => {
    if (!user) return '?';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.fullName) {
      const names = user.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }
    
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  // Generate consistent color based on user ID or name
  const getAvatarColor = (user) => {
    if (!user) return 'bg-gray-500';
    
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    const identifier = user._id || user.id || user.username || user.email || 'default';
    const hash = identifier.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Ensure profilePicture is a valid string URL
  const getProfilePictureUrl = (user) => {
    if (!user?.profilePicture) return null;
    
    // If it's already a string, return it
    if (typeof user.profilePicture === 'string') {
      return user.profilePicture;
    }
    
    // If it's an object, it might be a file upload object
    if (typeof user.profilePicture === 'object' && user.profilePicture.url) {
      return user.profilePicture.url;
    }
    
    // If we can't get a valid URL, return null
    return null;
  };

  const profilePictureUrl = getProfilePictureUrl(user);
  const hasProfilePicture = profilePictureUrl && !imageError;
  const initials = getInitials(user);
  const avatarColor = getAvatarColor(user);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const onlineIndicatorSize = onlineIndicatorSizes[size] || onlineIndicatorSizes.md;

  const baseClasses = `
    relative inline-flex items-center justify-center
    rounded-full overflow-hidden flex-shrink-0
    transition-all duration-200 ease-in-out
    ${sizeClass}
    ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {hasProfilePicture ? (
        <>
          {imageLoading && (
            <div className={`absolute inset-0 ${avatarColor} flex items-center justify-center`}>
              <span className="text-white font-medium">{initials}</span>
            </div>
          )}
          <img
            src={profilePictureUrl}
            alt={user.fullName || user.username || 'User'}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      ) : (
        <div className={`w-full h-full ${avatarColor} flex items-center justify-center`}>
          <span className="text-white font-medium select-none">{initials}</span>
        </div>
      )}
      
      {/* Online status indicator */}
      {showOnlineStatus && user?.isOnline && (
        <div className={`
          absolute -bottom-0.5 -right-0.5 ${onlineIndicatorSize}
          bg-green-500 border-2 border-white rounded-full
        `} />
      )}
      
      {/* Loading overlay */}
      {imageLoading && hasProfilePicture && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
      )}
    </div>
  );
};

export default Avatar;
