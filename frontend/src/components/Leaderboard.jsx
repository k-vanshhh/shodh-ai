import "../styles/Leaderboard.css"

function Leaderboard({ entries, onClose }) {
  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return null
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="leaderboard-title">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 17.5h4V10h-4v7.5zm6-17.5h4v17.5h-4V0zm6 8.75h4v8.75h-4v-8.75z" fill="currentColor"/>
          </svg>
          <h2>Leaderboard</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn">×</button>
        )}
      </div>

      <div className="leaderboard-content">
        {entries.length > 0 ? (
          <div className="leaderboard-list">
            {entries.map((entry, idx) => {
              const rank = idx + 1
              const medal = getMedalIcon(rank)
              
              return (
                <div key={idx} className={`leaderboard-row ${rank <= 3 ? 'top-three' : ''}`}>
                  <div className="rank-column">
                    {medal ? (
                      <span className="medal">{medal}</span>
                    ) : (
                      <span className="rank-number">{rank}</span>
                    )}
                  </div>
                  <div className="name-column">
                    <span className="username">{entry.username}</span>
                  </div>
                  <div className="score-column">
                    <div className="score-badge">{entry.solved}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="leaderboard-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4 4 12.954 4 24s8.954 20 20 20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18 22h12M18 26h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>No submissions yet</p>
            <span>Be the first to solve a problem!</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard