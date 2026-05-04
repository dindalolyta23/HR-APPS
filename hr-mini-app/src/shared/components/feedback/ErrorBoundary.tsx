import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@shared/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center"
        >
          <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Terjadi Kesalahan
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-tertiary)] max-w-md">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
          </p>
          {this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
                Detail teknis
              </summary>
              <pre className="mt-2 max-w-md overflow-auto rounded bg-[var(--color-bg-tertiary)] p-3 text-xs text-[var(--color-text-secondary)]">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="mt-6 flex gap-3">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              Coba Lagi
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
