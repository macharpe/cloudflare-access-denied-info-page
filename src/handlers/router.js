/**
 * Request Router - Handles all incoming requests and routes them appropriately
 */

import { handleUserDetails, handleHistoryRequest, handleNetworkInfo, handleEnvRequest, handleIdpDetailsRequest } from './api.js';
import { generateAccessDeniedHTML } from '../templates/access-denied.js';
import { getCorsHeaders } from '../utils/cors.js';

export async function handleRequest(eventOrRequest, env, _context) {
  // Handle both calling patterns: event listener and export default fetch
  let request, environment;

  if (eventOrRequest.request) {
    // Called from addEventListener - event object
    request = eventOrRequest.request;
    environment = eventOrRequest.env;
  } else {
    // Called from export default fetch - direct parameters
    request = eventOrRequest;
    environment = env;
  }

  const url = new URL(request.url);

  // API endpoint routing
  if (url.pathname === '/api/userdetails') {
    return handleUserDetails(request, environment);
  } else if (url.pathname === '/api/history') {
    return handleHistoryRequest(request, environment);
  } else if (url.pathname === '/api/networkinfo') {
    return handleNetworkInfo(request, environment);
  } else if (url.pathname === '/api/env') {
    return handleEnvRequest(request, environment);
  } else if (url.pathname === '/api/idpdetails') {
    return handleIdpDetailsRequest(request, environment);
  } else if (url.pathname === '/api/js') {
    return handleJavaScript(request, environment);
  } else {
    return handleStaticContent(request, environment);
  }
}

// Handle JavaScript endpoint for backwards compatibility
async function handleJavaScript(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return new Response('// JavaScript is now inline in HTML template', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript'
      }
    });
  } catch (error) {
    return new Response('// Error loading JavaScript: ' + error.message, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/javascript'
      }
    });
  }
}

// Handle static content (HTML page)
async function handleStaticContent(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  try {
    const htmlContent = generateAccessDeniedHTML();

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    return new Response(`Error creating inline HTML: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}