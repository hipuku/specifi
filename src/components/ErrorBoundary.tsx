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
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
          <div className="flex flex-col gap-4 max-w-md w-full text-center p-8">
            <p className="text-h4 font-semibold text-void-90">Something went wrong</p>
            <p className="text-p-sm text-void-60 font-mono">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-xl bg-void-20 hover:bg-void-30 text-void-80 text-p-sm transition-colors cursor-pointer"
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
