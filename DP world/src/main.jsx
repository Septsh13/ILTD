import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const StartupMessage = ({ title = 'Starting GSN', message = 'Loading the workspace...' }) => (
  <main className="grid min-h-screen place-items-center bg-[#f7f4ec] px-6 text-center text-black">
    <section className="max-w-md">
      <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-black" />
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{message}</p>
    </section>
  </main>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <StartupMessage
          title="GSN could not start"
          message={this.state.error.message || 'A frontend error stopped the app from rendering.'}
        />
      );
    }

    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root'));

root.render(<StartupMessage />);

import('./App.jsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  })
  .catch((error) => {
    root.render(
      <StartupMessage
        title="GSN could not load"
        message={error.message || 'The frontend bundle failed to load.'}
      />,
    );
  });
