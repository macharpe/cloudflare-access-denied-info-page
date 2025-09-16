import { CloudflareEnv } from "../types";
import {
  handleUserDetails,
  handleHistoryRequest,
  handleNetworkInfo,
  handleEnvRequest,
  handleIdpDetailsRequest
} from "./api";
import { generateAccessDeniedPage, handleJavaScript } from "../templates/access-denied";

export async function handleRequest(request: Request, env: CloudflareEnv): Promise<Response> {
  const url = new URL(request.url);

  // API endpoints
  if (url.pathname === "/api/userdetails") {
    return handleUserDetails(request, env);
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

  // Main page and all other routes
  return generateAccessDeniedPage(request, env);
}