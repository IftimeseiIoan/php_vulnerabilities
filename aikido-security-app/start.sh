#!/bin/bash

# Aikido Security Dashboard Startup Script

echo "Starting Aikido Security Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use. Please stop the service using this port."
        return 1
    fi
    return 0
}

# Check if ports are available
echo "Checking if ports are available..."
if ! check_port 3001; then
    exit 1
fi

if ! check_port 3000; then
    exit 1
fi

# Install backend dependencies if needed
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install frontend dependencies if needed
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if .env file exists in backend
cd ../backend
if [ ! -f ".env" ]; then
    echo "No .env file found in backend directory."
    echo "📝 Please copy env.example to .env and configure your API keys:"
    echo "   cp env.example .env"
    echo "   # Then edit .env with your AIKIDO_API_KEY and OPENAI_API_KEY"
    echo ""
    echo "Starting with default configuration..."
fi

# Start backend server in background
echo "Starting backend server on port 3001..."
cd ../backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "Starting frontend development server on port 3000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Aikido Security Dashboard is starting up!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Health Check: http://localhost:3001/api/health"
echo ""
echo "📝 To stop the servers, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
