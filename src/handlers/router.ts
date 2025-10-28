import { CloudflareEnv } from "../types";
import {
  handleUserDetails,
  handleHistoryRequest,
  handleNetworkInfo,
  handleEnvRequest,
  handleIdpDetailsRequest
} from "./api";
import { generateAccessDeniedPage, handleJavaScript } from "../templates/access-denied";

export async function handleRequest(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  // API endpoints
  if (url.pathname === "/api/userdetails") {
    return handleUserDetails(request, env, ctx);
  }

  if (url.pathname === "/api/history") {
    return handleHistoryRequest(request, env);
  }

  if (url.pathname === "/api/networkinfo") {
    return handleNetworkInfo(request, env);
  }

  if (url.pathname === "/api/env") {
    return handleEnvRequest(request, env);
  }

  if (url.pathname === "/api/idpdetails") {
    return handleIdpDetailsRequest(request, env);
  }

  if (url.pathname === "/api/js") {
    return handleJavaScript(request, env);
  }

  // Favicon handler with long-term caching
  if (url.pathname === "/favicon.ico") {
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "public, max-age=604800, immutable", // 7 days
      },
    });
  }

  // Main page and all other routes
  return generateAccessDeniedPage(request, env);
}