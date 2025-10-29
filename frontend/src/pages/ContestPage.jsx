"use client"

import { useState, useEffect } from "react"
import ProblemView from "../components/ProblemView"
import CodeEditor from "../components/CodeEditor"
import Leaderboard from "../components/Leaderboard"
import "../styles/ContestPage.css"

function ContestPage({ data, onLeave }) {
  const [problems, setProblems] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProblems()
    const leaderboardInterval = setInterval(fetchLeaderboard, 20000)
    return () => clearInterval(leaderboardInterval)
  }, [])

  const fetchProblems = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/contests/${data.contestId}/problems`)
      const problemsData = await response.json()
      setProblems(problemsData)
      if (problemsData.length > 0) {
        setSelectedProblem(problemsData[0])
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching problems:", error)
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/contests/${data.contestId}/leaderboard`)
      const leaderboardData = await response.json()
      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    }
  }

  if (loading) {
    return <div className="loading">Loading contest...</div>
  }

  return (
    <div className="contest-container">
      <header className="contest-header">
        <div className="header-content">
          <h1>{data.contest.title}</h1>
          <span className="username">User: {data.username}</span>
        </div>
        <button onClick={onLeave} className="leave-btn">
          Leave Contest
        </button>
      </header>

      <div className="contest-layout">
        <aside className="problems-sidebar">
          <h2>Problems</h2>
          <div className="problems-list">
            {problems.map((problem) => (
              <button
                key={problem._id}
                className={`problem-item ${selectedProblem?._id === problem._id ? "active" : ""}`}
                onClick={() => setSelectedProblem(problem)}
              >
                {problem.title}
              </button>
            ))}
          </div>
        </aside>

        <main className="contest-main">
          <div className="editor-section">
            {selectedProblem && (
              <>
                <ProblemView problem={selectedProblem} />
                <CodeEditor problem={selectedProblem} contestId={data.contestId} username={data.username} />
              </>
            )}
          </div>
        </main>

        <aside className="leaderboard-sidebar">
          <Leaderboard entries={leaderboard} />
        </aside>
      </div>
    </div>
  )
}

export default ContestPage
