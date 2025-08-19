@echo off
echo 🚀 Setting up Social Media Platform...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install root dependencies
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Create environment files if they don't exist
if not exist .env (
    echo 📝 Creating environment file...
    copy .env.example .env
    echo ✅ Created .env file. Please update it with your configuration.
)

if not exist backend\.env (
    echo 📝 Creating backend environment file...
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env file. Please update it with your configuration.
)

REM Create uploads directory
if not exist backend\uploads\profiles mkdir backend\uploads\profiles
if not exist backend\uploads\posts mkdir backend\uploads\posts

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update the .env files with your configuration
echo 2. Make sure MongoDB is running
echo 3. Run 'npm run dev' to start the application
echo.
echo 🌐 The application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
pause
