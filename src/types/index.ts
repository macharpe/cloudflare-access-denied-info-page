export interface CloudflareEnv {
  CORS_ORIGIN?: string;
  ACCOUNT_ID?: string;
  ORGANIZATION_NAME?: string;
  ORGANIZATION_DOMAIN?: string;
  ACCESS_DOMAIN?: string;
  TARGET_GROUP?: string;
  HISTORY_HOURS_BACK?: string;
  BEARER_TOKEN?: string;
}

export interface Identity {
  user_uuid?: string;
  email?: string;
  name?: string;
  username?: string;
  preferred_username?: string;
  sub?: string;
  groups?: string[];
  device_id?: string;
  is_warp?: boolean;
  is_gateway?: boolean;
  idp?: {
    id?: string;
    type?: string;
  };
  custom?: {
    username?: string;
  };
  saml_attributes?: {
    [key: string]: string | string[];
  };
  gateway_account_id?: string;
}

export interface Device {
  result?: {
    id?: string;
    name?: string;
    model?: string;
    os?: string;
    os_version?: string;
    version?: string;
    device_type?: string;
    profile_name?: string;
    service_mode_v2?: {
      mode?: string;
    };
  };
}

export interface PostureCheck {
  type?: string;
  rule_name?: string;
  description?: string;
  success?: boolean;
  input?: {
    version?: string;
    operator?: string;
  };
}

export interface PostureData {
  result?: PostureCheck[] | { [key: string]: PostureCheck };
}

export interface WarpModeInfo {
  mode: string | null; // null means mode will be determined client-side from /cdn-cgi/trace
  profileName: string;
  serviceMode: string | null;
  deviceType: string | null;
  clientVersion: string | null;
}

export interface UserData {
  identity?: Identity;
  device?: Device;
  posture?: PostureData;
  warpMode?: WarpModeInfo;
}

export interface LoginEvent {
  dimensions: {
    datetime: string;
    ipAddress?: string;
    country?: string;
    appId?: string;
    userUuid?: string;
    isSuccessfulLogin?: number;
    hasWarpEnabled?: boolean;
    hasGatewayEnabled?: boolean;
    identityProvider?: string;
    deviceId?: string;
    mtlsStatus?: string;
    approvingPolicyId?: string;
  };
  applicationName?: string;
}

export interface NetworkInfo {
  ip?: string;
  httpProtocol?: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  isp?: string;
  connectionType?: string;
  browser?: string;
  edgeLocation?: string;
  timestamp?: string;
}

export interface IdpDetails {
  id?: string;
  name?: string;
  type?: string;
}