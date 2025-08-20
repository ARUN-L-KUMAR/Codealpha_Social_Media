import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { messagesAPI } from '../services/api';
import { PageLoader, InlineLoader } from '../components/common/LoadingSpinner';
import { getDefaultAvatar } from '../utils/helpers';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';

const Messages = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Cleanup and abort controllers
  const abortController = useRef(null);

  useEffect(() => {
    fetchConversations();
    
    // Cleanup function
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Handle userId parameter after conversations are loaded
  useEffect(() => {
    if (userId && conversations.length > 0) {
      openConversation(userId);
    }
  }, [userId, conversations, openConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await messagesAPI.getConversations();
      const conversationsData = response.data?.conversations || response.conversations || [];
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      if (error.code !== 'ERR_CANCELED') {
        toast.error('Failed to load conversations');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const openConversation = useCallback(async (targetUserId) => {
    try {
      setMessagesLoading(true);
      setError(null);
      
      // Find existing conversation
      let conversation = conversations.find(conv => 
        conv.participants.some(p => p._id === targetUserId || p.id === targetUserId)
      );

      if (!conversation) {
        // Create new conversation via API
        try {
          const response = await messagesAPI.createOrGetConversation(targetUserId);
          conversation = response.data?.conversation || response.conversation;
        } catch (error) {
          console.error('Error creating conversation:', error);
          toast.error('Failed to start conversation');
          return;
        }
      }

      setActiveConversation(conversation);
      await fetchMessages(conversation._id);
    } catch (error) {
      console.error('Error opening conversation:', error);
      if (error.code !== 'ERR_CANCELED') {
        toast.error('Failed to open conversation');
      }
    } finally {
      setMessagesLoading(false);
    }
  }, [conversations]);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await messagesAPI.getMessages(conversationId);
      const messagesData = response.data?.messages || response.messages || [];
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.code !== 'ERR_CANCELED') {
        toast.error('Failed to load messages');
      }
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      const messageContent = newMessage.trim();
      setNewMessage('');

      const response = await messagesAPI.sendMessage({
        conversationId: activeConversation._id,
        content: messageContent,
        messageType: 'text'
      });

      const newMsg = response.data?.message || response.message;
      if (newMsg) {
        setMessages(prev => [...prev, newMsg]);

        // Update conversation's last message
        setConversations(prev =>
          prev.map(conv =>
            conv._id === activeConversation._id
              ? { ...conv, lastMessage: newMsg, updatedAt: new Date() }
              : conv
          )
        );
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageContent);
      if (error.code !== 'ERR_CANCELED') {
        toast.error('Failed to send message');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastMessageTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation?.participants || !Array.isArray(conversation.participants)) {
      return { _id: '', fullName: 'Unknown User', username: 'unknown', profilePicture: '' };
    }
    return conversation.participants.find(p => p._id !== currentUser?.id) || 
           { _id: '', fullName: 'Unknown User', username: 'unknown', profilePicture: '' };
  };

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv => {
    if (!conv || !searchQuery) return true;
    
    const otherParticipant = getOtherParticipant(conv);
    const fullName = otherParticipant?.fullName || '';
    const username = otherParticipant?.username || '';
    
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           username.toLowerCase().includes(searchQuery.toLowerCase());
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="max-w-6xl mx-auto pt-20 px-4">
          <PageLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-6xl mx-auto pt-20 px-4 pb-4">
        <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-xl border-0 overflow-hidden h-[calc(100vh-7rem)]">
          <div className="flex h-full">
            {/* Sidebar - Conversations */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Messages</h1>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    const isActive = activeConversation?._id === conversation._id;
                    
                    return (
                      <div
                        key={conversation._id}
                        onClick={() => {
                          setActiveConversation(conversation);
                          fetchMessages(conversation._id);
                          navigate(`/messages/${otherParticipant._id}`);
                        }}
                        className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            <Avatar 
                              user={otherParticipant} 
                              size="md"
                              showOnlineStatus={true}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {otherParticipant.fullName}
                              </p>
                              <div className="flex items-center space-x-1">
                                {conversation.lastMessage && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatLastMessageTime(conversation.lastMessage.createdAt)}
                                  </span>
                                )}
                                {conversation.unreadCount > 0 && (
                                  <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {conversation.unreadCount}
                                  </div>
                                )}
                              </div>
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {conversation.lastMessage.sender === currentUser?.id ? 'You: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : error ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-red-300 dark:text-red-600">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Error loading conversations</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{error}</p>
                    <button
                      onClick={fetchConversations}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No conversations</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Start a conversation by visiting someone's profile</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={getOtherParticipant(activeConversation).profilePicture}
                          alt={getOtherParticipant(activeConversation).fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {getOtherParticipant(activeConversation).isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getOtherParticipant(activeConversation).fullName}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getOtherParticipant(activeConversation).isOnline 
                            ? 'Online' 
                            : `Last seen ${formatLastMessageTime(getOtherParticipant(activeConversation).lastSeen || new Date())}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender._id === currentUser?.id;
                      
                      return (
                        <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {!isOwn && (
                              <img
                                src={message.sender.profilePicture}
                                alt={message.sender.fullName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <div className={`px-4 py-2 rounded-lg ${
                              isOwn 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatMessageTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <form onSubmit={sendMessage} className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          disabled={sendingMessage}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingMessage ? (
                          <InlineLoader />
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a conversation</h3>
                    <p className="text-gray-600 dark:text-gray-400">Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
