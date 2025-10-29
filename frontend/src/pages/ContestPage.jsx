"use client"

import { useState, useEffect, useCallback } from "react"
import ProblemView from "../components/ProblemView"
import CodeEditor from "../components/CodeEditor"
import Leaderboard from "../components/Leaderboard"
import "../styles/ContestPage.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function ContestPage({ data, onLeave }) {
  const [problems, setProblems] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProblems = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`${API_URL}/api/contests/${data.contestId}/problems`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch problems: ${response.status}`)
      }
      
      const problemsData = await response.json()
      const list = Array.isArray(problemsData) ? problemsData : []
      setProblems(list)
      
      if (list.length > 0 && !selectedProblem) {
        setSelectedProblem(list[0])
      }
    } catch (error) {
      console.error("Error fetching problems:", error)
      setError("Failed to load problems. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [data.contestId, selectedProblem])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/contests/${data.contestId}/leaderboard`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`)
      }
      
      const leaderboardData = await response.json()
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : [])
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      // Don't show error for leaderboard as it's less critical
    }
  }, [data.contestId])

  useEffect(() => {
    fetchProblems()
    fetchLeaderboard() // Fetch immediately on mount
    
    const leaderboardInterval = setInterval(fetchLeaderboard, 20000)
    return () => clearInterval(leaderboardInterval)
  }, [fetchProblems, fetchLeaderboard])

  const handleProblemSelect = useCallback((problem) => {
    setSelectedProblem(problem)
  }, [])

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        Loading contest...
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container" role="alert">
        <p>{error}</p>
        <button onClick={fetchProblems} className="retry-btn">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="contest-container">
      <header className="contest-header">
        <div className="header-content">
          <h1>{data.contest?.title || 'Contest'}</h1>
          <span className="username" aria-label="Current user">
            User: {data.username}
          </span>
        </div>
        <button 
          onClick={onLeave} 
          className="leave-btn"
          aria-label="Leave contest"
        >
          Leave Contest
        </button>
      </header>

      <div className="contest-layout">
        <aside className="problems-sidebar" aria-label="Problems list">
          <h2>Problems</h2>
          <div className="problems-list" role="navigation">
            {problems.length > 0 ? (
              problems.map((problem) => (
                <button
                  key={problem._id}
                  className={`problem-item ${selectedProblem?._id === problem._id ? "active" : ""}`}
                  onClick={() => handleProblemSelect(problem)}
                  aria-current={selectedProblem?._id === problem._id ? "page" : undefined}
                  aria-label={`Problem: ${problem.title}`}
                >
                  {problem.title}
                </button>
              ))
            ) : (
              <p className="no-problems">No problems available</p>
            )}
          </div>
        </aside>

        <main className="contest-main" role="main">
          <div className="editor-section">
            {selectedProblem ? (
              <>
                <ProblemView problem={selectedProblem} />
                <CodeEditor 
                  problem={selectedProblem} 
                  contestId={data.contestId} 
                  username={data.username}
                  apiUrl={API_URL}
                />
              </>
            ) : (
              <div className="no-selection">
                Select a problem to get started
              </div>
            )}
          </div>
        </main>

        <aside className="leaderboard-sidebar" aria-label="Contest leaderboard">
          <Leaderboard entries={leaderboard} />
        </aside>
      </div>
    </div>
  )
}

export default ContestPage