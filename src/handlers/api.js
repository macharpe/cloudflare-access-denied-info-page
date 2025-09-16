/**
 * API Handlers - Separated from main.js for better maintainability
 */

import { getCorsHeaders } from '../utils/cors.js';
import { extractDeviceIdFromJWT, fetchIdentity } from '../utils/auth.js';

// Handle user details endpoint
export async function handleUserDetails(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Attempt to get device_id directly from the token
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cookies = cookieHeader.split(';');
    let accessCookie = null;

    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('CF_Authorization=')) {
        accessCookie = trimmedCookie.substring('CF_Authorization='.length);
        break;
      }
    }

    if (!accessCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to extract device_id from the token
    let device_id = extractDeviceIdFromJWT(accessCookie);

    // Step 2: If device_id not found, fetch identity data
    const identityResponse = await fetchIdentity(request, env);
    const identityText = await identityResponse.text();

    let identityData = {};
    try {
      identityData = JSON.parse(identityText);
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid identity data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use device_id from JWT if available, otherwise from identity
    if (!device_id) {
      device_id = identityData.device_id;
    }

    // Step 3: Enrich with device details and posture information
    const enrichedData = {
      identity: identityData
    };

    if (device_id && env.ACCOUNT_ID) {
      try {
        // Fetch device details
        const deviceResponse = await fetchDeviceDetails(env.ACCOUNT_ID, device_id, env);
        if (deviceResponse.ok) {
          const deviceData = await deviceResponse.json();
          enrichedData.device = deviceData;
        }

        // Fetch device posture
        const postureResponse = await fetchDevicePosture(env.ACCOUNT_ID, device_id, env);
        if (postureResponse.ok) {
          const postureData = await postureResponse.json();
          enrichedData.posture = postureData;
        }
      } catch (_error) {
        // Continue without device enrichment
      }
    }

    return new Response(JSON.stringify(enrichedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle history request endpoint
export async function handleHistoryRequest(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user details first to extract user UUID - using internal call to avoid CORS issues
    const userDetailsResponse = await handleUserDetails(request, env);

    if (!userDetailsResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to get user details', status: userDetailsResponse.status }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userDetailsData = await userDetailsResponse.json();
    // Try multiple possible locations for user UUID
    const userUuid = userDetailsData.identity?.user_uuid ||
                     userDetailsData.user_uuid ||
                     userDetailsData.custom?.user_uuid ||
                     userDetailsData.uid;

    if (!userUuid) {
      return new Response(JSON.stringify({
        error: 'user_uuid not found',
        debug: 'Available user data keys: ' + Object.keys(userDetailsData).join(', '),
        identity_keys: userDetailsData.identity ? Object.keys(userDetailsData.identity).join(', ') : 'no identity object'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use the correct GraphQL query structure from working GitHub version
    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${env.ACCOUNT_ID}"}) {
            accessLoginRequestsAdaptiveGroups(
              limit: 5,
              filter: {
                datetime_geq: "${new Date(Date.now() - (env.HISTORY_HOURS_BACK || 2) * 60 * 60000).toISOString()}",
                datetime_leq: "${new Date().toISOString()}",
                userUuid: "${userUuid}",
                isSuccessfulLogin: 0
              },
              orderBy: [datetime_DESC]
            ) {
              dimensions {
                datetime
                isSuccessfulLogin
                hasWarpEnabled
                hasGatewayEnabled
                ipAddress
                userUuid
                identityProvider
                country
                deviceId
                mtlsStatus
                approvingPolicyId
                appId
              }
            }
          }
        }
      }`;

    // Send request to Cloudflare's GraphQL API
    const response = await fetch(
      'https://api.cloudflare.com/client/v4/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: 'Failed to fetch history data', details: errorText, status: response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'GraphQL errors', details: data.errors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const loginEvents = data?.data?.viewer?.accounts[0]?.accessLoginRequestsAdaptiveGroups || [];

    // Fetch app names for each event
    const appNames = await Promise.all(
      loginEvents.map(async (event) => {
        const appId = event.dimensions.appId;
        if (appId) {
          const appUrl = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/access/apps/${appId}`;
          try {
            const appResponse = await fetch(appUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${env.BEARER_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });

            if (appResponse.ok) {
              const appData = await appResponse.json();
              return appData.result?.name || `Unknown App (${appResponse.status})`;
            } else {
              return `Unknown App (${appResponse.status})`;
            }
          } catch (_error) {
            return 'Unknown App';
          }
        }
        return 'No AppId';
      })
    );

    // Enhance login events with app names
    const enhancedLoginEvents = loginEvents.map((event, index) => ({
      ...event,
      applicationName: appNames[index]
    }));

    return new Response(JSON.stringify({ loginHistory: enhancedLoginEvents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network information endpoint - uses Cloudflare's CF-Connecting-IP and CF-IPCountry headers
export async function handleNetworkInfo(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP and location from Cloudflare headers
    const ip = request.headers.get('CF-Connecting-IP') || 'Unknown';
    const country = request.headers.get('CF-IPCountry') || 'Unknown';
    const city = request.headers.get('CF-IPCity') || 'Unknown';
    const region = request.headers.get('CF-Region') || 'Unknown';

    // Get ISP info from CF-ASOrganization header
    const asOrganization = request.headers.get('CF-ASOrganization') || 'Unknown';

    // Try to determine connection type based on available headers
    const userAgent = request.headers.get('User-Agent') || '';
    let connectionType = 'Unknown';
    let browser = 'Unknown';

    // Detect browser from User-Agent
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = userAgent.includes('Chrome/') ? 'Chrome ' + userAgent.match(/Chrome\/([0-9.]+)/)[1].split('.')[0] : 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = userAgent.includes('Firefox/') ? 'Firefox ' + userAgent.match(/Firefox\/([0-9.]+)/)[1].split('.')[0] : 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = userAgent.includes('Version/') ? 'Safari ' + userAgent.match(/Version\/([0-9.]+)/)[1].split('.')[0] : 'Safari';
    } else if (userAgent.includes('Edg')) {
      browser = userAgent.includes('Edg/') ? 'Edge ' + userAgent.match(/Edg\/([0-9.]+)/)[1].split('.')[0] : 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browser = 'Opera';
    }

    if (userAgent.includes('Mobile')) {
      connectionType = 'Mobile';
    } else if (asOrganization.toLowerCase().includes('vpn') ||
               asOrganization.toLowerCase().includes('proxy')) {
      connectionType = 'VPN/Proxy';
    } else if (asOrganization.toLowerCase().includes('cloud') ||
               asOrganization.toLowerCase().includes('hosting')) {
      connectionType = 'Cloud/Hosting';
    } else if (asOrganization.toLowerCase().includes('corp') ||
               asOrganization.toLowerCase().includes('enterprise')) {
      connectionType = 'Corporate';
    } else {
      connectionType = 'Broadband';
    }

    // Get Cloudflare edge location from CF-Ray header
    const cfRayHeader = request.headers.get('CF-Ray');
    let edgeLocation = 'Unknown';

    if (cfRayHeader && cfRayHeader.includes('-')) {
      const rayParts = cfRayHeader.split('-');
      if (rayParts.length > 1) {
        edgeLocation = rayParts[rayParts.length - 1].toUpperCase();
      }
    } else {
      // Fallback: Map known locations to their likely edge locations
      // Based on your Network tab showing CDG for Paris/France region
      if (country === 'FR') {
        if (city === 'Paris' || region.includes('Île-de-France')) {
          edgeLocation = 'CDG'; // Charles de Gaulle Airport
        } else if (city === 'Marseille') {
          edgeLocation = 'MRS'; // Marseille
        } else if (city === 'Lyon') {
          edgeLocation = 'LYS'; // Lyon
        } else {
          edgeLocation = 'CDG'; // Default to CDG for France
        }
      } else if (country === 'GB' || country === 'UK') {
        edgeLocation = 'LHR'; // London Heathrow
      } else if (country === 'DE') {
        edgeLocation = 'FRA'; // Frankfurt
      } else if (country === 'NL') {
        edgeLocation = 'AMS'; // Amsterdam
      } else if (country === 'US') {
        edgeLocation = 'LAX'; // Default to Los Angeles for US
      }
    }

    const networkInfo = {
      ip,
      country,
      city,
      region,
      isp: asOrganization,
      connectionType,
      browser,
      edgeLocation,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(networkInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch network information' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to extract device ID from JWT token
function _getDeviceIdFromToken(jwt) {
  const [_header, payload, _signature] = jwt.split('.');
  if (payload) {
    try {
      const decoded = JSON.parse(
        atob(payload.replace(/_/g, '/').replace(/-/g, '+'))
      );
      return decoded.device_id || null;
    } catch (_error) {
      return null;
    }
  }
  return null;
}

// Fetch device details from Cloudflare API
async function fetchDeviceDetails(accountId, deviceId, env) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/devices/${deviceId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.BEARER_TOKEN}`
      }
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch device details: ${error.message}`);
  }
}

// Fetch device posture from Cloudflare API
async function fetchDevicePosture(accountId, deviceId, env) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/devices/${deviceId}/posture/check?enrich=true&_t=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        Authorization: `Bearer ${env.BEARER_TOKEN}`
      }
    });

    return response;
  } catch (error) {
    throw new Error(`Failed to fetch device posture: ${error.message}`);
  }
}

// Handle environment variables endpoint
export async function handleEnvRequest(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const envData = {
      ORGANIZATION_NAME: env.ORGANIZATION_NAME || 'Organization',
      ORGANIZATION_DOMAIN: env.ORGANIZATION_DOMAIN || '',
      ACCESS_DOMAIN: env.ACCESS_DOMAIN || '',
      TARGET_GROUP: env.TARGET_GROUP || ''
    };

    return new Response(JSON.stringify(envData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Fetch Identity Provider details by ID
async function fetchIdpDetails(accountId, idpId, env) {
  if (!env.BEARER_TOKEN || !accountId || !idpId) {
    return null;
  }

  try {
    // Try direct approach first
    let response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/identity_providers/${idpId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.result;
    }

    // Fallback: list all IDPs and find by ID
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/identity_providers`,
      {
        headers: {
          'Authorization': `Bearer ${env.BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.result && Array.isArray(data.result)) {
        const foundIdp = data.result.find(idp => idp.id === idpId);
        if (foundIdp) {
          return foundIdp;
        }
      }
    }
  } catch (_error) {
    // Error occurred during IDP details fetch
  }

  return null;
}

// Handle IDP details request
export async function handleIdpDetailsRequest(request, env) {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const idpId = url.searchParams.get('id');

  if (!idpId) {
    return new Response(JSON.stringify({ error: 'IDP ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const idpDetails = await fetchIdpDetails(env.ACCOUNT_ID, idpId, env);

    if (!idpDetails) {
      return new Response(JSON.stringify({ error: 'IDP not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(idpDetails), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch IDP details' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
