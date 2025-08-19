import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  updatePassword: (passwordData) => API.put('/auth/updatepassword', passwordData),
};

// Users API
export const usersAPI = {
  getUsers: (params) => API.get('/users', { params }),
  getUser: (id) => API.get(`/users/${id}`),
  getProfile: (username) => API.get(`/users/profile/${username}`),
  updateProfile: (userData) => API.put('/users/profile', userData),
  uploadProfilePicture: (formData) => API.post('/users/upload/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadCoverPicture: (formData) => API.post('/users/upload/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  followUser: (id) => API.post(`/users/${id}/follow`),
  unfollowUser: (id) => API.delete(`/users/${id}/follow`),
  getFollowers: (id, params) => API.get(`/users/${id}/followers`, { params }),
  getFollowing: (id, params) => API.get(`/users/${id}/following`, { params }),
  searchUsers: (params) => API.get('/users/search', { params }),
  getSuggestedUsers: (params) => API.get('/users/suggested', { params }),
};

// Posts API
export const postsAPI = {
  getPosts: (params) => API.get('/posts', { params }),
  getPost: (id) => API.get(`/posts/${id}`),
  createPost: (formData) => API.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePost: (id, postData) => API.put(`/posts/${id}`, postData),
  deletePost: (id) => API.delete(`/posts/${id}`),
  likePost: (id) => API.post(`/posts/${id}/like`),
  unlikePost: (id) => API.delete(`/posts/${id}/like`),
  getUserPosts: (userId, params) => API.get(`/posts/user/${userId}`, { params }),
  getFeedPosts: (params) => API.get('/posts/feed', { params }),
  getExplorePosts: (params) => API.get('/posts/explore', { params }),
  getTrendingTopics: (params) => API.get('/posts/trending', { params }),
};

// Comments API
export const commentsAPI = {
  getComments: (postId, params) => API.get(`/comments/post/${postId}`, { params }),
  getComment: (id) => API.get(`/comments/${id}`),
  createComment: (commentData) => API.post('/comments', commentData),
  createReply: (replyData) => API.post('/comments/reply', replyData),
  updateComment: (id, commentData) => API.put(`/comments/${id}`, commentData),
  deleteComment: (id) => API.delete(`/comments/${id}`),
  likeComment: (id) => API.post(`/comments/${id}/like`),
  unlikeComment: (id) => API.delete(`/comments/${id}/like`),
  getReplies: (id, params) => API.get(`/comments/${id}/replies`, { params }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => API.get('/notifications', { params }),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/read-all'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
};

// Messages API
export const messagesAPI = {
  getConversations: (params) => API.get('/messages/conversations', { params }),
  createOrGetConversation: (participantId) => API.post('/messages/conversations', { participantId }),
  getMessages: (conversationId, params) => API.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (messageData) => API.post('/messages', messageData),
};

// Helper functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return 'An unexpected error occurred';
  }
};

export const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        data[key].forEach((item, index) => {
          if (item instanceof File) {
            formData.append(key, item);
          } else {
            formData.append(`${key}[${index}]`, item);
          }
        });
      } else if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  
  return formData;
};

export default API;
