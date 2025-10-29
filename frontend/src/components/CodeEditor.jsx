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
  const [submissionDetails, setSubmissionDetails] = useState(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (submissionId) {
      const pollInterval = setInterval(checkSubmissionStatus, Math.min(2000 + pollCount * 500, 5000))
      return () => clearInterval(pollInterval)
    }
  }, [submissionId, pollCount])

  const handleSubmit = async () => {
    setSubmitting(true)
    setStatusMessage("Submitting...")
    setSubmissionDetails(null)
    setPollCount(0)

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

      setSubmissionDetails(submission)

      if (submission.status !== "pending") {
        setSubmissionStatus(submission.status)
        setStatusMessage(submission.status === "accepted" ? "✓ Accepted!" : `✗ ${submission.status.replace(/_/g, " ")}`)
        setSubmissionId(null)
      } else {
        setPollCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error checking status:", error)
    }
  }

  return (
    <div className="code-editor">
      <div className="editor-header">
        <h3>Code Editor</h3>
        <button
          onClick={handleSubmit}
          disabled={submitting || !!submissionId}
          className={`submit-btn ${submissionStatus}`}
        >
          {submitting ? "Submitting..." : submissionId ? "Running..." : "Submit"}
        </button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="editor-textarea"
        placeholder="Write your Java code here..."
        disabled={submitting || !!submissionId}
      />

      {statusMessage && (
        <div className={`status-message ${submissionStatus}`}>
          <div>{statusMessage}</div>
          {submissionDetails?.error && <div className="detail-text">Error: {submissionDetails.error}</div>}
          {submissionDetails?.output && submissionStatus === "wrong_answer" && (
            <div className="detail-text">Output: {submissionDetails.output}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default CodeEditor
