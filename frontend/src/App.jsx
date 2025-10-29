"use client"

import { useEffect, useState } from "react"
import "./App.css"
import JoinPage from "./pages/JoinPage"
import ContestPage from "./pages/ContestPage"

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = localStorage.getItem("shodh.currentPage")
      return saved || "join"
    } catch (_) {
      return "join"
    }
  })
  const [contestData, setContestData] = useState(() => {
    try {
      const saved = localStorage.getItem("shodh.contestData")
      return saved ? JSON.parse(saved) : null
    } catch (_) {
      return null
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("shodh.currentPage", currentPage)
    } catch (_) {}
  }, [currentPage])

  useEffect(() => {
    try {
      if (contestData) {
        localStorage.setItem("shodh.contestData", JSON.stringify(contestData))
      } else {
        localStorage.removeItem("shodh.contestData")
      }
    } catch (_) {}
  }, [contestData])

  const handleJoinContest = (data) => {
    setContestData(data)
    setCurrentPage("contest")
  }

  const handleLeaveContest = () => {
    setCurrentPage("join")
    setContestData(null)
  }

  return (
    <div className="App">
      {currentPage === "join" ? (
        <JoinPage onJoin={handleJoinContest} />
      ) : (
        <ContestPage data={contestData} onLeave={handleLeaveContest} />
      )}
    </div>
  )
}

export default App
