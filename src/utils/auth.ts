import { CloudflareEnv } from "../types";

export function extractAccessToken(request: Request): string | null {
  // Try to get JWT from header first
  let accessToken = request.headers.get("cf-access-jwt-assertion");

  // If JWT assertion header is missing, try to get it from cookies
  if (!accessToken) {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map(c => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith("CF_Authorization=")) {
          accessToken = cookie.split("=")[1];
          break;
        }
      }
    }
  }

  return accessToken;
}

export function getDeviceIdFromToken(jwt: string): string | null {
  const [, payload] = jwt.split(".");
  if (payload) {
    try {
      const decoded = JSON.parse(
        atob(payload.replace(/_/g, "/").replace(/-/g, "+"))
      );

      // Try multiple JWT fields for device ID
      // 1. Direct device_id field
      if (decoded.device_id) {
        return decoded.device_id;
      }

      // 2. device_sessions array (first session)
      if (decoded.device_sessions && Array.isArray(decoded.device_sessions) && decoded.device_sessions.length > 0) {
        const deviceSession = decoded.device_sessions[0];
        if (deviceSession && deviceSession.device_id) {
          return deviceSession.device_id;
        }
      }

      return null;
    } catch (_error) {
      return null;
    }
  }
  return null;
}

export function getJWTTimingData(jwt: string): { iat?: number; exp?: number } | null {
  const [, payload] = jwt.split(".");
  if (payload) {
    try {
      const decoded = JSON.parse(
        atob(payload.replace(/_/g, "/").replace(/-/g, "+"))
      );
      return {
        iat: decoded.iat || undefined,
        exp: decoded.exp || undefined
      };
    } catch (_error) {
      return null;
    }
  }
  return null;
}

export async function fetchWarpStatus(request: Request, env: CloudflareEnv, accessToken?: string): Promise<{ isWarp: boolean; isGateway: boolean }> {
  const token = accessToken || extractAccessToken(request);

  // Default to false if no token
  if (!token) {
    return { isWarp: false, isGateway: false };
  }

  const url = `https://${env.ORGANIZATION_NAME}.cloudflareaccess.com/cdn-cgi/trace`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Cookie: `CF_Authorization=${token}`,
      },
    });

    if (!response.ok) {
      return { isWarp: false, isGateway: false };
    }

    const textResponse = await response.text();

    // Parse trace response (format: key=value pairs separated by newlines)
    const traceData = textResponse.split("\n").reduce((acc, line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    return {
      isWarp: traceData.warp === "on",
      isGateway: traceData.gateway === "on",
    };
  } catch (_error) {
    // If trace endpoint fails, default to false
    return { isWarp: false, isGateway: false };
  }
}

export async function fetchIdentity(request: Request, env: CloudflareEnv, accessToken?: string): Promise<Response> {
  const token = accessToken || extractAccessToken(request);

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `https://${env.ORGANIZATION_NAME}.cloudflareaccess.com/cdn-cgi/access/get-identity`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `CF_Authorization=${token}`,
      },
    });

    const textResponse = await response.text();

    try {
      const jsonResponse = JSON.parse(textResponse);
      return new Response(JSON.stringify(jsonResponse), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Failed to parse identity response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch identity" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}