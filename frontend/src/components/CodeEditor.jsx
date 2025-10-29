"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  const textAreaRef = useRef(null)
  const lineNumbersRef = useRef(null)
  const lineCount = useMemo(() => (String(code || "").split('\n').length || 1), [code])

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

  useEffect(() => {
    if (!problem) return
    setCode(languageTemplates[language] || "")
    setSubmissionId(null)
    setSubmissionStatus(null)
    setStatusMessage("")
    setSubmissionDetails(null)
    setPollCount(0)
  }, [problem?._id, language])

  useEffect(() => {
    setCode(languageTemplates[language] || languageTemplates.cpp)
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
        setStatusMessage(submission.status === "accepted" ? "Accepted" : submission.status.replace(/_/g, " "))
        setSubmissionId(null)
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

  const handleScrollSync = (e) => {
    try {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = e.target.scrollTop
      }
    } catch (_) {}
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
        <div className="editor-tabs">
          <button className="editor-tab active">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 1L1 4l3 3M10 1l3 3-3 3M8 1L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Code
          </button>
        </div>
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
            className={`submit-btn ${submissionStatus || ''}`}
          >
            {submitting ? "Submitting..." : submissionId ? "Running..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-wrapper">
          <div className="line-numbers" ref={lineNumbersRef} aria-hidden="true">
            <div className="line-numbers-inner">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div className="line-number" key={i}>{i + 1}</div>
              ))}
            </div>
          </div>
          <textarea
            ref={textAreaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={handleScrollSync}
            className="editor-textarea"
            placeholder={`Write your ${language} code here...`}
            disabled={submitting || !!submissionId}
            spellCheck="false"
          />
        </div>
      </div>

      {submissionStatus && (
        <div className={`result-panel ${submissionStatus}`}>
          <div className="result-header">
            <div className="result-status">
              {submissionStatus === "accepted" && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {submissionStatus !== "accepted" && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              <span className="status-text">{statusMessage}</span>
            </div>
            <button onClick={dismissStatus} className="dismiss-btn">×</button>
          </div>

          <div className="result-body">
            {submissionDetails?.error && (
              <div className="result-detail error">
                <span className="detail-label">Error:</span>
                <pre className="detail-value">{submissionDetails.error}</pre>
              </div>
            )}
            
            {submissionDetails?.executionTime && (
              <div className="result-detail">
                <span className="detail-label">Runtime:</span>
                <span className="detail-value">{submissionDetails.executionTime}ms</span>
              </div>
            )}

            {submissionDetails?.testCaseResults && submissionDetails.testCaseResults.length > 0 && (
              <div className="test-cases">
                <div className="test-cases-header">Test Cases</div>
                {submissionDetails.testCaseResults.map((result, idx) => (
                  <div key={idx} className={`test-case ${result.passed ? 'passed' : 'failed'}`}>
                    <div className="test-case-header">
                      {result.passed ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M4 8l2 2 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      <span>Test Case {idx + 1}</span>
                    </div>
                    {!result.passed && (
                      <div className="test-case-details">
                        <div className="test-detail">
                          <span className="test-label">Expected:</span>
                          <code className="test-value">{result.expectedOutput}</code>
                        </div>
                        <div className="test-detail">
                          <span className="test-label">Got:</span>
                          <code className="test-value">{result.actualOutput}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showLangConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Switch Language?</h3>
              <button onClick={cancelLanguageSwitch} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p>Switching language will reset the editor and clear your current code.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelLanguageSwitch}>Cancel</button>
              <button className="btn-primary" onClick={confirmLanguageSwitch}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor