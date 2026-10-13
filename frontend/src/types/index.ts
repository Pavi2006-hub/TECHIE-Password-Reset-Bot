export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface ChatMessageItem {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionHint?: string;
}

export interface AuditLogItem {
  id: number;
  event_id: string;
  request_id: string | null;
  masked_email: string;
  event_type: string;
  outcome: string;
  timestamp: string;
  safe_metadata: string | null;
}

export interface AuditSummary {
  total_events: number;
  total_requests: number;
  successful_resets: number;
  failed_attempts: number;
  expired_challenges: number;
}

export interface AuditLogsResponse {
  total: number;
  limit: number;
  offset: number;
  logs: AuditLogItem[];
}

export type ActiveTab = 'home' | 'bot' | 'how-it-works' | 'audit-logs';
