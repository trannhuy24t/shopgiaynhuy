import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary bắt mọi lỗi render trong cây component con.
 * Nếu component crash, hiển thị fallback thay vì màn hình trắng.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-black text-white mb-2">Có lỗi xảy ra</h2>
            <p className="text-slate-400 text-sm mb-6">
              {this.state.error?.message || 'Trang này gặp sự cố không mong muốn.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                Thử lại
              </button>
              <button
                onClick={() => window.location.replace('/')}
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
