@echo off
echo 🚀 Building and starting Shodh-a-Code Contest Platform...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Build the judge Docker image first
echo 🔨 Building judge Docker image...
docker build -t shodh-judge -f backend/judge/Dockerfile backend/judge/

if %errorlevel% neq 0 (
    echo ❌ Failed to build judge image
    exit /b 1
)

echo ✅ Judge image built successfully

REM Build and start all services
echo 🔨 Building and starting all services...
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo ✅ All services started successfully!
    echo.
    echo 🌐 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:5000
    echo 🗄️  MongoDB: localhost:27017
    echo.
    echo 📊 To view logs: docker-compose logs -f
    echo 🛑 To stop: docker-compose down
) else (
    echo ❌ Failed to start services
    exit /b 1
)
