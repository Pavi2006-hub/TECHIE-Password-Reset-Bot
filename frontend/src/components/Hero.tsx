import React from 'react';
import { KeyRound, ShieldAlert, Cpu, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeroProps {
  onStartReset: () => void;
  onExploreHowItWorks: () => void;
  health: HealthStatus | null;
}

export const Hero: React.FC<HeroProps> = ({ onStartReset, onExploreHowItWorks, health }) => {
  return (
    <section style={{ maxWidth: '1060px', margin: '0 auto', width: '100%', padding: '48px 24px' }}>
      {/* Eyebrow and Headline */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '24px',
            background: 'rgba(139, 120, 198, 0.1)',
            border: '1px solid rgba(139, 120, 198, 0.28)',
            color: '#8B78C6',
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '20px',
          }}
        >
          <Sparkles size={14} />
          SECURE ACCOUNT RECOVERY
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '20px',
            color: '#F2F0F8',
          }}
        >
          Reset your password. <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #8B78C6 0%, #AAA5BC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Return with confidence.
          </span>
        </h1>

        <p
          style={{
            color: '#AAA5BC',
            fontSize: '1.15rem',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 36px auto',
          }}
        >
          A guided password recovery experience built around identity verification,
          cryptographic OTP challenges, and transparent security audit trails.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={onStartReset} className="btn-primary" style={{ padding: '13px 30px', fontSize: '1rem' }}>
            <span>Start Password Reset</span>
            <ArrowRight size={18} />
          </button>
          <button onClick={onExploreHowItWorks} className="btn-secondary" style={{ padding: '13px 26px', fontSize: '1rem' }}>
            <span>Explore How It Works</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '32px',
            fontSize: '0.85rem',
            color: '#AAA5BC',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#4ADE80" /> OTP Verification
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#4ADE80" /> Argon2id Password Storage
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#4ADE80" /> Auditable Security Workflow
          </span>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <div className="glass-card" style={{ padding: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(139, 120, 198, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B78C6',
              marginBottom: '16px',
            }}
          >
            <KeyRound size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', color: '#F2F0F8' }}>
            Verified Access
          </h3>
          <p style={{ color: '#AAA5BC', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Verify account ownership before an authorized password change using ephemeral, single-use codes delivered through a test SMTP server.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(101, 104, 168, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B78C6',
              marginBottom: '16px',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', color: '#F2F0F8' }}>
            Secure by Design
          </h3>
          <p style={{ color: '#AAA5BC', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Protect password-reset actions with server-side authorization tokens, attempt throttling, and tamper-resistant password hashing.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '28px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(139, 120, 198, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B78C6',
              marginBottom: '16px',
            }}
          >
            <Cpu size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', color: '#F2F0F8' }}>
            Complete Visibility
          </h3>
          <p style={{ color: '#AAA5BC', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Track security events, challenge states, and reset outcomes through structured, privacy-preserving audit records.
          </p>
        </div>
      </div>

      {/* Backend Integration status banner */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: '4px solid #8B78C6',
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: '#AAA5BC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Backend System Connection
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F2F0F8', marginTop: '2px' }}>
            {health ? (
              <span>
                Connected to <span style={{ color: '#8B78C6' }}>{health.app}</span> (FastAPI v{health.version})
              </span>
            ) : (
              <span style={{ color: '#F87171' }}>Backend service offline or unreachable</span>
            )}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#AAA5BC' }}>
          Endpoint: http://127.0.0.1:8000/api/health
        </div>
      </div>
    </section>
  );
};
