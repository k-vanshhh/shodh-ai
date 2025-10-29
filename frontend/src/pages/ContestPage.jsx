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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

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
      
      const payload = await response.json()
      const list = Array.isArray(payload)
        ? payload
        : (payload && Array.isArray(payload.leaderboard) ? payload.leaderboard : [])
      setLeaderboard(list)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    }
  }, [data.contestId])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const requestLeave = () => setShowLeaveConfirm(true)
  const cancelLeave = () => setShowLeaveConfirm(false)
  const confirmLeave = () => {
    setShowLeaveConfirm(false)
    if (typeof onLeave === 'function') onLeave()
  }

  useEffect(() => {
    fetchProblems()
    fetchLeaderboard()
    
    const leaderboardInterval = setInterval(fetchLeaderboard, 20000)
    return () => clearInterval(leaderboardInterval)
  }, [fetchProblems, fetchLeaderboard])

  const handleProblemSelect = useCallback((problem) => {
    setSelectedProblem(problem)
  }, [])

  if (loading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <div className="loading-spinner"></div>
        <span>Loading contest...</span>
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
        <div className="header-left">
          <div className="logo">Contest</div>
          <div className="divider"></div>
          <h1>{data.contest?.title || 'Coding Challenge'}</h1>
        </div>
        <div className="header-right">
          <button 
            onClick={() => setShowLeaderboard(!showLeaderboard)} 
            className="leaderboard-toggle"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 14h3V8H2v6zm5-14h3v14H7V0zm5 7h3v7h-3V7z" fill="currentColor"/>
            </svg>
            Leaderboard
          </button>
          <span className="username">{data.username}</span>
          <button onClick={requestLeave} className="leave-btn">
            Finish Contest
          </button>
        </div>
      </header>

      <div className="contest-layout">
        <aside className={`problems-sidebar ${showLeaderboard ? 'collapsed' : ''}`}>
          <div className="problems-header">
            <h2>Problems</h2>
            <span className="problem-count">{problems.length}</span>
          </div>
          <div className="problems-list">
            {problems.length > 0 ? (
              problems.map((problem, idx) => (
                <button
                  key={problem._id}
                  className={`problem-item ${selectedProblem?._id === problem._id ? "active" : ""}`}
                  onClick={() => handleProblemSelect(problem)}
                >
                  <span className="problem-number">{idx + 1}</span>
                  <span className="problem-title">{problem.title}</span>
                  <span className="problem-difficulty">Easy</span>
                </button>
              ))
            ) : (
              <p className="no-problems">No problems available</p>
            )}
          </div>
        </aside>

        <main className="contest-main">
          {selectedProblem ? (
            <>
              <ProblemView problem={selectedProblem} />
              <CodeEditor 
                problem={selectedProblem} 
                contestId={data.contestId} 
                username={data.username}
                apiUrl={API_URL}
                onSubmissionComplete={fetchLeaderboard}
              />
            </>
          ) : (
            <div className="no-selection">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M32 8v48M8 32h48" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <p>Select a problem to begin</p>
            </div>
          )}
        </main>

        <aside className={`leaderboard-sidebar ${showLeaderboard ? 'visible' : ''}`}>
          <Leaderboard entries={leaderboard} onClose={() => setShowLeaderboard(false)} />
        </aside>
      </div>

      {showLeaveConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Leave Contest?</h3>
              <button onClick={cancelLeave} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to leave? Your progress will be saved but you won't be able to submit more solutions.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelLeave}>Cancel</button>
              <button className="btn-primary" onClick={confirmLeave}>Leave Contest</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContestPage