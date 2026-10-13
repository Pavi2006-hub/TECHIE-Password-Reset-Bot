import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Lock, CheckCircle2, XCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { AuditLogItem, AuditSummary } from '../types';
import { fetchAuditSummary, fetchAuditLogs } from '../services/api';

export const AuditDashboard: React.FC = () => {
  // Demo admin credentials state
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('TechieAdmin2026!');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [searchRequestId, setSearchRequestId] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const loadData = async (user = adminUser, pass = adminPass) => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = await fetchAuditSummary(user, pass);
      setSummary(summaryData);

      const logsData = await fetchAuditLogs(user, pass, {
        event_type: eventTypeFilter || undefined,
        outcome: outcomeFilter || undefined,
        request_id: searchRequestId || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
      });

      setLogs(logsData.logs);
      setTotalLogs(logsData.total);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err: any) {
      if (err.message && err.message.includes('Authentication')) {
        setIsAuthenticated(false);
        setAuthError(err.message);
      } else {
        setError(err.message || 'Error fetching audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [eventTypeFilter, outcomeFilter, currentPage]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadData(adminUser, adminPass);
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(139, 120, 198, 0.1)',
            border: '1px solid rgba(139, 120, 198, 0.28)',
            color: '#8B78C6',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          <ShieldCheck size={14} />
          SECURITY AUDIT TRAIL
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: '#F2F0F8', marginBottom: '8px' }}>
          Audit & Activity Records
        </h1>
        <p style={{ color: '#AAA5BC', fontSize: '1rem' }}>
          Real-time, database-backed security ledger tracking recovery requests, OTP verifications, and credential changes.
        </p>
      </div>

      {/* Admin Login Dialog if unauthenticated */}
      {!isAuthenticated ? (
        <div className="glass-card" style={{ maxWidth: '480px', margin: '40px auto', padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(139, 120, 198, 0.18)',
                border: '1px solid rgba(139, 120, 198, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B78C6',
                marginBottom: '16px',
              }}
            >
              <Lock size={22} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#F2F0F8', marginBottom: '6px' }}>
              Administrator Authentication
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#AAA5BC' }}>
              Detailed audit records are restricted. Enter local demo credentials to view the ledger.
            </p>
          </div>

          {authError && (
            <div
              style={{
                background: 'var(--error-bg)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                padding: '10px 14px',
                fontSize: '0.85rem',
                color: '#F87171',
                borderRadius: '8px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#AAA5BC', marginBottom: '6px' }}>
                Admin Username
              </label>
              <input
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(7, 7, 13, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#F2F0F8',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#AAA5BC', marginBottom: '6px' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(7, 7, 13, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 42px 10px 14px',
                    color: '#F2F0F8',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((prev) => !prev)}
                  aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                  title={showAdminPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: showAdminPassword ? '#8B78C6' : '#AAA5BC',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                >
                  {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6B667F', marginTop: '4px', display: 'block' }}>
                Default demo credentials: <code>admin</code> / <code>TechieAdmin2026!</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '8px', width: '100%' }}
            >
              {loading ? 'Authenticating...' : 'Unlock Audit Dashboard'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          {summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: '#AAA5BC', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Total Security Events
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F2F0F8', marginTop: '6px' }}>
                  {summary.total_events}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: '#AAA5BC', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Reset Requests
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#8B78C6', marginTop: '6px' }}>
                  {summary.total_requests}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: '#AAA5BC', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Successful Resets
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#4ADE80', marginTop: '6px' }}>
                  {summary.successful_resets}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: '#AAA5BC', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Failed Verifications
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F87171', marginTop: '6px' }}>
                  {summary.failed_attempts}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ color: '#AAA5BC', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  Expired Challenges
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#AAA5BC', marginTop: '6px' }}>
                  {summary.expired_challenges}
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div
            className="glass-card"
            style={{
              padding: '18px 24px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAA5BC', fontSize: '0.88rem' }}>
                <Filter size={15} />
                <span>Filters:</span>
              </div>

              <select
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  background: 'rgba(7, 7, 13, 0.8)',
                  color: '#F2F0F8',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="">All Event Types</option>
                <option value="RESET_REQUESTED">RESET_REQUESTED</option>
                <option value="OTP_SENT">OTP_SENT</option>
                <option value="OTP_VERIFICATION_FAILED">OTP_VERIFICATION_FAILED</option>
                <option value="OTP_VERIFICATION_SUCCEEDED">OTP_VERIFICATION_SUCCEEDED</option>
                <option value="PASSWORD_RESET_SUCCEEDED">PASSWORD_RESET_SUCCEEDED</option>
                <option value="OTP_EXPIRED">OTP_EXPIRED</option>
              </select>

              <select
                value={outcomeFilter}
                onChange={(e) => {
                  setOutcomeFilter(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  background: 'rgba(7, 7, 13, 0.8)',
                  color: '#F2F0F8',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="">All Outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>

              <input
                type="text"
                placeholder="Search Request ID..."
                value={searchRequestId}
                onChange={(e) => setSearchRequestId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(0);
                    loadData();
                  }
                }}
                style={{
                  background: 'rgba(7, 7, 13, 0.8)',
                  color: '#F2F0F8',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={() => loadData()}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh Records</span>
            </button>
          </div>

          {/* Table Card */}
          <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(7, 7, 13, 0.6)' }}>
                    <th style={{ padding: '14px 18px', color: '#AAA5BC', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: '14px 18px', color: '#AAA5BC', fontWeight: 600 }}>Account Identifier</th>
                    <th style={{ padding: '14px 18px', color: '#AAA5BC', fontWeight: 600 }}>Event Type</th>
                    <th style={{ padding: '14px 18px', color: '#AAA5BC', fontWeight: 600 }}>Outcome</th>
                    <th style={{ padding: '14px 18px', color: '#AAA5BC', fontWeight: 600 }}>Request ID</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#AAA5BC' }}>
                        Loading audit ledger records...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#F87171' }}>
                        {error}
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#6B667F' }}>
                        No audit events match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isSuccess = log.outcome === 'SUCCESS';
                      const isFailed = log.outcome === 'FAILED' || log.outcome === 'BLOCKED';
                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.2s',
                          }}
                        >
                          <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#AAA5BC' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={13} color="#6B667F" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#F2F0F8', fontWeight: 500 }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                background: 'rgba(139, 120, 198, 0.12)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                              }}
                            >
                              {log.masked_email}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#F2F0F8' }}>
                            <span style={{ fontWeight: 600, color: '#8B78C6' }}>{log.event_type}</span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                background: isSuccess ? 'rgba(74, 222, 128, 0.12)' : isFailed ? 'rgba(248, 113, 113, 0.12)' : 'rgba(170, 165, 188, 0.12)',
                                color: isSuccess ? '#4ADE80' : isFailed ? '#F87171' : '#AAA5BC',
                                border: `1px solid ${isSuccess ? 'rgba(74, 222, 128, 0.25)' : isFailed ? 'rgba(248, 113, 113, 0.25)' : 'rgba(170, 165, 188, 0.25)'}`,
                              }}
                            >
                              {isSuccess ? <CheckCircle2 size={12} /> : isFailed ? <XCircle size={12} /> : null}
                              {log.outcome}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#6B667F' }}>
                            {log.request_id ? `${log.request_id.slice(0, 13)}...` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(7, 7, 13, 0.5)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.85rem',
                  color: '#AAA5BC',
                }}
              >
                <div>
                  Page {currentPage + 1} of {totalPages} ({totalLogs} total events)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0 || loading}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
