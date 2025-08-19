import React, { useState, useRef } from 'react';
import { postsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 4;
    
    if (files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} images`);
      return;
    }

    setImages(files);
    
    // Create preview URLs
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setImagePreview(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(imagePreview[index].url);
    
    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast.error('Please write something or add an image');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await postsAPI.createPost(formData);
      
      // Clear form
      setContent('');
      setImages([]);
      setImagePreview([]);
      setIsExpanded(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('Post created successfully!');
      
      if (onPostCreated) {
        onPostCreated(response.data.post);
      }
    } catch (error) {
      toast.error('Failed to create post');
      console.error('Create post error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setContent('');
    setImages([]);
    imagePreview.forEach(preview => URL.revokeObjectURL(preview.url));
    setImagePreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card card-hover p-6 mb-6 bg-gradient-to-r from-white to-blue-50 border-t-4 border-t-blue-500">
      <form onSubmit={handleSubmit}>
        {/* User Avatar and Input */}
        <div className="flex space-x-4">
          <Avatar
            user={user}
            size="lg"
            className="flex-shrink-0"
          />
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleTextareaFocus}
              placeholder="What's on your mind?"
              className={`w-full resize-none border-0 focus:ring-0 p-0 text-lg placeholder-gray-500 ${
                isExpanded ? 'h-32' : 'h-12'
              } transition-all duration-200`}
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            
            {/* Image Preview Grid */}
            {imagePreview.length > 0 && (
              <div className={`mt-4 ${
                imagePreview.length === 1 ? '' : 
                imagePreview.length === 2 ? 'grid grid-cols-2 gap-2' :
                'grid grid-cols-2 gap-2'
              }`}>
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Post Actions */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              {/* Media Options */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                  disabled={images.length >= 4}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Photo ({images.length}/4)
                  </span>
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                  disabled
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                  </svg>
                  <span className="text-sm font-medium">GIF</span>
                </button>

                <button
                  type="button"
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                  disabled
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Emoji</span>
                </button>
              </div>

              {/* Character Count and Submit */}
              <div className="flex items-center space-x-4">
                <div className={`text-sm ${
                  content.length > 280 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {content.length}/280
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={(!content.trim() && images.length === 0) || isSubmitting || content.length > 280}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;
