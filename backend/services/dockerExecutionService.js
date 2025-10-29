const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

class DockerExecutionService {
  constructor() {
    this.judgeImageName = "shodh-judge";
    this.tempDir = path.join(os.tmpdir(), "shodh-submissions");
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Execute code in a Docker container with resource limits
   * @param {string} code - The user's code
   * @param {string} language - Programming language (java, python, cpp, javascript, go)
   * @param {string} input - Test case input
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeCode(code, language, input, options = {}) {
    const {
      timeLimit = 5, // seconds
      memoryLimit = "256m", // memory limit
      containerName = `shodh-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    } = options;

    const submissionId = options.submissionId || `sub-${Date.now()}`;
    const submissionDir = path.join(this.tempDir, submissionId);
    
    try {
      // Create submission directory
      await this.createSubmissionDirectory(submissionDir, code, language, input);
      
      // Build Docker command with resource limits
      const dockerCommand = this.buildDockerCommand(
        containerName,
        submissionDir,
        language,
        timeLimit,
        memoryLimit
      );

      // Execute Docker container
      const result = await this.runDockerContainer(dockerCommand, timeLimit);
      
      return {
        success: true,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        status: this.determineStatus(result.error, result.exitCode)
      };

    } catch (error) {
      return {
        success: false,
        output: "",
        error: error.message,
        executionTime: 0,
        status: "runtime_error"
      };
    } finally {
      // Cleanup
      await this.cleanup(submissionDir, containerName);
    }
  }

  /**
   * Create submission directory with code and input files
   */
  async createSubmissionDirectory(submissionDir, code, language, input) {
    if (fs.existsSync(submissionDir)) {
      fs.rmSync(submissionDir, { recursive: true });
    }
    fs.mkdirSync(submissionDir, { recursive: true });

    // Create input file
    const inputFile = path.join(submissionDir, "input", "input.txt");
    fs.mkdirSync(path.dirname(inputFile), { recursive: true });
    fs.writeFileSync(inputFile, input);

    // Create code file based on language
    const codeFile = this.getCodeFilePath(submissionDir, language);
    const normalizedCode = this.normalizeCodeByLanguage(code, language);
    fs.writeFileSync(codeFile, normalizedCode);
  }

  /**
   * Get the appropriate code file path based on language
   */
  getCodeFilePath(submissionDir, language) {
    const tempDir = path.join(submissionDir, "temp");
    fs.mkdirSync(tempDir, { recursive: true });

    switch (language.toLowerCase()) {
      case "java":
        return path.join(tempDir, "Solution.java");
      case "python":
        return path.join(tempDir, "solution.py");
      case "cpp":
      case "c++":
        return path.join(tempDir, "solution.cpp");
      case "javascript":
      case "js":
        return path.join(tempDir, "solution.js");
      case "go":
        return path.join(tempDir, "solution.go");
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Normalize code prior to writing it to disk for specific languages.
   * For Java, ensure the primary public class is named "Solution" to
   * match the fixed filename we compile (Solution.java).
   */
  normalizeCodeByLanguage(code, language) {
    const lang = String(language || "").toLowerCase();
    if (lang !== "java") return code;

    try {
      // If class Solution already exists, leave as-is
      if (/\bclass\s+Solution\b/.test(code)) return code;

      // Replace first occurrence of a public class or class with Solution
      // Handles patterns like: public class Name, class Name { ... }
      const replaced = code.replace(
        /(public\s+class\s+|class\s+)([A-Za-z_][A-Za-z0-9_]*)/,
        (_m, p1) => `${p1.includes('public') ? 'public ' : ''}class Solution`
      );

      return replaced;
    } catch (_) {
      return code;
    }
  }

  /**
   * Build Docker command with resource limits
   */
  buildDockerCommand(containerName, submissionDir, language, timeLimit, memoryLimit) {
    const dockerArgs = [
      "run",
      "--rm", // Remove container after execution
      "--name", containerName,
      "--memory", "512m", // Memory limit (increased for Java)
      "--memory-swap", "512m", // Disable swap
      "--cpus", "1", // CPU limit
      "--network", "none", // No network access
      "--read-only", // Read-only filesystem
      "--tmpfs", "/tmp:rw,exec,mode=1777,size=100m", // Exec-enabled tmpfs for compiled binaries
      "--user", "judge", // Run as non-root user
      "--workdir", "/code",
      "-v", `${submissionDir}:/submission`, // Mount submission directory
      this.judgeImageName,
      "/code/execute.sh",
      "--language", language,
      "--timeout", timeLimit.toString(),
      "--memory", memoryLimit
    ];

    return { command: "docker", args: dockerArgs };
  }

  /**
   * Run Docker container and capture output
   */
  async runDockerContainer(dockerCommand, timeLimit) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let output = "";
      let error = "";
      let exitCode = 0;

      const process = spawn(dockerCommand.command, dockerCommand.args, {
        stdio: ["pipe", "pipe", "pipe"]
      });

      // Set overall timeout (Docker timeout + buffer)
      const overallTimeout = (timeLimit + 10) * 1000;
      const timeout = setTimeout(() => {
        process.kill("SIGKILL");
        reject(new Error("Execution timeout exceeded"));
      }, overallTimeout);

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", (code) => {
        clearTimeout(timeout);
        const executionTime = Date.now() - startTime;
        exitCode = code;
        
        resolve({
          output: output.trim(),
          error: error.trim(),
          exitCode,
          executionTime
        });
      });

      process.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Determine execution status based on error and exit code
   */
  determineStatus(error, exitCode) {
    if (exitCode === 124) { // timeout exit code
      return "time_limit_exceeded";
    }
    
    if (error.includes("COMPILATION_ERROR")) {
      return "compilation_error";
    }
    
    if (error.includes("UNSUPPORTED_LANGUAGE")) {
      return "unsupported_language";
    }
    
    if (exitCode !== 0) {
      return "runtime_error";
    }
    
    return "accepted";
  }

  /**
   * Cleanup submission directory and container
   */
  async cleanup(submissionDir, containerName) {
    try {
      // Remove submission directory
      if (fs.existsSync(submissionDir)) {
        fs.rmSync(submissionDir, { recursive: true });
      }

      // Force remove container if it still exists
      const removeProcess = spawn("docker", ["rm", "-f", containerName]);
      removeProcess.on("close", () => {
        // Container removed or didn't exist
      });
    } catch (error) {
      console.error("Cleanup error:", error.message);
    }
  }

  /**
   * Build the judge Docker image
   */
  async buildJudgeImage() {
    return new Promise((resolve, reject) => {
      const buildProcess = spawn("docker", [
        "build",
        "-t", this.judgeImageName,
        "-f", path.join(__dirname, "../judge/Dockerfile"),
        path.join(__dirname, "../judge")
      ]);

      buildProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Judge Docker image built successfully");
          resolve();
        } else {
          reject(new Error(`Failed to build judge image. Exit code: ${code}`));
        }
      });

      buildProcess.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Check if Docker is available and judge image exists
   */
  async checkDockerAvailability() {
    try {
      // Check if Docker is running
      await this.runCommand("docker", ["version"]);
      
      // Check if judge image exists
      const result = await this.runCommand("docker", ["images", "-q", this.judgeImageName]);
      if (!result.output.trim()) {
        console.log("Judge image not found, building...");
        try {
          await this.buildJudgeImage();
        } catch (buildError) {
          console.error("Failed to build judge image:", buildError.message);
          // Continue anyway - the image might be built externally
        }
      }
      
      return true;
    } catch (error) {
      console.error("Docker not available:", error.message);
      return false;
    }
  }

  /**
   * Run a command and return result
   */
  runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = "";
      let error = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", (code) => {
        resolve({ output, error, exitCode: code });
      });

      process.on("error", (err) => {
        reject(err);
      });
    });
  }
}

module.exports = DockerExecutionService;
