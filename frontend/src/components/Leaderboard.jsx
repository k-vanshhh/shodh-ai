import "../styles/Leaderboard.css"

function Leaderboard({ entries }) {
  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div className="rank">Rank</div>
          <div className="name">Name</div>
          <div className="solved">Solved</div>
        </div>
        {entries.length > 0 ? (
          entries.map((entry, idx) => (
            <div key={idx} className="leaderboard-row">
              <div className="rank">{idx + 1}</div>
              <div className="name">{entry.username}</div>
              <div className="solved">{entry.solved}</div>
            </div>
          ))
        ) : (
          <div className="leaderboard-empty">No submissions yet</div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
