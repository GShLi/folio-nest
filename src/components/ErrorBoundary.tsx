import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Portfolio rendering failed:', error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <main id="main-content" className="shell empty-state">
          <h1>页面暂时无法显示</h1>
          <p>请刷新页面后重试。</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </main>
      );
    return this.props.children;
  }
}
