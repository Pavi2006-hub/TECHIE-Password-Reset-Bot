import React from 'react';
import { Shield, Radio, FileText } from 'lucide-react';
import { HealthStatus, ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  loading,
  error,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(7, 7, 13, 0.85)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Brand */}
      <div
        onClick={() => setActiveTab('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(139, 120, 198, 0.28), rgba(101, 104, 168, 0.16))',
            border: '1px solid rgba(139, 120, 198, 0.45)',
            color: '#8B78C6',
            boxShadow: '0 0 15px rgba(139, 120, 198, 0.15)',
          }}
        >
          <Shield size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.04em', color: '#F2F0F8' }}>
            TECHIE
          </div>
          <div style={{ fontSize: '0.75rem', color: '#AAA5BC' }}>Secure Password Recovery</div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.92rem',
            cursor: 'pointer',
            fontWeight: activeTab === 'home' ? 600 : 500,
            color: activeTab === 'home' ? '#F2F0F8' : '#AAA5BC',
            borderBottom: activeTab === 'home' ? '2px solid #8B78C6' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'color 0.2s',
          }}
        >
          Home
        </button>

        <button
          onClick={() => setActiveTab('bot')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.92rem',
            cursor: 'pointer',
            fontWeight: activeTab === 'bot' ? 600 : 500,
            color: activeTab === 'bot' ? '#F2F0F8' : '#AAA5BC',
            borderBottom: activeTab === 'bot' ? '2px solid #8B78C6' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'color 0.2s',
          }}
        >
          Walkthrough Bot
        </button>

        <button
          onClick={() => setActiveTab('how-it-works')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.92rem',
            cursor: 'pointer',
            fontWeight: activeTab === 'how-it-works' ? 600 : 500,
            color: activeTab === 'how-it-works' ? '#F2F0F8' : '#AAA5BC',
            borderBottom: activeTab === 'how-it-works' ? '2px solid #8B78C6' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'color 0.2s',
          }}
        >
          How It Works
        </button>

        <button
          onClick={() => setActiveTab('audit-logs')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.92rem',
            cursor: 'pointer',
            fontWeight: activeTab === 'audit-logs' ? 600 : 500,
            color: activeTab === 'audit-logs' ? '#F2F0F8' : '#AAA5BC',
            borderBottom: activeTab === 'audit-logs' ? '2px solid #8B78C6' : '2px solid transparent',
            paddingBottom: '4px',
            transition: 'color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <FileText size={15} />
          <span>Audit Logs</span>
        </button>

        {/* Live Status Indicator */}
        <div
          className={`status-badge ${health && !error ? 'online' : 'offline'}`}
          title={health ? `FastAPI ${health.version} (${health.environment})` : error || 'Offline'}
        >
          <span className="status-dot" />
          <Radio size={13} style={{ marginRight: '2px' }} />
          <span>
            {loading
              ? 'Checking Backend...'
              : health && !error
              ? `Backend Online (${health.environment})`
              : 'Backend Offline'}
          </span>
        </div>
      </nav>
    </header>
  );
};
