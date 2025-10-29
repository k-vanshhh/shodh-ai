import "../styles/ProblemView.css"

function ProblemView({ problem }) {
  return (
    <div className="problem-view">
      <div className="problem-header">
        <h1 className="problem-title">{problem.title}</h1>
        <div className="problem-meta">
          <span className="difficulty easy">Easy</span>
        </div>
      </div>

      <div className="problem-content">
        <section className="problem-section">
          <p className="problem-description">{problem.description}</p>
        </section>

        <section className="problem-section">
          <h3 className="section-title">Examples</h3>
          {problem.examples.map((example, idx) => (
            <div key={idx} className="example-card">
              <div className="example-label">Example {idx + 1}</div>
              <div className="example-content">
                <div className="example-item">
                  <span className="example-key">Input:</span>
                  <code className="example-value">{example.input}</code>
                </div>
                <div className="example-item">
                  <span className="example-key">Output:</span>
                  <code className="example-value">{example.output}</code>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="problem-section">
          <h3 className="section-title">Input Format</h3>
          <div className="info-box">
            <p>{problem.inputFormat}</p>
          </div>
        </section>

        <section className="problem-section">
          <h3 className="section-title">Output Format</h3>
          <div className="info-box">
            <p>{problem.outputFormat}</p>
          </div>
        </section>

        <section className="problem-section">
          <h3 className="section-title">Constraints</h3>
          <div className="info-box constraints">
            <p>{problem.constraints}</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ProblemView