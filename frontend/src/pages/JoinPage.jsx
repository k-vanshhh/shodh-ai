"use client"

import { useState } from "react"
import "../styles/JoinPage.css"

function JoinPage({ onJoin }) {
  const [contestId, setContestId] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!contestId.trim() || !username.trim()) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/contests/${contestId}`)
      if (!response.ok) {
        throw new Error("Contest not found")
      }

      const contest = await response.json()
      onJoin({ contestId, username, contest })
    } catch (err) {
      setError(err.message || "Failed to join contest")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>Shodh-a-Code</h1>
        <p className="subtitle">Programming Contest Platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="contestId">Contest ID</label>
            <input
              id="contestId"
              type="text"
              value={contestId}
              onChange={(e) => setContestId(e.target.value)}
              placeholder="Enter contest ID"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Joining..." : "Join Contest"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinPage
