import { CloudflareEnv, UserData, LoginEvent, NetworkInfo, IdpDetails } from "../types";
import { getCorsHeaders } from "../utils/cors";
import { extractAccessToken, getDeviceIdFromToken, fetchIdentity } from "../utils/auth";

function getTimezoneFromLocation(country: string, region: string, city: string): string {
  // Major timezone mappings based on country/region/city
  const countryTimezones: { [key: string]: string } = {
    "US": getUSTimezone(region, city),
    "CA": getCanadaTimezone(region),
    "GB": "Europe/London",
    "FR": "Europe/Paris",
    "DE": "Europe/Berlin",
    "IT": "Europe/Rome",
    "ES": "Europe/Madrid",
    "NL": "Europe/Amsterdam",
    "SE": "Europe/Stockholm",
    "NO": "Europe/Oslo",
    "DK": "Europe/Copenhagen",
    "FI": "Europe/Helsinki",
    "PL": "Europe/Warsaw",
    "CH": "Europe/Zurich",
    "AT": "Europe/Vienna",
    "BE": "Europe/Brussels",
    "IE": "Europe/Dublin",
    "PT": "Europe/Lisbon",
    "RU": "Europe/Moscow",
    "AU": getAustraliaTimezone(region, city),
    "JP": "Asia/Tokyo",
    "KR": "Asia/Seoul",
    "CN": "Asia/Shanghai",
    "IN": "Asia/Kolkata",
    "TH": "Asia/Bangkok",
    "SG": "Asia/Singapore",
    "MY": "Asia/Kuala_Lumpur",
    "PH": "Asia/Manila",
    "ID": "Asia/Jakarta",
    "VN": "Asia/Ho_Chi_Minh",
    "BR": getBrazilTimezone(region),
    "AR": "America/Argentina/Buenos_Aires",
    "MX": getMexicoTimezone(region),
    "CL": "America/Santiago",
    "CO": "America/Bogota",
    "PE": "America/Lima",
    "VE": "America/Caracas",
    "EG": "Africa/Cairo",
    "ZA": "Africa/Johannesburg",
    "NG": "Africa/Lagos",
    "KE": "Africa/Nairobi",
    "IL": "Asia/Jerusalem",
    "TR": "Europe/Istanbul",
    "SA": "Asia/Riyadh",
    "AE": "Asia/Dubai",
    "NZ": "Pacific/Auckland"
  };

  return countryTimezones[country] || "UTC";
}

function getUSTimezone(region: string, _city: string): string {
  const easternStates = ["NY", "FL", "GA", "NC", "SC", "VA", "MD", "DE", "NJ", "CT", "RI", "MA", "VT", "NH", "ME", "PA", "OH", "MI", "IN", "KY", "TN", "WV", "DC"];
  const centralStates = ["TX", "IL", "WI", "MN", "IA", "MO", "AR", "LA", "MS", "AL", "OK", "KS", "NE", "SD", "ND"];
  const mountainStates = ["CO", "WY", "UT", "NM", "AZ", "MT", "ID"];
  const pacificStates = ["CA", "OR", "WA", "NV"];
  const alaskaStates = ["AK"];
  const hawaiiStates = ["HI"];

  if (easternStates.includes(region)) return "America/New_York";
  if (centralStates.includes(region)) return "America/Chicago";
  if (mountainStates.includes(region)) return "America/Denver";
  if (pacificStates.includes(region)) return "America/Los_Angeles";
  if (alaskaStates.includes(region)) return "America/Anchorage";
  if (hawaiiStates.includes(region)) return "Pacific/Honolulu";

  return "America/New_York"; // Default to Eastern
}

function getCanadaTimezone(region: string): string {
  const timezones: { [key: string]: string } = {
    "BC": "America/Vancouver",
    "AB": "America/Edmonton",
    "SK": "America/Regina",
    "MB": "America/Winnipeg",
    "ON": "America/Toronto",
    "QC": "America/Montreal",
    "NB": "America/Moncton",
    "NS": "America/Halifax",
    "PE": "America/Halifax",
    "NL": "America/St_Johns",
    "NT": "America/Yellowknife",
    "NU": "America/Iqaluit",
    "YT": "America/Whitehorse"
  };

  return timezones[region] || "America/Toronto";
}

function getAustraliaTimezone(region: string, _city: string): string {
  const timezones: { [key: string]: string } = {
    "NSW": "Australia/Sydney",
    "VIC": "Australia/Melbourne",
    "QLD": "Australia/Brisbane",
    "SA": "Australia/Adelaide",
    "WA": "Australia/Perth",
    "TAS": "Australia/Hobart",
    "NT": "Australia/Darwin",
    "ACT": "Australia/Sydney"
  };

  return timezones[region] || "Australia/Sydney";
}

function getBrazilTimezone(region: string): string {
  // Most of Brazil uses Brasilia time, with some exceptions
  const amazonasStates = ["AM", "AC", "RO", "RR"];
  const fernadoStates = ["FN"]; // Fernando de Noronha

  if (amazonasStates.includes(region)) return "America/Manaus";
  if (fernadoStates.includes(region)) return "America/Noronha";

  return "America/Sao_Paulo"; // Most common
}

function getMexicoTimezone(region: string): string {
  const pacificStates = ["BC", "BCS", "SON", "SIN", "NAY"];
  const mountainStates = ["CHH", "COA", "NLE", "TAM"];

  if (pacificStates.includes(region)) return "America/Tijuana";
  if (mountainStates.includes(region)) return "America/Monterrey";

  return "America/Mexico_City"; // Central time, most common
}

export async function handleUserDetails(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized - JWT assertion missing" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Workers Cache API implementation
  const cache = (caches as any).default as Cache;

  // Create user-specific cache key using token hash
  const encoder = new TextEncoder();
  const data = encoder.encode(accessToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const cacheKey = new Request(`https://cache.internal/userdetails/${hashHex}`);

  // Try cache first
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const clonedResponse = new Response(cachedResponse.body, cachedResponse);
    clonedResponse.headers.set('x-cache-status', 'HIT');
    return clonedResponse;
  }

  let deviceId = getDeviceIdFromToken(accessToken);

  // Try to get device ID from identity if not in token
  if (!deviceId) {
    const identityResponse = await fetchIdentity(request, env, accessToken);
    if (!identityResponse.ok) {
      return identityResponse;
    }

    const identityData: any = await identityResponse.json();
    deviceId = identityData?.identity?.device_id;
    // Note: We don't return an error here if device ID is missing
    // Some users (like those with DNS-only WARP) may not have a device ID
  }

  try {
    const identityResponse = await fetchIdentity(request, env, accessToken);
    if (!identityResponse.ok) {
      return identityResponse;
    }

    const identityData: any = await identityResponse.json();

    // Only fetch device details if we have a device ID
    let deviceDetailsData: any = {};
    let devicePostureData: any = {};

    if (deviceId && identityData.gateway_account_id) {
      const deviceDetailsResponse = await fetchDeviceDetails(
        identityData.gateway_account_id,
        deviceId,
        env
      );

      if (deviceDetailsResponse.ok) {
        deviceDetailsData = await deviceDetailsResponse.json();
      }

      const devicePostureResponse = await fetchDevicePosture(
        identityData.gateway_account_id,
        deviceId,
        env
      );

      if (devicePostureResponse.ok) {
        devicePostureData = await devicePostureResponse.json();
      }
    }

    // Extract WARP mode information from device details
    const warpModeInfo = {
      mode: "Unknown",
      profileName: "Default",
      serviceMode: null as string | null,
      deviceType: null as string | null,
      clientVersion: null as string | null,
    };

    if (deviceDetailsData?.result) {
      const device = deviceDetailsData.result;

      // Extract service mode (e.g., "warp", "doh", "proxy")
      if (device.service_mode_v2?.mode) {
        warpModeInfo.serviceMode = device.service_mode_v2.mode;
      }

      // Extract profile name if available
      if (device.profile_name) {
        warpModeInfo.profileName = device.profile_name;
      }

      // Extract device type
      if (device.device_type) {
        warpModeInfo.deviceType = device.device_type;
      }

      // Extract client version
      if (device.version) {
        warpModeInfo.clientVersion = device.version;
      }

      // Determine user-friendly mode description
      const isWarp = identityData?.is_warp || false;
      const isGateway = identityData?.is_gateway || false;
      const serviceModeV2 = device.service_mode_v2?.mode?.toLowerCase();

      if (isGateway && isWarp) {
        // Full WARP mode with Gateway
        warpModeInfo.mode = "Gateway with WARP";
      } else if (isGateway && !isWarp) {
        // DNS-only mode
        warpModeInfo.mode = "Gateway with DoH";
      } else if (!isGateway && isWarp) {
        // WARP only (consumer mode)
        warpModeInfo.mode = "WARP (Consumer)";
      } else if (serviceModeV2 === "proxy") {
        // Proxy mode
        warpModeInfo.mode = "Proxy Mode";
      } else if (serviceModeV2 === "posture_only") {
        // Device information only mode
        warpModeInfo.mode = "Device Information Only";
      } else if (serviceModeV2 === "warp" && !isGateway) {
        // WARP without Gateway
        warpModeInfo.mode = "WARP without Gateway";
      } else if (serviceModeV2 === "doh") {
        // DoH mode
        warpModeInfo.mode = "Gateway with DoH";
      } else if (!isWarp && !isGateway && device.id) {
        // Device registered but not connected
        warpModeInfo.mode = "Registered (Not Connected)";
      } else {
        // Fallback to basic status
        warpModeInfo.mode = isWarp ? "WARP Connected" : "Disconnected";
      }
    }

    const combinedData: UserData = {
      identity: identityData,
      device: deviceDetailsData,
      posture: devicePostureData,
      warpMode: warpModeInfo,
    };

    const finalResponse = new Response(JSON.stringify(combinedData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",  // 30s browser cache
        "x-cache-status": "MISS"
      },
    });

    // Store in Workers Cache API (non-blocking)
    ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));

    return finalResponse;
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${(_error as Error).message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

export async function handleHistoryRequest(request: Request, env: CloudflareEnv): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a mock ExecutionContext for internal call
    const mockCtx = {
      waitUntil: (promise: Promise<any>) => promise,
      passThroughOnException: () => {},
      props: {},
    } as unknown as ExecutionContext;

    const userDetailsResponse = await handleUserDetails(request, env, mockCtx);

    if (userDetailsResponse.status !== 200) {
      return new Response(JSON.stringify({ error: "Failed to get user details" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userDetailsData: any = await userDetailsResponse.json();
    const userUuid = userDetailsData.identity?.user_uuid;

    if (!userUuid) {
      return new Response(JSON.stringify({ error: "user_uuid not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hoursBack = parseInt(env.HISTORY_HOURS_BACK || "2");
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${env.ACCOUNT_ID}"}) {
            accessLoginRequestsAdaptiveGroups(
              limit: 5,
              filter: {
                datetime_geq: "${startTime}",
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

    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch history data", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: any = await response.json();

    if (data.errors && data.errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "GraphQL errors", details: data.errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const loginEvents: LoginEvent[] = data?.data?.viewer?.accounts?.[0]?.accessLoginRequestsAdaptiveGroups || [];

    const appNames = await Promise.all(
      loginEvents.map(async (event) => {
        const appId = event.dimensions.appId;
        if (appId) {
          const appUrl = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/access/apps/${appId}`;
          try {
            const appResponse = await fetch(appUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${env.BEARER_TOKEN}`,
                "Content-Type": "application/json",
              },
            });

            if (appResponse.ok) {
              const appData: any = await appResponse.json();
              return appData.result?.name || "Unknown App";
            } else {
              return "Unknown App";
            }
          } catch (_error) {
            return "Unknown App";
          }
        }
        return "No AppId";
      })
    );

    const enhancedLoginEvents = loginEvents.map((event, index) => ({
      ...event,
      applicationName: appNames[index],
    }));

    return new Response(JSON.stringify({ loginHistory: enhancedLoginEvents }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30"  // 30 seconds browser cache
      },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: (_error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

export async function handleNetworkInfo(request: Request, env: CloudflareEnv): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = request.headers.get("CF-Connecting-IP") || "Unknown";
    const country = request.headers.get("CF-IPCountry") || "Unknown";
    const city = request.headers.get("CF-IPCity") || "Unknown";
    const region = request.headers.get("CF-Region") || "Unknown";
    const asOrganization = request.headers.get("CF-ASOrganization") || "Unknown";

    const userAgent = request.headers.get("User-Agent") || "";
    let connectionType = "Unknown";
    let browser = "Unknown";

    // Detect browser from User-Agent (check specific browsers first, then generic ones)
    if (userAgent.includes("Brave/")) {
      // Brave browser detection
      const version = userAgent.match(/Brave\/([0-9.]+)/)?.[1]?.split(".")[0];
      browser = version ? `Brave ${version}` : "Brave";
    } else if (userAgent.includes("Edg")) {
      browser = userAgent.includes("Edg/") ? "Edge " + userAgent.match(/Edg\/([0-9.]+)/)?.[1]?.split(".")[0] : "Edge";
    } else if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browser = userAgent.includes("Chrome/") ? "Chrome " + userAgent.match(/Chrome\/([0-9.]+)/)?.[1]?.split(".")[0] : "Chrome";
    } else if (userAgent.includes("Firefox")) {
      browser = userAgent.includes("Firefox/") ? "Firefox " + userAgent.match(/Firefox\/([0-9.]+)/)?.[1]?.split(".")[0] : "Firefox";
    } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
      browser = "Opera";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = userAgent.includes("Version/") ? "Safari " + userAgent.match(/Version\/([0-9.]+)/)?.[1]?.split(".")[0] : "Safari";
    }

    if (userAgent.includes("Mobile")) {
      connectionType = "Mobile";
    } else if (asOrganization.toLowerCase().includes("vpn") ||
               asOrganization.toLowerCase().includes("proxy")) {
      connectionType = "VPN/Proxy";
    } else if (asOrganization.toLowerCase().includes("cloud") ||
               asOrganization.toLowerCase().includes("hosting")) {
      connectionType = "Cloud/Hosting";
    } else if (asOrganization.toLowerCase().includes("corp") ||
               asOrganization.toLowerCase().includes("enterprise")) {
      connectionType = "Corporate";
    } else {
      connectionType = "Broadband";
    }

    const cfRayHeader = request.headers.get("CF-Ray");
    let edgeLocation = "Unknown";

    // First try to get colo from request.cf (most accurate)
    if (request.cf?.colo && typeof request.cf.colo === "string") {
      edgeLocation = request.cf.colo;
    } else if (cfRayHeader && cfRayHeader.includes("-")) {
      // Fallback to CF-Ray header
      const rayParts = cfRayHeader.split("-");
      if (rayParts.length > 1) {
        edgeLocation = rayParts[rayParts.length - 1].toUpperCase();
      }
    } else {
      // Final fallback based on location
      if (country === "FR") {
        edgeLocation = city === "Paris" ? "CDG" : "MRS";
      } else if (country === "GB" || country === "UK") {
        edgeLocation = "LHR";
      } else if (country === "DE") {
        edgeLocation = "FRA";
      } else if (country === "NL") {
        edgeLocation = "AMS";
      } else if (country === "US") {
        edgeLocation = "LAX";
      }
    }

    // Get HTTP protocol from request.cf
    let httpProtocol = "Unknown";
    if (request.cf?.httpProtocol && typeof request.cf.httpProtocol === "string") {
      httpProtocol = request.cf.httpProtocol;
    }

    // Detect timezone based on country and region
    const timezone = getTimezoneFromLocation(country, region, city);

    const networkInfo: NetworkInfo = {
      ip,
      httpProtocol,
      country,
      city,
      region,
      timezone,
      isp: asOrganization,
      connectionType,
      browser,
      edgeLocation,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(networkInfo), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30"  // 30 seconds browser cache
      },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Failed to fetch network information" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function handleEnvRequest(request: Request, env: CloudflareEnv): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const envVars = {
      ACCOUNT_ID: env.ACCOUNT_ID,
      ORGANIZATION_NAME: env.ORGANIZATION_NAME,
      TARGET_GROUP: env.TARGET_GROUP,
      HISTORY_HOURS_BACK: env.HISTORY_HOURS_BACK || "2"
    };

    return new Response(JSON.stringify(envVars), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=7200"  // 1hr browser, 2hr edge
      },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function fetchIdpDetails(idpId: string, env: CloudflareEnv): Promise<IdpDetails> {
  try {
    // Direct API call to get specific IDP
    const directUrl = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/access/identity_providers/${idpId}`;
    const directResponse = await fetch(directUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (directResponse.ok) {
      const directData: any = await directResponse.json();
      const provider = directData.result;
      return {
        id: provider.id,
        name: provider.name,
        type: provider.type
      };
    }

    // Fallback: list all IDPs and find the matching one
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/access/identity_providers`;
    const listResponse = await fetch(listUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (listResponse.ok) {
      const listData: any = await listResponse.json();
      const provider = listData.result?.find((p: any) => p.id === idpId);
      if (provider) {
        return {
          id: provider.id,
          name: provider.name,
          type: provider.type
        };
      }
    }

    return { id: idpId, name: "Unknown Provider", type: "Unknown" };
  } catch (_error) {
    return { id: idpId, name: "Unknown Provider", type: "Unknown" };
  }
}

export async function handleIdpDetailsRequest(request: Request, env: CloudflareEnv): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const idpId = url.searchParams.get("id");

    if (!idpId) {
      return new Response(JSON.stringify({ error: "IDP ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idpDetails = await fetchIdpDetails(idpId, env);

    return new Response(JSON.stringify(idpDetails), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=7200"  // 1hr browser, 2hr edge
      },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Failed to fetch IDP details" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function fetchDeviceDetails(gatewayAccountId: string, deviceId: string, env: CloudflareEnv): Promise<Response> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${gatewayAccountId}/devices/${deviceId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      return response;
    }

    const deviceDetails = await response.json();
    return new Response(JSON.stringify(deviceDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${(_error as Error).message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function fetchDevicePosture(gatewayAccountId: string, deviceId: string, env: CloudflareEnv): Promise<Response> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${gatewayAccountId}/devices/${deviceId}/posture/check?enrich=true&_t=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        Authorization: `Bearer ${env.BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      return response;
    }

    const devicePosture = await response.json();
    return new Response(JSON.stringify(devicePosture), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${(_error as Error).message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}