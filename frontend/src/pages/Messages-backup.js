import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { messagesAPI } from '../services/api';
import { PageLoader, InlineLoader } from '../components/common/LoadingSpinner';
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
  }, [conversations, fetchMessages]);

  useEffect(() => {
    fetchConversations();
    
    // Cleanup function
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchConversations]);

  // Handle userId parameter after conversations are loaded
  useEffect(() => {
    if (userId && conversations.length > 0) {
      openConversation(userId);
    }
  }, [userId, conversations, openConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const getOtherParticipant = (conversation) => {
    if (!conversation?.participants || !Array.isArray(conversation.participants)) {
      return { _id: '', fullName: 'Unknown User', username: 'unknown', profilePicture: '' };
    }
    return conversation.participants.find(p => p._id !== currentUser?.id) || 
           { _id: '', fullName: 'Unknown User', username: 'unknown', profilePicture: '' };
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-lg shadow-sm h-full flex">
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => {
                        setActiveConversation(conversation);
                        fetchMessages(conversation._id);
                      }}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        activeConversation?._id === conversation._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          user={otherParticipant} 
                          size="md"
                          showOnlineStatus={true}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherParticipant.fullName || otherParticipant.firstName + ' ' + otherParticipant.lastName || otherParticipant.username}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      user={getOtherParticipant(activeConversation)}
                      size="sm"
                      showOnlineStatus={true}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {getOtherParticipant(activeConversation).fullName || 
                         getOtherParticipant(activeConversation).firstName + ' ' + getOtherParticipant(activeConversation).lastName ||
                         getOtherParticipant(activeConversation).username}
                      </h3>
                      {getOtherParticipant(activeConversation).isOnline && (
                        <p className="text-sm text-green-600">Online</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center">
                      <InlineLoader />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender._id === currentUser?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === currentUser?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {message.sender._id !== currentUser?.id && (
                            <div className="flex items-center space-x-2 mb-1">
                              <Avatar 
                                user={message.sender}
                                size="xs"
                              />
                              <span className="text-xs text-gray-600">
                                {message.sender.firstName} {message.sender.lastName}
                              </span>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender._id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatMessageTime(new Date(message.createdAt))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
