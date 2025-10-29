const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://mongo:27017/shodh-a-code", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Models
const contestSchema = new mongoose.Schema({
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  createdAt: { type: Date, default: Date.now },
})

const problemSchema = new mongoose.Schema({
  contestId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  examples: [
    {
      input: String,
      output: String,
    },
  ],
  testCases: [
    {
      input: String,
      output: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
})

const submissionSchema = new mongoose.Schema({
  contestId: mongoose.Schema.Types.ObjectId,
  problemId: mongoose.Schema.Types.ObjectId,
  username: String,
  code: String,
  language: String,
  status: {
    type: String,
    enum: ["pending", "accepted", "wrong_answer", "runtime_error", "compilation_error"],
    default: "pending",
  },
  output: String,
  error: String,
  executionTime: Number,
  createdAt: { type: Date, default: Date.now },
})

const Contest = mongoose.model("Contest", contestSchema)
const Problem = mongoose.model("Problem", problemSchema)
const Submission = mongoose.model("Submission", submissionSchema)

// Routes

// Get all contests
app.get("/api/contests", async (req, res) => {
  try {
    const contests = await Contest.find()
    res.json(contests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get contest by ID
app.get("/api/contests/:id", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) return res.status(404).json({ error: "Contest not found" })
    res.json(contest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get problems for a contest
app.get("/api/contests/:contestId/problems", async (req, res) => {
  try {
    const problems = await Problem.find({ contestId: req.params.contestId })
    res.json(problems)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get problem by ID
app.get("/api/problems/:id", async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
    if (!problem) return res.status(404).json({ error: "Problem not found" })
    res.json(problem)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Submit code
app.post("/api/submissions", async (req, res) => {
  try {
    const { contestId, problemId, username, code, language } = req.body

    const submission = new Submission({
      contestId,
      problemId,
      username,
      code,
      language,
      status: "pending",
    })

    await submission.save()

    // Execute code asynchronously
    executeCode(submission._id, code, problemId)

    res.status(201).json(submission)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get submission by ID
app.get("/api/submissions/:id", async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
    if (!submission) return res.status(404).json({ error: "Submission not found" })
    res.json(submission)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get leaderboard for a contest
app.get("/api/contests/:contestId/leaderboard", async (req, res) => {
  try {
    const submissions = await Submission.find({ contestId: req.params.contestId })

    const leaderboard = {}
    submissions.forEach((sub) => {
      if (!leaderboard[sub.username]) {
        leaderboard[sub.username] = {
          username: sub.username,
          solved: 0,
          totalTime: 0,
          submissions: [],
        }
      }

      if (sub.status === "accepted") {
        leaderboard[sub.username].solved++
        leaderboard[sub.username].totalTime += sub.createdAt.getTime()
      }

      leaderboard[sub.username].submissions.push({
        problemId: sub.problemId,
        status: sub.status,
        time: sub.createdAt,
      })
    })

    const result = Object.values(leaderboard).sort((a, b) => b.solved - a.solved || a.totalTime - b.totalTime)

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Code execution function
async function executeCode(submissionId, code, problemId) {
  try {
    const problem = await Problem.findById(problemId)
    const testCases = problem.testCases

    const tempDir = path.join("/tmp", `submission_${submissionId}`)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const javaFile = path.join(tempDir, "Solution.java")
    fs.writeFileSync(javaFile, code)

    // Compile
    const compileResult = await runCommand("javac", [javaFile], tempDir)

    if (compileResult.error) {
      await Submission.findByIdAndUpdate(submissionId, {
        status: "compilation_error",
        error: compileResult.error,
      })
      return
    }

    // Run test cases
    let allPassed = true
    let lastOutput = ""
    let lastError = ""

    for (const testCase of testCases) {
      const result = await runCommand("java", ["-cp", tempDir, "Solution"], tempDir, testCase.input)

      if (result.error) {
        allPassed = false
        lastError = result.error
        break
      }

      if (result.output.trim() !== testCase.output.trim()) {
        allPassed = false
        lastOutput = result.output
        break
      }
    }

    const status = allPassed ? "accepted" : "wrong_answer"

    await Submission.findByIdAndUpdate(submissionId, {
      status,
      output: lastOutput,
      error: lastError,
    })

    // Cleanup
    fs.rmSync(tempDir, { recursive: true })
  } catch (error) {
    await Submission.findByIdAndUpdate(submissionId, {
      status: "runtime_error",
      error: error.message,
    })
  }
}

function runCommand(command, args, cwd, input = "") {
  return new Promise((resolve) => {
    const process = spawn(command, args, { cwd, timeout: 5000 })

    let output = ""
    let error = ""

    process.stdout.on("data", (data) => {
      output += data.toString()
    })

    process.stderr.on("data", (data) => {
      error += data.toString()
    })

    process.on("close", (code) => {
      resolve({
        output,
        error: error || (code !== 0 ? `Process exited with code ${code}` : ""),
      })
    })

    process.on("error", (err) => {
      resolve({ output: "", error: err.message })
    })

    if (input) {
      process.stdin.write(input)
      process.stdin.end()
    }
  })
}

// Seed database
async function seedDatabase() {
  try {
    const existingContest = await Contest.findOne()
    if (existingContest) return

    const contest = new Contest({
      title: "Shodh-a-Code Contest 1",
      description: "Welcome to the first Shodh-a-Code contest!",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    const savedContest = await contest.save()

    const problems = [
      {
        contestId: savedContest._id,
        title: "Sum of Two Numbers",
        description: "Given two integers, find their sum.",
        inputFormat: "Two space-separated integers a and b",
        outputFormat: "A single integer representing the sum",
        constraints: "-1000 <= a, b <= 1000",
        examples: [
          { input: "5 3", output: "8" },
          { input: "-2 7", output: "5" },
        ],
        testCases: [
          { input: "5 3", output: "8" },
          { input: "-2 7", output: "5" },
          { input: "0 0", output: "0" },
        ],
      },
      {
        contestId: savedContest._id,
        title: "Calculate Factorial",
        description: "Given a number n, calculate its factorial.",
        inputFormat: "A single integer n",
        outputFormat: "A single integer representing n!",
        constraints: "0 <= n <= 20",
        examples: [
          { input: "5", output: "120" },
          { input: "0", output: "1" },
        ],
        testCases: [
          { input: "5", output: "120" },
          { input: "0", output: "1" },
          { input: "3", output: "6" },
        ],
      },
      {
        contestId: savedContest._id,
        title: "Check Palindrome",
        description: "Check if a given string is a palindrome.",
        inputFormat: "A single string",
        outputFormat: "YES if palindrome, NO otherwise",
        constraints: "1 <= length <= 100",
        examples: [
          { input: "racecar", output: "YES" },
          { input: "hello", output: "NO" },
        ],
        testCases: [
          { input: "racecar", output: "YES" },
          { input: "hello", output: "NO" },
          { input: "a", output: "YES" },
        ],
      },
    ]

    await Problem.insertMany(problems)
    console.log("Database seeded successfully")
  } catch (error) {
    console.log("Seeding error:", error.message)
  }
}

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  await seedDatabase()
  console.log(`Server running on port ${PORT}`)
})
