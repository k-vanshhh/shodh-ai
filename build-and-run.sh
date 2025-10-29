#!/bin/bash

# Build and run script for Shodh-a-Code Contest Platform

echo "🚀 Building and starting Shodh-a-Code Contest Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the judge Docker image first
echo "🔨 Building judge Docker image..."
docker build -t shodh-judge -f backend/judge/Dockerfile backend/judge/

if [ $? -ne 0 ]; then
    echo "❌ Failed to build judge image"
    exit 1
fi

echo "✅ Judge image built successfully"

# Build and start all services
echo "🔨 Building and starting all services..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "✅ All services started successfully!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo "🗄️  MongoDB: localhost:27017"
    echo ""
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Failed to start services"
    exit 1
fi
