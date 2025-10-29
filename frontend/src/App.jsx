"use client"

import { useState } from "react"
import "./App.css"
import JoinPage from "./pages/JoinPage"
import ContestPage from "./pages/ContestPage"

function App() {
  const [currentPage, setCurrentPage] = useState("join")
  const [contestData, setContestData] = useState(null)

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
