"use client"

import { useEffect, useState } from "react"
import styles from "../styles/JoinPage.module.css"

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
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Shodh-a-Code</h1>
          <p className={styles.subtitle}>Programming Contest Platform</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="contestId" className={styles.label}>
              Contest ID
            </label>
            <input
              id="contestId"
              type="text"
              value={contestId}
              readOnly
              placeholder="Click a contest below to fill"
              disabled
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              className={styles.input}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className={`${styles.submitBtn} ${loading ? styles.loading : ''}`}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Joining...
              </>
            ) : (
              'Join Contest'
            )}
          </button>

          {contests.length > 0 && (
            <div className={styles.contestsSection}>
              <h3 className={styles.contestsTitle}>Available Contests</h3>
              <p className={styles.contestsHint}>Click an ID to select</p>
              <ul className={styles.contestsList}>
                {contests.map((c) => (
                  <li key={c._id} className={styles.contestItem}>
                    <button
                      type="button"
                      onClick={() => setContestId(c._id)}
                      className={`${styles.contestBtn} ${contestId === c._id ? styles.contestBtnActive : ''}`}
                    >
                      <span className={styles.contestId}>{c._id}</span>
                      <span className={styles.contestTitle}>{c.title}</span>
                    </button>
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
