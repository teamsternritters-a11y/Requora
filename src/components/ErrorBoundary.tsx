import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-900 p-8 flex flex-col items-center justify-center text-surface-50">
          <div className="max-w-2xl w-full bg-red-950 border border-red-900 rounded-xl p-6">
            <h1 className="text-xl font-bold text-red-500 mb-4">Something went wrong.</h1>
            <pre className="text-xs text-red-300 overflow-auto whitespace-pre-wrap font-mono">
              {this.state.error?.toString()}
            </pre>
            <pre className="text-xs text-red-400 overflow-auto whitespace-pre-wrap mt-4 font-mono">
              {this.state.error?.stack}
            </pre>
            <button 
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
