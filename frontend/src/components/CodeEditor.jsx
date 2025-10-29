"use client"

import { useState, useEffect } from "react"
import "../styles/CodeEditor.css"

function CodeEditor({ problem, contestId, username, apiUrl, onSubmissionComplete }) {
  const [language, setLanguage] = useState("cpp")
  const [showLangConfirm, setShowLangConfirm] = useState(false)
  const [pendingLanguage, setPendingLanguage] = useState(null)
  const [code, setCode] = useState(`#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`)
  const [submitting, setSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [submissionDetails, setSubmissionDetails] = useState(null)
  const [pollCount, setPollCount] = useState(0)

  // Language templates
  const languageTemplates = {
    python: `# Write your code here
def main():
    pass

if __name__ == "__main__":
    main()`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
  }

  useEffect(() => {
    if (submissionId) {
      const pollInterval = setInterval(checkSubmissionStatus, Math.min(2000 + pollCount * 500, 5000))
      return () => clearInterval(pollInterval)
    }
  }, [submissionId, pollCount])

  // Reset editor when problem changes
  useEffect(() => {
    if (!problem) return
    // reset code to the current language template
    setCode(languageTemplates[language] || "")
    // clear any in-flight or previous submission state
    setSubmissionId(null)
    setSubmissionStatus(null)
    setStatusMessage("")
    setSubmissionDetails(null)
    setPollCount(0)
  }, [problem?._id, language])

  // Update code when language changes
  useEffect(() => {
    setCode(languageTemplates[language] || languageTemplates.cpp)
    // reset status when switching languages
    setSubmissionStatus(null)
    setStatusMessage("")
    setSubmissionDetails(null)
  }, [language])

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmissionStatus("pending")
    setStatusMessage("Submitting...")
    setSubmissionDetails(null)
    setPollCount(0)

    try {
      const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${baseUrl}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId,
          problemId: problem._id,
          username,
          code,
          language,
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
      const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${baseUrl}/api/submissions/${submissionId}`)
      const submission = await response.json()

      setSubmissionDetails(submission)

      if (submission.status !== "pending") {
        setSubmissionStatus(submission.status)
        setStatusMessage(submission.status === "accepted" ? "✓ Accepted!" : `✗ ${submission.status.replace(/_/g, " ")}`)
        setSubmissionId(null)
        // Inform parent so leaderboard can refresh immediately
        if (typeof onSubmissionComplete === 'function') {
          try { onSubmissionComplete() } catch (_) {}
        }
      } else {
        setPollCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error checking status:", error)
    }
  }

  const dismissStatus = () => {
    setSubmissionStatus(null)
    setStatusMessage("")
    setSubmissionDetails(null)
  }

  const handleLanguageChange = (e) => {
    const nextLang = e.target.value
    if (submitting || !!submissionId) return
    const currentTemplate = (languageTemplates[language] || "").trim()
    const currentCode = String(code || "").trim()
    const hasUserCode = currentCode !== currentTemplate && currentCode.length > 0
    if (hasUserCode) {
      setPendingLanguage(nextLang)
      setShowLangConfirm(true)
      return
    }
    setLanguage(nextLang)
  }

  const confirmLanguageSwitch = () => {
    if (pendingLanguage) {
      setLanguage(pendingLanguage)
    }
    setPendingLanguage(null)
    setShowLangConfirm(false)
  }

  const cancelLanguageSwitch = () => {
    setPendingLanguage(null)
    setShowLangConfirm(false)
  }

  return (
    <div className="code-editor">
      <div className="editor-header">
        <h3>Code Editor</h3>
        <div className="editor-controls">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="language-select"
            disabled={submitting || !!submissionId}
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
          <button
            onClick={handleSubmit}
            disabled={submitting || !!submissionId}
            className={`submit-btn ${submissionStatus}`}
          >
            {submitting ? "Submitting..." : submissionId ? "Running..." : "Submit"}
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="editor-textarea"
        placeholder={`Write your ${language} code here...`}
        disabled={submitting || !!submissionId}
      />

      {statusMessage && (
        <div className={`status-message ${submissionStatus}`}>
          <div>{statusMessage}</div>
          <div>
            {!!submissionStatus && (
              <button onClick={dismissStatus} className="retry-btn" aria-label="Dismiss status">Close</button>
            )}
          </div>
          {submissionDetails?.error && <div className="detail-text">Error: {submissionDetails.error}</div>}
          {submissionDetails?.output && submissionStatus === "wrong_answer" && (
            <div className="detail-text">Output: {submissionDetails.output}</div>
          )}
          {submissionDetails?.executionTime && (
            <div className="detail-text">Execution Time: {submissionDetails.executionTime}ms</div>
          )}
          {submissionDetails?.testCaseResults && submissionDetails.testCaseResults.length > 0 && (
            <div className="test-case-results">
              <h4>Test Case Results:</h4>
              {submissionDetails.testCaseResults.map((result, idx) => (
                <div key={idx} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                  <div>Test Case {idx + 1}: {result.passed ? '✓ Passed' : '✗ Failed'}</div>
                  {!result.passed && (
                    <div className="test-case-details">
                      <div>Expected: {result.expectedOutput}</div>
                      <div>Got: {result.actualOutput}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showLangConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="modal-title">Switch Language?</span>
            </div>
            <div className="modal-body">
              Switching language will reset the editor and clear your current code.
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={cancelLanguageSwitch}>Cancel</button>
              <button className="btn-primary" onClick={confirmLanguageSwitch}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor
