# Docker-Based Code Execution System

This document describes the Docker-based code execution system implemented for the Shodh-a-Code Contest Platform.

## Overview

The system provides secure, isolated execution of user-submitted code using Docker containers with strict resource limits and comprehensive language support.

## Architecture

### Components

1. **Judge Docker Image** (`backend/judge/`)
   - Multi-language execution environment
   - Security-hardened container
   - Resource limits enforcement

2. **Docker Execution Service** (`backend/services/dockerExecutionService.js`)
   - Node.js service for orchestrating Docker containers
   - ProcessBuilder-like functionality using Node.js `spawn`
   - Resource management and cleanup

3. **Enhanced Backend** (`backend/server.js`)
   - Updated submission handling
   - Test case validation
   - Real-time status updates

## Supported Languages

- **Java** (OpenJDK 17)
- **Python** (Python 3)
- **C++** (GCC/G++)
- **JavaScript** (Node.js)
- **Go** (Go 1.x)

## Security Features

### Container Isolation
- **Read-only filesystem**: Prevents code from modifying system files
- **No network access**: Isolates execution from external resources
- **Non-root user**: Runs as `judge` user instead of root
- **Temporary filesystem**: Limited `/tmp` space for temporary files

### Resource Limits
- **Memory**: 128MB per execution (configurable)
- **CPU**: 1 CPU core per execution
- **Time**: 5 seconds per test case (configurable)
- **Disk**: 100MB temporary space

### Process Management
- **Timeout enforcement**: Automatic process termination
- **Memory monitoring**: ulimit-based memory control
- **Cleanup**: Automatic container and file cleanup

## API Endpoints

### Submit Code
```http
POST /api/submissions
Content-Type: application/json

{
  "contestId": "contest_id",
  "problemId": "problem_id", 
  "username": "username",
  "code": "user_code_here",
  "language": "java|python|cpp|javascript|go"
}
```

### Get Submission Status
```http
GET /api/submissions/:id
```

### Get Contest Leaderboard
```http
GET /api/contests/:contestId/leaderboard
```

## Execution Flow

1. **Code Submission**: User submits code with language selection
2. **Container Creation**: Docker container is created with resource limits
3. **Code Compilation**: Language-specific compilation (if needed)
4. **Test Case Execution**: Each test case runs in isolated container
5. **Output Validation**: Compare actual vs expected output
6. **Result Determination**: Set final status (Accepted, Wrong Answer, etc.)
7. **Cleanup**: Remove container and temporary files

## Status Types

- `accepted`: All test cases passed
- `wrong_answer`: Output doesn't match expected
- `compilation_error`: Code failed to compile
- `runtime_error`: Code crashed during execution
- `time_limit_exceeded`: Execution took too long
- `unsupported_language`: Invalid language specified

## Configuration

### Environment Variables
```bash
MONGODB_URI=mongodb://mongo:27017/shodh-a-code
PORT=5000
NODE_ENV=production
```

### Docker Compose
```yaml
services:
  backend:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /tmp:/tmp
    privileged: true
```

## Usage

### Quick Start
```bash
# Windows
build-and-run.bat

# Linux/Mac
./build-and-run.sh
```

### Manual Setup
```bash
# Build judge image
docker build -t shodh-judge -f backend/judge/Dockerfile backend/judge/

# Start services
docker-compose up --build -d
```

### View Logs
```bash
docker-compose logs -f backend
```

## Monitoring

### Container Health
- Monitor container creation/destruction
- Track resource usage
- Log execution times

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages

## Performance Considerations

### Optimization
- Container reuse where possible
- Efficient file I/O
- Minimal container overhead

### Scaling
- Horizontal scaling with load balancer
- Container orchestration (Kubernetes)
- Database connection pooling

## Troubleshooting

### Common Issues

1. **Docker not available**
   - Ensure Docker is running
   - Check Docker socket permissions

2. **Container creation fails**
   - Verify judge image exists
   - Check available disk space

3. **Execution timeouts**
   - Review time limits
   - Check system resources

### Debug Commands
```bash
# Check Docker status
docker info

# List containers
docker ps -a

# View container logs
docker logs <container_id>

# Check judge image
docker images | grep shodh-judge
```

## Security Considerations

### Best Practices
- Regular security updates
- Container image scanning
- Resource limit monitoring
- Access logging

### Potential Improvements
- Sandboxing with gVisor
- Network policies
- File system quotas
- Process monitoring

## Future Enhancements

- Additional language support
- Custom execution environments
- Advanced resource monitoring
- Distributed execution
- Real-time metrics dashboard
