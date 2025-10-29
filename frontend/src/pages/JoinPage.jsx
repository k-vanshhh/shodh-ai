"use client"

import { useEffect, useState } from "react"
import "../styles/JoinPage.css"

function JoinPage({ onJoin }) {
  const [contestId, setContestId] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [contests, setContests] = useState([])

  useEffect(() => {
    const loadContests = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/contests`)
        if (!res.ok) return
        const data = await res.json()
        setContests(Array.isArray(data) ? data.slice(0, 5) : [])
      } catch (_) {
        // ignore
      }
    }
    loadContests()
  }, [])

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
      const path = `http://localhost:5000/api/contests/${contestId}`

      const response = await fetch(path)
      const maybeJson = await response
        .clone()
        .json()
        .catch(() => null)

      if (!response.ok) {
        const msg = (maybeJson && (maybeJson.error || maybeJson.message)) || response.statusText || "Contest not found"
        throw new Error(msg)
      }

      const contest = maybeJson || (await response.json())
      const resolvedContestId = contest?._id || contestId
      onJoin({ contestId: resolvedContestId, username, contest })
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
              readOnly
              placeholder="Click a contest below to fill"
              disabled
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
        {contests.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Available Contests (click an ID to fill):</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {contests.map((c) => (
                <li key={c._id} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setContestId(c._id)}
                    style={{
                      border: "1px solid #ddd",
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                      marginRight: 8,
                    }}
                  >
                    {c._id}
                  </button>
                  <span style={{ opacity: 0.8 }}>{c.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        </form>
      </div>
    </div>
  )
}

export default JoinPage
