FROM openjdk:17-jdk-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

CMD ["/bin/bash"]
