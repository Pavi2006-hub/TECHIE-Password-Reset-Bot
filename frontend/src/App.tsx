import React, { useEffect, useState } from 'react';
import { GalaxyBackground } from './components/GalaxyBackground';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ChatWindow } from './components/ChatWindow';
import { HowItWorks } from './components/HowItWorks';
import { AuditDashboard } from './components/AuditDashboard';
import { fetchHealth } from './services/api';
import { HealthStatus, ActiveTab } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to reach backend service');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Subtle Starry Nebula Canvas Background */}
      <GalaxyBackground />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        loading={loading}
        error={error}
      />

      {/* Main Content Area based on Active Tab */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {activeTab === 'home' && (
          <Hero
            onStartReset={() => setActiveTab('bot')}
            onExploreHowItWorks={() => setActiveTab('how-it-works')}
            health={health}
          />
        )}

        {activeTab === 'bot' && (
          <ChatWindow
            health={health}
          />
        )}

        {activeTab === 'how-it-works' && (
          <HowItWorks
            onStartReset={() => setActiveTab('bot')}
          />
        )}

        {activeTab === 'audit-logs' && (
          <AuditDashboard />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(7, 7, 13, 0.7)',
          padding: '24px 32px',
          textAlign: 'center',
          color: '#6B667F',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ marginBottom: '4px', color: '#AAA5BC' }}>
          <strong>TECHIE — Password Reset Walkthrough Bot</strong>
        </div>
        <div>
          Academic engineering project demonstration using mock accounts and test email delivery.
        </div>
      </footer>
    </div>
  );
};

export default App;
