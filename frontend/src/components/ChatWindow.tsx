import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, AlertCircle, KeyRound, CheckCircle2, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { ChatMessageItem, HealthStatus } from '../types';
import { requestPasswordReset, verifyOtp, submitNewPassword, resendOtp } from '../services/api';

interface ChatWindowProps {
  health?: HealthStatus | null;
}

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export const ChatWindow: React.FC<ChatWindowProps> = ({ health: _health }) => {
  const [step, setStep] = useState<Step>('EMAIL');
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-init-1',
      sender: 'bot',
      text: 'Welcome to TECHIE — Secure Password Recovery Assistant.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'msg-init-2',
      sender: 'bot',
      text: 'I will guide you securely through identity verification and password recovery. To begin, please enter the email address associated with your account.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Form states
  const [email, setEmail] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, step]);

  // Handle countdown for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const addMessage = (sender: 'bot' | 'user', text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${sender}-${Date.now()}-${Math.random()}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // STEP 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || isLoading) return;

    setErrorMessage(null);
    addMessage('user', cleanEmail);
    setIsLoading(true);

    try {
      const res = await requestPasswordReset(cleanEmail);
      setChallengeId(res.challenge_id);
      addMessage(
        'bot',
        `${res.message} Please check your email inbox and spam folder for your 6-digit verification code. If you don't see it shortly, you can request another code.`
      );
      setStep('OTP');
      setResendCooldown(30);
    } catch (err: any) {
      const msg = err.message || 'Error processing password reset request';
      setErrorMessage(msg);
      addMessage('bot', `Request failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || isLoading || !challengeId) return;

    setErrorMessage(null);
    addMessage('user', `Verification code entered: ******`);
    setIsLoading(true);

    try {
      const res = await verifyOtp(challengeId, cleanOtp);
      setResetToken(res.reset_token);
      addMessage(
        'bot',
        `Identity verified successfully! Single-use authorization token established. Please provide a new secure password (minimum 8 characters, with an uppercase letter and a number).`
      );
      setStep('NEW_PASSWORD');
    } catch (err: any) {
      const msg = err.message || 'OTP verification failed';
      setErrorMessage(msg);
      addMessage('bot', `Verification error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2 (Alternate): Resend OTP
  const handleResendOtp = async () => {
    if (!challengeId || resendCooldown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await resendOtp(challengeId);
      addMessage('bot', `A fresh 6-digit verification code has been dispatched. Please check your email inbox.`);
      setResendCooldown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Submit New Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !resetToken) return;

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setErrorMessage('Password must be at least 8 characters long and contain at least one uppercase letter and one number.');
      return;
    }

    setErrorMessage(null);
    addMessage('user', 'Submitting new password update...');
    setIsLoading(true);

    try {
      const res = await submitNewPassword(resetToken, newPassword);
      addMessage('bot', `${res.message} Your account credential has been safely updated in the database.`);
      setStep('SUCCESS');
    } catch (err: any) {
      const msg = err.message || 'Failed to update password';
      setErrorMessage(msg);
      addMessage('bot', `Password update error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset entire workflow
  const handleStartOver = () => {
    setStep('EMAIL');
    setEmail('');
    setOtp('');
    setChallengeId(null);
    setResetToken(null);
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: 'Session reset. Enter your demo account email address to initiate a new verification sequence.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
      {/* Progress Indicator */}
      <div
        className="glass-card"
        style={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: step === 'EMAIL' ? '#8B78C6' : 'rgba(139, 120, 198, 0.15)',
              color: step === 'EMAIL' ? '#FFF' : '#AAA5BC',
            }}
          >
            1. Email
          </div>
          <ArrowRight size={14} color="#6B667F" />
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: step === 'OTP' ? '#8B78C6' : 'rgba(139, 120, 198, 0.15)',
              color: step === 'OTP' ? '#FFF' : '#AAA5BC',
            }}
          >
            2. Verify OTP
          </div>
          <ArrowRight size={14} color="#6B667F" />
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: step === 'NEW_PASSWORD' ? '#8B78C6' : 'rgba(139, 120, 198, 0.15)',
              color: step === 'NEW_PASSWORD' ? '#FFF' : '#AAA5BC',
            }}
          >
            3. New Password
          </div>
          <ArrowRight size={14} color="#6B667F" />
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: step === 'SUCCESS' ? '#4ADE80' : 'rgba(74, 222, 128, 0.15)',
              color: step === 'SUCCESS' ? '#000' : '#AAA5BC',
            }}
          >
            4. Complete
          </div>
        </div>

        <button onClick={handleStartOver} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} />
          <span>Start Over</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="glass-card"
        style={{
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          minHeight: '360px',
          maxHeight: '440px',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'rgba(10, 9, 18, 0.8)',
        }}
      >
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: '84%',
                flexDirection: isBot ? 'row' : 'row-reverse',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isBot ? 'rgba(139, 120, 198, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${isBot ? 'rgba(139, 120, 198, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isBot ? '#8B78C6' : '#F2F0F8',
                  flexShrink: 0,
                }}
              >
                {isBot ? <Bot size={18} /> : <User size={18} />}
              </div>

              <div>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    borderTopLeftRadius: isBot ? '4px' : '14px',
                    borderTopRightRadius: !isBot ? '4px' : '14px',
                    background: isBot
                      ? 'rgba(18, 17, 30, 0.88)'
                      : 'linear-gradient(135deg, rgba(139, 120, 198, 0.35), rgba(101, 104, 168, 0.25))',
                    border: `1px solid ${isBot ? 'rgba(255, 255, 255, 0.08)' : 'rgba(139, 120, 198, 0.3)'}`,
                    color: '#F2F0F8',
                    fontSize: '0.94rem',
                    lineHeight: 1.55,
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#6B667F',
                    marginTop: '4px',
                    textAlign: isBot ? 'left' : 'right',
                    padding: '0 4px',
                  }}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(139, 120, 198, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B78C6',
              }}
            >
              <Bot size={18} />
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(18, 17, 30, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#AAA5BC',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={14} className="spin" />
              <span>Verifying request with backend...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            background: 'var(--error-bg)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            padding: '10px 16px',
            fontSize: '0.88rem',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dynamic Input Control based on Current Step */}
      <div
        className="glass-card"
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '18px 24px',
          backgroundColor: 'rgba(12, 11, 20, 0.95)',
        }}
      >
        {/* STEP 1: EMAIL INPUT */}
        {step === 'EMAIL' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter demo email (e.g., student@example.test)..."
              disabled={isLoading}
              required
              style={{
                flex: 1,
                background: 'rgba(7, 7, 13, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#F2F0F8',
                fontSize: '0.94rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="btn-primary"
              style={{ padding: '12px 22px' }}
            >
              <span>Request OTP</span>
              <Send size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP passcode..."
                disabled={isLoading}
                required
                style={{
                  flex: 1,
                  background: 'rgba(7, 7, 13, 0.7)',
                  border: '1px solid rgba(139, 120, 198, 0.4)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#F2F0F8',
                  fontSize: '1.2rem',
                  letterSpacing: '4px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || otp.trim().length !== 6}
                className="btn-primary"
                style={{ padding: '12px 22px' }}
              >
                <span>Verify Code</span>
                <KeyRound size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#AAA5BC' }}>
              <span>Code expires in 5 minutes. Max 5 attempts.</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#6B667F' : '#8B78C6',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem',
                  textDecoration: 'underline',
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD INPUT */}
        {step === 'NEW_PASSWORD' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars, 1 uppercase, 1 digit)"
                  disabled={isLoading}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(7, 7, 13, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '12px 40px 12px 14px',
                    color: '#F2F0F8',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#AAA5BC',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(7, 7, 13, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#F2F0F8',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <span>Save New Password</span>
                <Lock size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS VIEW */}
        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4ADE80',
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              <CheckCircle2 size={24} />
              Password Reset Successful!
            </div>
            <p style={{ color: '#AAA5BC', fontSize: '0.9rem', marginBottom: '16px' }}>
              Your account password has been re-hashed with Argon2id and committed transactionally to SQLite.
            </p>
            <button onClick={handleStartOver} className="btn-secondary" style={{ padding: '10px 22px' }}>
              <span>Reset Another Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
