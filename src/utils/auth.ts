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
      return decoded.device_id || null;
    } catch (_error) {
      return null;
    }
  }
  return null;
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