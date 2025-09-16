import { CloudflareEnv, UserData, LoginEvent, NetworkInfo, IdpDetails } from "../types";
import { getCorsHeaders } from "../utils/cors";
import { extractAccessToken, getDeviceIdFromToken, fetchIdentity } from "../utils/auth";

export async function handleUserDetails(request: Request, env: CloudflareEnv): Promise<Response> {
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

  let deviceId = getDeviceIdFromToken(accessToken);

  if (!deviceId) {
    const identityResponse = await fetchIdentity(request, env, accessToken);
    if (!identityResponse.ok) {
      return identityResponse;
    }

    const identityData: any = await identityResponse.json();
    deviceId = identityData?.identity?.device_id;

    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: "Device ID not found in identity data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  try {
    const identityResponse = await fetchIdentity(request, env, accessToken);
    if (!identityResponse.ok) {
      return identityResponse;
    }

    const identityData: any = await identityResponse.json();

    const deviceDetailsResponse = await fetchDeviceDetails(
      identityData.gateway_account_id,
      deviceId,
      env
    );

    let deviceDetailsData: any = {};
    if (deviceDetailsResponse.ok) {
      deviceDetailsData = await deviceDetailsResponse.json();
    }

    const devicePostureResponse = await fetchDevicePosture(
      identityData.gateway_account_id,
      deviceId,
      env
    );

    let devicePostureData: any = {};
    if (devicePostureResponse.ok) {
      devicePostureData = await devicePostureResponse.json();
    }

    const combinedData: UserData = {
      identity: identityData,
      device: deviceDetailsData,
      posture: devicePostureData,
    };

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    const userDetailsResponse = await handleUserDetails(request, env);

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Detect browser from User-Agent
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browser = userAgent.includes("Chrome/") ? "Chrome " + userAgent.match(/Chrome\/([0-9.]+)/)?.[1]?.split(".")[0] : "Chrome";
    } else if (userAgent.includes("Firefox")) {
      browser = userAgent.includes("Firefox/") ? "Firefox " + userAgent.match(/Firefox\/([0-9.]+)/)?.[1]?.split(".")[0] : "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browser = userAgent.includes("Version/") ? "Safari " + userAgent.match(/Version\/([0-9.]+)/)?.[1]?.split(".")[0] : "Safari";
    } else if (userAgent.includes("Edg")) {
      browser = userAgent.includes("Edg/") ? "Edge " + userAgent.match(/Edg\/([0-9.]+)/)?.[1]?.split(".")[0] : "Edge";
    } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
      browser = "Opera";
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

    if (cfRayHeader && cfRayHeader.includes("-")) {
      const rayParts = cfRayHeader.split("-");
      if (rayParts.length > 1) {
        edgeLocation = rayParts[rayParts.length - 1].toUpperCase();
      }
    } else {
      if (country === "FR") {
        edgeLocation = city === "Paris" ? "CDG" : "CDG";
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

    const networkInfo: NetworkInfo = {
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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