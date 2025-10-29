import "../styles/ProblemView.css"

function ProblemView({ problem }) {
  return (
    <div className="problem-view">
      <h2>{problem.title}</h2>

      <section className="problem-section">
        <h3>Description</h3>
        <p>{problem.description}</p>
      </section>

      <section className="problem-section">
        <h3>Input Format</h3>
        <p>{problem.inputFormat}</p>
      </section>

      <section className="problem-section">
        <h3>Output Format</h3>
        <p>{problem.outputFormat}</p>
      </section>

      <section className="problem-section">
        <h3>Constraints</h3>
        <p>{problem.constraints}</p>
      </section>

      <section className="problem-section">
        <h3>Examples</h3>
        {problem.examples.map((example, idx) => (
          <div key={idx} className="example">
            <div className="example-item">
              <strong>Input:</strong>
              <pre>{example.input}</pre>
            </div>
            <div className="example-item">
              <strong>Output:</strong>
              <pre>{example.output}</pre>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export default ProblemView
