import React from 'react';
import { Mail, Key, ShieldCheck, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartReset: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartReset }) => {
  const steps = [
    {
      num: '01',
      icon: <Mail size={24} color="#8B78C6" />,
      title: 'Email Identification',
      description:
        'Submit your registered account email address. The system establishes a secure recovery challenge without disclosing user existence to protect privacy.',
    },
    {
      num: '02',
      icon: <Key size={24} color="#8B78C6" />,
      title: 'OTP Verification',
      description:
        'Receive a cryptographically secure 6-digit one-time passcode delivered via SMTP. Verification enforces strict attempt and expiration limits.',
    },
    {
      num: '03',
      icon: <ShieldCheck size={24} color="#8B78C6" />,
      title: 'Secure Password Reset',
      description:
        'Upon successful OTP authorization, update your password. The credential is encrypted with Argon2id and stored transactionally with full audit logging.',
    },
  ];

  return (
    <section style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(139, 120, 198, 0.1)',
            border: '1px solid rgba(139, 120, 198, 0.25)',
            color: '#8B78C6',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          AUTHENTICATION ARCHITECTURE
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 700, color: '#F2F0F8', marginBottom: '16px' }}>
          How TECHIE Works
        </h2>
        <p style={{ color: '#AAA5BC', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
          A step-by-step security workflow designed to prevent account takeover, brute-force enumeration, and unauthorized credential resets.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {steps.map((step) => (
          <div key={step.num} className="glass-card" style={{ padding: '32px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'rgba(139, 120, 198, 0.15)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {step.num}
            </div>

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(139, 120, 198, 0.15)',
                border: '1px solid rgba(139, 120, 198, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              {step.icon}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F2F0F8', marginBottom: '10px' }}>
              {step.title}
            </h3>

            <p style={{ color: '#AAA5BC', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Security Architecture Flow Card */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F2F0F8', marginBottom: '16px' }}>
          System Integration Model
        </h3>
        <div
          style={{
            background: 'rgba(7, 7, 13, 0.8)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: '#AAA5BC',
            overflowX: 'auto',
          }}
        >
          <div style={{ color: '#8B78C6' }}>React + TypeScript Frontend</div>
          <div style={{ paddingLeft: '20px' }}>│  HTTP REST Client (`fetchHealth`, `GET /api/health`)</div>
          <div style={{ paddingLeft: '20px' }}>▼</div>
          <div style={{ color: '#8B78C6' }}>FastAPI Backend</div>
          <div style={{ paddingLeft: '20px' }}>├── Health Router (`GET /api/health` — Active)</div>
          <div style={{ paddingLeft: '20px' }}>├── Authentication & OTP Engine (SMTP Delivery)</div>
          <div style={{ paddingLeft: '20px' }}>├── Password Service (Argon2id hashing)</div>
          <div style={{ paddingLeft: '20px' }}>└── SQLite Database (Users, Challenges, Authorizations & Audits)</div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={onStartReset} className="btn-primary" style={{ padding: '12px 28px' }}>
          <span>Launch Password Reset Bot</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
};
