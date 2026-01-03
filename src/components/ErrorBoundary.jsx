import React from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { t, children } = this.props;

    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>{t('error_boundary.title')}</h1>
          <p>{t('error_boundary.message')}</p>
          <button 
            className="continue-shopping-btn"
            onClick={() => window.location.href = '/'}
          >
            {t('error_boundary.go_home')}
          </button>
        </div>
      );
    }

    return children; 
  }
}

export default withTranslation()(ErrorBoundary);