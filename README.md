# Shodh-a-Code Contest Platform

A comprehensive full-stack coding contest platform featuring real-time code execution, live leaderboards, and a containerized judge system.

## Features

- **Contest Management**: Create and manage coding contests with multiple problems
- **Live Code Execution**: Execute user-submitted Java code in isolated Docker containers
- **Real-time Leaderboard**: Live rankings updated as submissions are processed
- **Asynchronous Processing**: Non-blocking submission handling with status polling
- **Resource Limits**: Enforce time and memory limits on code execution
- **Test Case Validation**: Comprehensive test case evaluation

## Architecture

### Backend (Node.js + Express)
- **REST API**: RESTful endpoints for contests, problems, and submissions
- **Database**: MongoDB for persistent data storage
- **Code Execution**: Child process-based Java execution with timeout enforcement
- **Async Processing**: Asynchronous submission handling with status tracking

### Frontend (React + JavaScript)
- **Contest UI**: Join contests and solve problems
- **Code Editor**: Write and submit Java solutions
- **Status Polling**: Real-time submission status updates (2-3 second intervals)
- **Live Leaderboard**: Periodic leaderboard updates (20 second intervals)

### DevOps
- **Docker Compose**: Single-command deployment
- **MongoDB**: Containerized NoSQL database
- **Node.js Backend**: Containerized Express server

## Setup Instructions

### Prerequisites
- **Docker Desktop** (Docker and Docker Compose included)
- **Git** (optional, if cloning from repository)

### Quick Start (Recommended)

#### Windows
1. **Ensure Docker Desktop is running**
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon should be steady in system tray)

2. **Build and start all services**
   ```powershell
   .\build-and-run.bat
   ```
   
   Or manually:
   ```powershell
   # Build judge image first
   docker build -t shodh-judge -f backend/judge/Dockerfile backend/judge/
   
   # Start all services
   docker-compose up --build -d
   ```

#### Linux/Mac
1. **Ensure Docker is running**
   ```bash
   docker info
   ```

2. **Build and start all services**
   ```bash
   chmod +x build-and-run.sh
   ./build-and-run.sh
   ```
   
   Or manually:
   ```bash
   # Build judge image first
   docker build -t shodh-judge -f backend/judge/Dockerfile backend/judge/
   
   # Start all services
   docker-compose up --build -d
   ```

3. **Access the application**
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:5000
   - 🗄️ **MongoDB**: localhost:27017

### Managing Services

**View logs:**
```bash
docker-compose logs -f
```

**View specific service logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

**Stop all services:**
```bash
docker-compose down
```

**Stop and remove volumes (clean reset):**
```bash
docker-compose down -v
```

**Restart services:**
```bash
docker-compose restart
```

### Manual Setup (Without Docker)

#### Backend Setup
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

#### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

#### Database Setup
- Install MongoDB locally
- Update `MONGODB_URI` in backend `.env` file
- Database will auto-seed on first run

## API Design

### Endpoints

#### Get All Contests
\`\`\`
GET /api/contests
Response: [
  {
    "_id": "...",
    "title": "Shodh-a-Code Contest 1",
    "description": "...",
    "startTime": "...",
    "endTime": "..."
  }
]
\`\`\`

#### Get Contest Details
\`\`\`
GET /api/contests/{contestId}
Response: {
  "_id": "...",
  "title": "Shodh-a-Code Contest 1",
  "description": "...",
  "startTime": "...",
  "endTime": "..."
}
\`\`\`

#### Get Problems for Contest
\`\`\`
GET /api/contests/{contestId}/problems
Response: [
  {
    "_id": "...",
    "title": "Sum of Two Numbers",
    "description": "...",
    "examples": [...],
    "testCases": [...]
  }
]
\`\`\`

#### Submit Code
\`\`\`
POST /api/submissions
Request: {
  "contestId": "...",
  "problemId": "...",
  "username": "john_doe",
  "code": "public class Solution { ... }",
  "language": "java"
}
Response: {
  "_id": "...",
  "status": "pending",
  "createdAt": "..."
}
\`\`\`

#### Get Submission Status
\`\`\`
GET /api/submissions/{submissionId}
Response: {
  "_id": "...",
  "status": "accepted",
  "output": "...",
  "error": "",
  "executionTime": 150
}
\`\`\`

#### Get Leaderboard
\`\`\`
GET /api/contests/{contestId}/leaderboard
Response: [
  {
    "username": "john_doe",
    "solved": 2,
    "totalTime": 45000,
    "submissions": [...]
  }
]
\`\`\`

## Design Choices & Justification

### Backend Architecture
- **Express.js**: Lightweight and flexible Node.js framework
- **MongoDB**: NoSQL database for flexible schema and easy scaling
- **Child Process**: Direct Java execution for simplicity and control
- **Async Processing**: Non-blocking submission handling with status tracking

### Code Execution
- **Child Process**: Uses Node.js `spawn` to execute Java code
- **Timeout Enforcement**: 5-second timeout per execution
- **Test Case Validation**: Compares normalized output with expected results
- **Error Handling**: Captures compilation and runtime errors

### Frontend Architecture
- **React**: Component-based UI with hooks for state management
- **Polling**: Status polling (2-3s) and leaderboard polling (20s) for real-time updates
- **CSS Styling**: Custom CSS with gradient design and responsive layout
- **Component Composition**: Modular components for problem view, editor, and leaderboard

### Key Challenges & Trade-offs

1. **Code Execution Safety**
   - Challenge: Safely executing untrusted user code
   - Solution: Timeout enforcement and error handling
   - Trade-off: Limited resource isolation compared to Docker

2. **Asynchronous Processing**
   - Challenge: Keeping UI in sync with backend state
   - Solution: Polling mechanism with configurable intervals
   - Trade-off: Polling creates network overhead; WebSockets could be more efficient

3. **Test Case Management**
   - Challenge: Validating output with exact string matching
   - Solution: Trim whitespace and compare normalized output
   - Trade-off: May fail on formatting-sensitive problems

## Sample Contest Data

The application pre-populates with:
- **Contest**: "Shodh-a-Code Contest 1"
- **Problems**:
  1. Sum of Two Numbers
  2. Calculate Factorial
  3. Check Palindrome

Access with Contest ID: `1` (use the MongoDB ObjectId from the database)

## Troubleshooting

### Docker Connection Issues
- Ensure Docker daemon is running
- Check Docker Compose status: `docker-compose ps`

### MongoDB Connection Errors
- Verify MongoDB is running: `docker-compose logs mongo`
- Check credentials in `.env` file

### Submission Failures
- Check backend logs: `docker-compose logs backend`
- Verify Java is available in the container
- Check problem test cases are properly formatted

### Frontend Not Loading
- Verify backend is running: `curl http://localhost:5000/api/contests`
- Check browser console for API errors
- Ensure `REACT_APP_API_URL` is set correctly

## Future Enhancements

- Support for multiple programming languages (Python, C++, JavaScript)
- WebSocket integration for real-time updates
- Advanced test case management with hidden test cases
- User authentication and authorization
- Problem difficulty ratings and categories
- Submission history and analytics
- Docker-based code execution for better isolation
\`\`\`

```typescriptreact file="frontend/app/page.tsx" isDeleted="true"
...deleted...
