"use client"

import { useState, useEffect } from "react"
import "../styles/JoinPage.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function JoinPage({ onJoin }) {
  const [username, setUsername] = useState("")
  const [contestCode, setContestCode] = useState("")
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")
  const [selectedContest, setSelectedContest] = useState(null)

  useEffect(() => {
    fetchContests()
  }, [])

  const fetchContests = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`${API_URL}/api/contests`)
      
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch contests: ${response.status}`)
      }
      
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text())
        throw new Error("Server returned invalid response format")
      }
      
      const data = await response.json()
      const contestList = Array.isArray(data) ? data : (data.contests || [])
      setContests(contestList)
    } catch (error) {
      console.error("Error fetching contests:", error)
      setContests([])
    } finally {
      setLoading(false)
    }
  }

  const handleContestSelect = (contest) => {
    setSelectedContest(contest)
    setContestCode(contest.code || contest._id || "")
    setError("")
  }

  const handleJoinContest = async (e) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError("Please enter your username")
      return
    }

    if (!selectedContest) {
      setError("Please select a contest")
      return
    }

    setJoining(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/contests/${selectedContest._id}`)
      
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Join response is not JSON")
        throw new Error("Server returned invalid response format")
      }

      const contest = await response.json()

      if (!response.ok) {
        throw new Error(contest.message || "Failed to join contest")
      }

      if (typeof onJoin === 'function') {
        onJoin({
          username: username.trim(),
          contestId: selectedContest._id,
          contest: contest,
        })
      }
    } catch (error) {
      console.error("Join error:", error)
      setError(error.message || "Failed to join contest. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="join-page">
      <div className="join-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="join-container">
        <div className="join-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 4L4 8l4 4M24 4l4 4-4 4M18 4L14 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1>Shodh-a-Code</h1>
          </div>
          <p className="tagline">Join a coding competition and test your skills</p>
        </div>

        <div className="join-content">
          <div className="contests-section">
            <div className="contests-card">
              <div className="contests-header">
                <div className="header-with-badge">
                  <span className="live-badge">
                    <span className="pulse-dot"></span>
                    Available Contests
                  </span>
                  <h3>Choose Your Challenge</h3>
                  <p className="contests-subtitle">Select a contest to get started</p>
                </div>
                <button onClick={fetchContests} className="refresh-btn" disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={loading ? 'spinning' : ''}>
                    <path d="M14 8A6 6 0 1 1 8 2M8 2V5M8 2L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="contests-list">
                {loading ? (
                  <div className="contests-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading contests...</span>
                  </div>
                ) : contests.length > 0 ? (
                  contests.map((contest) => (
                    <button
                      key={contest._id}
                      className={`contest-item ${selectedContest?._id === contest._id ? 'selected' : ''}`}
                      onClick={() => handleContestSelect(contest)}
                      disabled={joining}
                    >
                      <div className="contest-info">
                        <div className="contest-title">{contest.title}</div>
                        <div className="contest-meta">
                          <span className="contest-code-badge">
                            Code: {contest.code || contest._id?.slice(0, 8)}
                          </span>
                          {contest.startTime && (
                            <>
                              <span className="dot">•</span>
                              <span className="contest-date">
                                {new Date(contest.startTime).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {selectedContest?._id === contest._id ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="check-icon">
                          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                          <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <span className="select-arrow">→</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="no-contests">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
                      <path d="M18 22h12M18 26h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>No contests available</p>
                    <span>Check back later for new contests</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="join-form-section">
            <div className="form-card">
              <h2>Join Contest</h2>
              <form onSubmit={handleJoinContest}>
                <div className="form-group">
                  <label htmlFor="contestCode">Contest Code</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="contestCode"
                      value={contestCode}
                      readOnly
                      placeholder="Select a contest from the left"
                      className="input-readonly"
                    />
                    {contestCode && (
                      <span className="input-checkmark">✓</span>
                    )}
                  </div>
                  
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={joining}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !joining && selectedContest && username) {
                        handleJoinContest(e)
                      }
                    }}
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4v5M8 11v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="join-btn"
                  disabled={joining || !selectedContest || !username}
                >
                  {joining ? (
                    <>
                      <span className="spinner"></span>
                      Joining Contest...
                    </>
                  ) : (
                    <>
                      Join Contest
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8h12M10 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="join-footer">
          <p>Secure • Real-time • Collaborative</p>
        </div>
      </div>
    </div>
  )
}

export default JoinPage