#!/bin/bash

# Execution script for the judge container
# This script compiles and runs code based on the language specified

set -e

# Default values
LANGUAGE="java"
TIMEOUT=5
MEMORY_LIMIT="128m"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --language)
            LANGUAGE="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --memory)
            MEMORY_LIMIT="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Function to run code with timeout and memory limits
run_with_limits() {
    local cmd="$1"
    local input_file="$2"
    
    # Run the command with input redirection
    # Memory limits are handled by Docker container limits
    $cmd < $input_file 2>&1
}

# Function to compile and run Java code
run_java() {
    local code_file="/submission/temp/Solution.java"
    local input_file="/submission/input/input.txt"
    
    # Compile Java code
    if ! javac -cp /submission/temp "$code_file" 2>/tmp/compile_error.txt; then
        echo "COMPILATION_ERROR"
        cat /tmp/compile_error.txt
        return 1
    fi
    
    # Run Java code with JVM options to reduce memory usage
    run_with_limits "java -Xmx32m -XX:MaxMetaspaceSize=16m -XX:ReservedCodeCacheSize=8m -cp /submission/temp Solution" "$input_file"
}

# Function to run Python code
run_python() {
    local code_file="/submission/temp/solution.py"
    local input_file="/submission/input/input.txt"
    
    # Run Python code
    run_with_limits "python3 $code_file" "$input_file"
}

# Function to compile and run C++ code
run_cpp() {
    local code_file="/submission/temp/solution.cpp"
    local input_file="/submission/input/input.txt"
    local executable="/tmp/solution"
    
    # Compile C++ code
    if ! g++ -o "$executable" "$code_file" 2>/tmp/compile_error.txt; then
        echo "COMPILATION_ERROR"
        cat /tmp/compile_error.txt
        return 1
    fi
    
    # Ensure executable bit and run C++ code
    chmod +x "$executable" || true
    run_with_limits "$executable" "$input_file"
}

# Function to run JavaScript code
run_javascript() {
    local code_file="/submission/temp/solution.js"
    local input_file="/submission/input/input.txt"
    
    # Run JavaScript code
    run_with_limits "node $code_file" "$input_file"
}

# Function to run Go code
run_go() {
    local code_file="/submission/temp/solution.go"
    local input_file="/submission/input/input.txt"
    local executable="/tmp/solution"
    
    # Compile Go code
    if ! go build -o "$executable" "$code_file" 2>/tmp/compile_error.txt; then
        echo "COMPILATION_ERROR"
        cat /tmp/compile_error.txt
        return 1
    fi
    
    # Ensure executable bit and run Go code
    chmod +x "$executable" || true
    run_with_limits "$executable" "$input_file"
}

# Main execution logic
case "$LANGUAGE" in
    "java")
        run_java
        ;;
    "python")
        run_python
        ;;
    "cpp"|"c++")
        run_cpp
        ;;
    "javascript"|"js")
        run_javascript
        ;;
    "go")
        run_go
        ;;
    *)
        echo "UNSUPPORTED_LANGUAGE: $LANGUAGE"
        exit 1
        ;;
esac
