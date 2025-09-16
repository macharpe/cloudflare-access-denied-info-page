import { CloudflareEnv } from "../types";

export function getCorsHeaders(request: Request, env: CloudflareEnv): Record<string, string> {
  const origin = request.headers.get("Origin");

  // For same-origin requests (no Origin header), don't set CORS headers
  if (!origin) {
    return {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, cf-access-jwt-assertion, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  // For cross-origin requests from macharpe.com domains, allow them
  if (origin.endsWith(".macharpe.com") || origin === "https://macharpe.com" || origin === "https://denied.macharpe.com") {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, cf-access-jwt-assertion, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };
  }

  // For any other origin, use the configured CORS_ORIGIN
  return {
    "Access-Control-Allow-Origin": env.CORS_ORIGIN || "https://denied.macharpe.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, cf-access-jwt-assertion, Cookie",
    "Access-Control-Allow-Credentials": "true",
  };
}