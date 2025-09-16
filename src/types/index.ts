/**
 * Type definitions for Cloudflare Access Denied Page
 */

// Environment variables interface
export interface Env {
  BEARER_TOKEN: string;
  CORS_ORIGIN: string;
  ACCOUNT_ID: string;
  ORGANIZATION_NAME: string;
  ORGANIZATION_DOMAIN: string;
  ACCESS_DOMAIN: string;
  TARGET_GROUP: string;
  HISTORY_HOURS_BACK?: string;
}

// User identity data from Cloudflare Access
export interface UserIdentity {
  email: string;
  name: string;
  device_id?: string;
  groups?: string[];
}

// Device information from Cloudflare API
export interface DeviceInfo {
  device_model?: string;
  device_name?: string;
  device_os_version?: string;
  warp_connected?: boolean;
}

// Posture check result
export interface PostureCheckResult {
  success: boolean;
  rule_name?: string;
  rule_category?: string;
}

// Enhanced user data combining identity, device, and posture
export interface EnhancedUserData extends UserIdentity, DeviceInfo {
  posture_check_results?: PostureCheckResult[];
}

// Network information
export interface NetworkInfo {
  ip: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  connectionType: string;
  browser: string;
  edgeLocation: string;
  timestamp: string;
}

// Access audit log entry
export interface AccessAuditLog {
  app_uid: string;
  action: string;
  allowed: boolean;
  app_domain?: string;
  connection?: string;
  country?: string;
  created_at: string;
  user_email: string;
  ray_id?: string;
  ip_address?: string;
  app_name?: string;
  timestamp?: string;
}

// API response types
export interface HistoryResponse {
  failures: AccessAuditLog[];
}

export interface EnvResponse {
  ACCOUNT_ID: string;
  ORGANIZATION_NAME: string;
  TARGET_GROUP: string;
}

// GraphQL query variables
export interface AccessAuditLogsFilter {
  user_email: string;
  allowed: boolean;
  datetime_geq: string;
  datetime_leq: string;
}

export interface GraphQLQuery {
  query: string;
  variables: {
    accountId: string;
    filter: AccessAuditLogsFilter;
  };
}

// CORS headers type
export interface CorsHeaders {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Credentials': string;
}