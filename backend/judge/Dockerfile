FROM openjdk:17-jdk-slim

# Install system dependencies and programming language runtimes
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    gcc \
    g++ \
    nodejs \
    npm \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r judge && useradd -r -g judge judge

# Set up working directory
WORKDIR /code

# Create directories for code execution
RUN mkdir -p /code/input /code/output /code/temp && \
    chown -R judge:judge /code

# Switch to non-root user
USER judge

# Set resource limits (these will be overridden by docker run limits)
ENV MEMORY_LIMIT=128m
ENV TIME_LIMIT=5s

# Create execution script
COPY --chown=judge:judge execute.sh /code/execute.sh
RUN chmod +x /code/execute.sh

CMD ["/code/execute.sh"]
