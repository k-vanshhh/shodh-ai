"use client"

import { useState, useEffect } from "react"
import "../styles/CodeEditor.css"

function CodeEditor({ problem, contestId, username }) {
  const [code, setCode] = useState(`public class Solution {
    public static void main(String[] args) {
        // Write your code here
    }
}`)
  const [submitting, setSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    if (submissionId) {
      const pollInterval = setInterval(checkSubmissionStatus, 2000)
      return () => clearInterval(pollInterval)
    }
  }, [submissionId])

  const handleSubmit = async () => {
    setSubmitting(true)
    setStatusMessage("Submitting...")

    try {
      const response = await fetch("http://localhost:5000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          problemId: problem._id,
          username,
          code,
          language: "java",
        }),
      })

      const submission = await response.json()
      setSubmissionId(submission._id)
      setSubmitting(false)
    } catch (error) {
      setStatusMessage("Error submitting code")
      setSubmitting(false)
    }
  }

  const checkSubmissionStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${submissionId}`)
      const submission = await response.json()

      if (submission.status !== "pending") {
        setSubmissionStatus(submission.status)
        setStatusMessage(submission.status === "accepted" ? "Accepted!" : `${submission.status.replace("_", " ")}`)
        setSubmissionId(null)
      }
    } catch (error) {
      console.error("Error checking status:", error)
    }
  }

  return (
    <div className="code-editor">
      <div className="editor-header">
        <h3>Code Editor</h3>
        <button onClick={handleSubmit} disabled={submitting} className={`submit-btn ${submissionStatus}`}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="editor-textarea"
        placeholder="Write your Java code here..."
      />

      {statusMessage && <div className={`status-message ${submissionStatus}`}>{statusMessage}</div>}
    </div>
  )
}

export default CodeEditor
