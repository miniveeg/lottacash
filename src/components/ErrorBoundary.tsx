import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="empty">
            <p style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)' }}>
              Something went wrong
            </p>
            <p className="hint">{this.state.error.message}</p>
            <button className="btn primary" onClick={() => window.location.assign('/dashboard')}>
              Back to dashboard
            </button>
            <button
              className="btn ghost"
              style={{ marginLeft: '0.5rem' }}
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}