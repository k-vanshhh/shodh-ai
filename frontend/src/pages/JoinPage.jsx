"use client"

import { useEffect, useState } from "react"

function JoinPage({ onJoin }) {
  const [contestId, setContestId] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [contests, setContests] = useState([])
  const [contestMeta, setContestMeta] = useState({})

  useEffect(() => {
    const loadContests = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/contests`)
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setContests(list)

        const counts = await Promise.all(
          list.map(async (c) => {
            try {
              const r = await fetch(`http://localhost:5000/api/contests/${c._id}/problems`)
              if (!r.ok) return [c._id, 0]
              const p = await r.json()
              return [c._id, Array.isArray(p) ? p.length : 0]
            } catch (_) {
              return [c._id, 0]
            }
          })
        )
        const meta = {}
        counts.forEach(([id, n]) => { meta[id] = { problemCount: n } })
        setContestMeta(meta)
      } catch (_) {}
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
      const maybeJson = await response.clone().json().catch(() => null)

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
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* Left Panel - Contest Selection */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <div style={styles.badge}>
              <span style={styles.pulseDot}></span>
              Available Contests
            </div>
            <h2 style={styles.panelTitle}>Choose Your Challenge</h2>
            <p style={styles.panelSubtitle}>Select a contest to get started</p>
          </div>

          <div style={styles.contestList}>
            {contests.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📦</div>
                <p style={styles.emptyText}>Loading contests...</p>
              </div>
            ) : (
              contests.map((c) => {
                const now = Date.now()
                const start = c.startTime ? new Date(c.startTime).getTime() : 0
                const end = c.endTime ? new Date(c.endTime).getTime() : 0
                const status = start && end
                  ? (now < start ? 'upcoming' : now > end ? 'ended' : 'live')
                  : 'live'
                const problems = contestMeta[c._id]?.problemCount ?? 0
                const active = contestId === c._id

                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setContestId(c._id)}
                    style={{
                      ...styles.contestCard,
                      ...(active ? styles.contestCardActive : {})
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.2)'
                        e.currentTarget.style.borderColor = '#7c3aed'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                        e.currentTarget.style.borderColor = '#374151'
                      }
                    }}
                  >
                    <div style={styles.cardTop}>
                      <h3 style={styles.cardTitle}>{c.title}</h3>
                      <span style={{
                        ...styles.statusBadge,
                        ...(status === 'live' ? styles.statusLive : 
                            status === 'upcoming' ? styles.statusUpcoming : 
                            styles.statusEnded)
                      }}>
                        {status === 'live' ? '● Live' : status === 'upcoming' ? '◷ Soon' : '✓ Ended'}
                      </span>
                    </div>
                    
                    <div style={styles.cardMeta}>
                      {/* <span>📋 {problems} problem{problems !== 1 ? 's' : ''}</span> */}
                      <span>📅 {c.startTime ? new Date(c.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                    </div>

                    <div style={styles.cardFooter}>
                      <code style={styles.cardCode}>#{c.shortId ?? c._id.slice(0, 8)}</code>
                      <span style={{
                        ...styles.cardAction,
                        color: active ? '#a78bfa' : '#6b7280'
                      }}>
                        {active ? '✓ Selected' : 'Select →'}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel - Join Form */}
        <div style={styles.rightPanel}>
          <div style={styles.header}>
            <h1 style={styles.title}>Shodh-a-Code</h1>
            <p style={styles.subtitle}>Programming Contest Platform</p>
          </div>

          <div style={styles.formWrapper}>
            <div style={styles.formGroup}>
              <label htmlFor="contestId" style={styles.label}>
                Contest ID
              </label>
              <div style={styles.inputWrapper}>
                <input
                  id="contestId"
                  type="text"
                  value={contestId}
                  readOnly
                  placeholder="Select a contest from the left"
                  style={styles.inputDisabled}
                />
                {contestId && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="username" style={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && contestId && username) {
                    handleSubmit(e)
                  }
                }}
                style={{
                  ...styles.input,
                  ...(loading ? styles.inputDisabledOpacity : {})
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#374151'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <div style={styles.errorMessage}>
                <span style={styles.errorIcon}>⚠️</span>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !contestId || !username}
              style={{
                ...styles.submitBtn,
                ...(loading || !contestId || !username ? styles.submitBtnDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (!loading && contestId && username) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  <span>Joining Contest...</span>
                </>
              ) : (
                <>
                  <span>Join Contest</span>
                  <span style={styles.arrow}>→</span>
                </>
              )}
            </button>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>Secure • Real-time • Collaborative</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  wrapper: {
    width: '100%',
    maxWidth: '1200px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px'
  },
  leftPanel: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  panelHeader: {
    marginBottom: '24px'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#c4b5fd',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '12px',
    border: '1px solid rgba(139, 92, 246, 0.3)'
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    background: '#a78bfa',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite'
  },
  panelTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 4px 0'
  },
  panelSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0
  },
  contestList: {
    maxHeight: '500px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '8px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5
  },
  emptyText: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0
  },
  contestCard: {
    width: '100%',
    textAlign: 'left',
    padding: '16px',
    borderRadius: '16px',
    border: '2px solid #374151',
    background: 'rgba(31, 41, 55, 0.6)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  contestCardActive: {
    background: 'rgba(109, 40, 217, 0.2)',
    borderColor: '#8b5cf6',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2), 0 12px 24px rgba(139, 92, 246, 0.3)'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    flex: 1
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap'
  },
  statusLive: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#6ee7b7',
    border: '1px solid rgba(16, 185, 129, 0.3)'
  },
  statusUpcoming: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  statusEnded: {
    background: 'rgba(100, 116, 139, 0.2)',
    color: '#cbd5e1',
    border: '1px solid rgba(100, 116, 139, 0.3)'
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px dashed #374151'
  },
  cardCode: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'Courier New, monospace'
  },
  cardAction: {
    fontSize: '12px',
    fontWeight: '700',
    transition: 'color 0.2s'
  },
  rightPanel: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#f1f5f9',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0
  },
  formWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '24px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1'
  },
  inputWrapper: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid #374151',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#f1f5f9',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    outline: 'none'
  },
  inputDisabled: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '2px solid #374151',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#64748b',
    fontFamily: 'Courier New, monospace',
    cursor: 'not-allowed',
    boxSizing: 'border-box',
    outline: 'none'
  },
  inputDisabledOpacity: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  checkmark: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#34d399',
    fontSize: '20px'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px'
  },
  errorIcon: {
    fontSize: '20px',
    flexShrink: 0
  },
  errorText: {
    fontSize: '14px',
    color: '#fca5a5',
    fontWeight: '500',
    margin: 0
  },
  submitBtn: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  },
  arrow: {
    transition: 'transform 0.2s'
  },
  footer: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #374151'
  },
  footerText: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center',
    margin: 0
  }
}

export default JoinPage