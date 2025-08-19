# Social Media Platform

A complete, modern social media platform built with React.js, Node.js, Express.js, and MongoDB. This project includes user authentication, profiles, posts, comments, real-time features, and a responsive design.

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based registration, login, and logout with bcrypt password hashing
- **User Profiles**: Complete profile management with image uploads and bio
- **Posts & Comments**: Create, edit, delete posts with image support and nested comments
- **Social Interactions**: Like/unlike posts and comments, follow/unfollow users
- **Real-time Updates**: Socket.io integration for live notifications and comments
- **News Feed**: Personalized feed showing posts from followed users
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Technical Features
- RESTful API with proper error handling
- Protected routes and middleware
- File upload handling (profile pictures, post images)
- Real-time notifications
- Pagination for posts and comments
- Search functionality
- Input validation and sanitization

## 🛠 Tech Stack

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **Helmet** - Security middleware

## 📁 Project Structure

```
social-media-platform/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   └── commentController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Follow.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   └── comments.js
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .env.example
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```
   This will install dependencies for both frontend and backend.

3. **Environment Setup**
   
   Copy the environment files and configure them:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
   
   Update the environment variables in both `.env` files:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/social_media_platform
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # Server
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   npm run dev
   ```
   This will start both the backend server (port 5000) and frontend (port 3000).

### Alternative: Run separately
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm start
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Update password

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update profile
- `POST /api/users/upload/profile` - Upload profile picture
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/search` - Search users

### Post Endpoints
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get personalized feed
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post

### Comment Endpoints
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like comment

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/social_media_platform
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads/
```

#### Frontend
The frontend uses a proxy configuration in package.json to connect to the backend.

## 🧪 Testing

To test the application:

1. Start the development servers
2. Navigate to `http://localhost:3000`
3. Register a new account
4. Test the various features:
   - Create posts
   - Like and comment
   - Follow other users
   - Upload profile pictures

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)
3. Ensure MongoDB is accessible from production environment

### Frontend Deployment
1. Update API URLs in the frontend configuration
2. Build the production version: `npm run build`
3. Deploy the build folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for CodeAlpha internship program
- Uses modern web development best practices
- Implements industry-standard security measures

## 📞 Support

For support or questions, please create an issue in the repository.
