import { HealthStatus, AuditSummary, AuditLogsResponse } from '../types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://techie-password-reset-bot-1.onrender.com'
    : 'http://127.0.0.1:8000');

export interface RequestResetResponse {
  message: string;
  challenge_id: string;
  request_id: string;
}

export interface VerifyOtpResponse {
  message: string;
  reset_token: string;
  expires_in_seconds: number;
}

export interface ResetPasswordResponse {
  status: string;
  message: string;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: Failed to reach backend service`);
  }
  return response.json();
}

export async function requestPasswordReset(email: string): Promise<RequestResetResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to request password reset');
  }
  return data;
}

export async function verifyOtp(challenge_id: string, otp: string): Promise<VerifyOtpResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ challenge_id, otp }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'OTP verification failed');
  }
  return data;
}

export async function submitNewPassword(reset_token: string, new_password: string): Promise<ResetPasswordResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ reset_token, new_password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Password reset failed');
  }
  return data;
}

export async function resendOtp(challenge_id: string): Promise<RequestResetResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ challenge_id }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to resend verification code');
  }
  return data;
}

// Basic auth helper
function getAuthHeaders(user?: string, pass?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (user && pass) {
    const token = btoa(`${user}:${pass}`);
    headers['Authorization'] = `Basic ${token}`;
  }
  return headers;
}

export async function fetchAuditSummary(adminUser: string, adminPass: string): Promise<AuditSummary> {
  const response = await fetch(`${API_BASE_URL}/api/audit-logs/summary`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(adminUser, adminPass),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required: Invalid admin credentials');
    }
    throw new Error(`Failed to fetch audit summary (${response.status})`);
  }
  return response.json();
}

export async function fetchAuditLogs(
  adminUser: string,
  adminPass: string,
  params: {
    event_type?: string;
    outcome?: string;
    request_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<AuditLogsResponse> {
  const searchParams = new URLSearchParams();
  if (params.event_type) searchParams.append('event_type', params.event_type);
  if (params.outcome) searchParams.append('outcome', params.outcome);
  if (params.request_id) searchParams.append('request_id', params.request_id);
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) searchParams.append('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/audit-logs?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(adminUser, adminPass),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized: Please authenticate with valid administrator credentials');
    }
    throw new Error(`Failed to load audit records (${response.status})`);
  }
  return response.json();
}
