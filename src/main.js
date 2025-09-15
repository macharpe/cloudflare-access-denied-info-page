
/* eslint-disable */

addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/api/userdetails") {
    event.respondWith(handleUserDetails(event.request));
  } else if (url.pathname === "/api/history") {
    event.respondWith(handleHistoryRequest(event.request));
  } else if (url.pathname === "/api/networkinfo") {
    event.respondWith(handleNetworkInfo(event.request));
  } else if (url.pathname === "/api/env") {
    event.respondWith(handleEnvRequest(event.request, event.env));
  } else if (url.pathname === "/api/js") {
    event.respondWith(handleJavaScript(event.request));
  } else {
    event.respondWith(handleEvent(event));
  }
});

// Expose worker env var via API endpoint (needed for frontend shenanigans)
// This also has the theme since its stored in kv upon configuration
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  
  // For same-origin requests (no Origin header), don't set CORS headers
  if (!origin) {
    return {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, cf-access-jwt-assertion, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };
  }
  
  // For cross-origin requests from macharpe.com domains, allow them
  if (origin.endsWith('.macharpe.com') || origin === 'https://macharpe.com' || origin === 'https://denied.macharpe.com') {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, cf-access-jwt-assertion, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };
  }
  
  // For any other origin, use the configured CORS_ORIGIN
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS", 
    "Access-Control-Allow-Headers": "Content-Type, cf-access-jwt-assertion, Cookie",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Network information endpoint - uses Cloudflare's CF-Connecting-IP and CF-IPCountry headers
async function handleNetworkInfo(request) {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
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
      ip: ip,
      country: country,
      city: city,
      region: region,
      isp: asOrganization,
      connectionType: connectionType,
      browser: browser,
      edgeLocation: edgeLocation,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(networkInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch network information" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// serve the environment config (configured in wrangler.jsonc) for the components to reference
// this includes worker settings and theme colors from environment variables
async function handleEnvRequest(request, env) {
  const corsHeaders = getCorsHeaders(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method === "GET") {
      // Return environment variables including theme colors from environment
      const envVars = {
        ACCOUNT_ID: ACCOUNT_ID,
        ORGANIZATION_NAME: ORGANIZATION_NAME,
        TARGET_GROUP: TARGET_GROUP,
        DEBUG: DEBUG,
        SUPPORT_EMAIL: SUPPORT_EMAIL,
        theme: {
          primaryColor: PRIMARY_COLOR || "#3498db",
          secondaryColor: SECONDARY_COLOR || "#2ecc71",
        },
      };

      return new Response(JSON.stringify(envVars), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}


// Handle /api/js endpoint to serve JavaScript content
async function handleJavaScript(request) {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate all JavaScript functions as separate strings to avoid template literal nesting
    const jsContent = [
      "// Access Denied Page JavaScript - Full Functionality",
      "",
      "function createAccessDeniedPage() {",
      "  const root = document.getElementById('root');",
      "  const htmlContent = [",
      "    '<div style=\"min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif; line-height: 1.6;\">',",
      "    '<div style=\"max-width: 1200px; margin: 0 auto; padding: 32px 24px;\">',",
      "    '<div style=\"text-align: center; margin-bottom: 48px;\">',",
      "    '<h1 style=\"font-size: 32px; line-height: 1.25; color: #0f172a; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.025em;\">Access Denied</h1>',",
      "    '<p style=\"font-size: 16px; line-height: 1.6; color: #64748b; max-width: 560px; margin: 0 auto;\">You do not have permission to access this resource. Here is information about your current session and device status.</p>',",
      "    '</div>',",
      "    '<div id=\"loading-message\" style=\"text-align: center; padding: 48px 24px;\">',",
      "    '<div style=\"display: inline-block; width: 40px; height: 40px; border: 3px solid #e2e8f0; border-radius: 50%; border-top-color: #3b82f6; animation: spin 800ms ease-in-out infinite;\"></div>',",
      "    '<p style=\"margin-top: 24px; color: #64748b; font-size: 14px; line-height: 1.5;\">Loading your identity and device information...</p>',",
      "    '</div>',",
      "    '<div id=\"content\" style=\"display: none;\">',",
      "    '<div style=\"display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px;\">',",
      "    '<div id=\"user-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',",
      "    '<div id=\"device-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',",
      "    '<div id=\"warp-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',",
      "    '<div id=\"network-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',",
      "    '<div id=\"posture-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',",
      "    '<div id=\"group-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',",
      "    '</div>',",
      "    '<div style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\">',",
      "    '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600; line-height: 1.4;\">Recent Access Attempts</h3>',",
      "    '<div id=\"history-info\"></div>',",
      "    '</div>',",
      "    '</div>',",
      "    '</div>',",
      "    '</div>',",
      "    '<style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>'",
      "  ];",
      "  root.innerHTML = htmlContent.join('');",
      "}",
      "",
      "// Load data from APIs",
      "async function loadUserData() {",
      "  try {",
      "    const [userResponse, historyResponse, envResponse, networkResponse] = await Promise.all([",
      "      fetch('/api/userdetails').catch(() => null),",
      "      fetch('/api/history').catch(() => null),",
      "      fetch('/api/env').catch(() => null),",
      "      fetch('/api/networkinfo').catch(() => null)",
      "    ]);",
      "",
      "    const userData = userResponse ? await userResponse.json() : null;",
      "    const historyData = historyResponse ? await historyResponse.json() : null;",
      "    const envData = envResponse ? await envResponse.json() : null;",
      "    const networkData = networkResponse ? await networkResponse.json() : null;",
      "",
      "    displayUserInfo(userData, envData);",
      "    displayDeviceInfo(userData);",
      "    displayWarpInfo(userData, envData);",
      "    displayNetworkInfo(networkData);",
      "    displayPostureInfo(userData);",
      "    displayGroupInfo(userData, envData);",
      "    displayHistory(historyData);",
      "",
      "    document.getElementById('loading-message').style.display = 'none';",
      "    document.getElementById('content').style.display = 'block';",
      "  } catch (error) {",
      "    document.getElementById('loading-message').innerHTML = '<div style=\"color: #dc2626; text-align: center; padding: 24px;\"><h3 style=\"font-size: 18px; font-weight: 600; margin-bottom: 8px;\">Loading Error</h3><p style=\"color: #6b7280; font-size: 14px;\">Failed to load information.</p></div>';",
      "  }",
      "}",
      "",
      "function displayUserInfo(userData, envData) {",
      "  const userInfoEl = document.getElementById('user-info');",
      "  const identity = userData?.identity;",
      "  ",
      "  // Try to get username from various possible fields",
      "  let username = null;",
      "  ",
      "  // Check all possible username fields in order of preference",
      "  // 1. Check custom attributes (Cloudflare Access custom fields)",
      "  username = username || identity?.custom?.username;",
      "  ",
      "  // 2. Check SAML attributes",
      "  if (!username && identity?.saml_attributes) {",
      "    // SAML attributes can be arrays or strings, handle both",
      "    const samlAttrs = identity.saml_attributes;",
      "    username = username || (Array.isArray(samlAttrs.username) ? samlAttrs.username[0] : samlAttrs.username);",
      "    username = username || (Array.isArray(samlAttrs.Username) ? samlAttrs.Username[0] : samlAttrs.Username);",
      "    username = username || (Array.isArray(samlAttrs.uid) ? samlAttrs.uid[0] : samlAttrs.uid);",
      "    username = username || (Array.isArray(samlAttrs.sAMAccountName) ? samlAttrs.sAMAccountName[0] : samlAttrs.sAMAccountName);",
      "  }",
      "  ",
      "  // 3. Fallback to standard JWT fields",
      "  username = username || identity?.preferred_username || identity?.username || identity?.sub;",
      "  ",
      "  // Final fallback - use full email as username",
      "  if (!username && identity?.email) {",
      "    username = identity.email;",
      "  }",
      "  ",
      "  // If username equals email, don't show 'Same as email' - just show the email",
      "  ",
      "  let userHtml = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">👤 User Information</h3>';",
      "  userHtml += '<div style=\"display: flex; flex-direction: column; gap: 12px;\">';",
      "  userHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Email:</span> <span style=\"color: #6b7280;\">' + (identity?.email || 'Not available') + '</span></div>';",
      "  userHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Username:</span> <span style=\"color: #6b7280;\">' + (username || 'Not available') + '</span></div>';",
      "  userHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Name:</span> <span style=\"color: #6b7280;\">' + (identity?.name || 'Not available') + '</span></div>';",
      "  userHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Organization:</span> <span style=\"color: #6b7280;\">' + (envData?.ORGANIZATION_NAME || 'Not available') + '</span></div>';",
      "  userHtml += '</div>';",
      "  ",
      "  userInfoEl.innerHTML = userHtml;",
      "}",
      "",
      "function displayDeviceInfo(userData) {",
      "  const deviceInfoEl = document.getElementById('device-info');",
      "  const device = userData?.device?.result;",
      "  const osDisplayName = detectCurrentOS(userData);",
      "  deviceInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">💻 Device Information</h3><div style=\"display: flex; flex-direction: column; gap: 12px;\"><div><span style=\"font-weight: 500; color: #374151;\">Model:</span> <span style=\"color: #6b7280;\">' + (device?.model || 'Not available') + '</span></div><div><span style=\"font-weight: 500; color: #374151;\">Name:</span> <span style=\"color: #6b7280;\">' + (device?.name || 'Not available') + '</span></div><div><span style=\"font-weight: 500; color: #374151;\">OS:</span> <span style=\"color: #6b7280;\">' + osDisplayName + '</span></div><div><span style=\"font-weight: 500; color: #374151;\">Version:</span> <span style=\"color: #6b7280;\">' + (device?.os_version || 'Not available') + '</span></div></div>';",
      "}",
      "",
      "function displayWarpInfo(userData, envData) {",
      "  const warpInfoEl = document.getElementById('warp-info');",
      "  const identity = userData?.identity;",
      "  const warpStatus = identity?.is_warp ? { text: 'Connected', color: '#059669', bg: '#d1fae5' } : { text: 'Disconnected', color: '#dc2626', bg: '#fee2e2' };",
      "  const gatewayStatus = identity?.is_gateway ? { text: 'Enabled', color: '#059669', bg: '#d1fae5' } : { text: 'Disabled', color: '#dc2626', bg: '#fee2e2' };",
      "  warpInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">🌐 WARP Status</h3><div style=\"display: flex; flex-direction: column; gap: 12px;\"><div style=\"display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 500; color: #374151;\">WARP:</span><span style=\"background: ' + warpStatus.bg + '; color: ' + warpStatus.color + '; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;\">' + warpStatus.text + '</span></div><div style=\"display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 500; color: #374151;\">Gateway:</span><span style=\"background: ' + gatewayStatus.bg + '; color: ' + gatewayStatus.color + '; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;\">' + gatewayStatus.text + '</span></div></div>';",
      "}",
      "",
      "function displayNetworkInfo(networkData) {",
      "  const networkInfoEl = document.getElementById('network-info');",
      "  ",
      "  if (!networkData) {",
      "    networkInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">🌐 Network Information</h3><div style=\"color: #6b7280; font-style: italic;\">Unable to load network information</div>';",
      "    return;",
      "  }",
      "  ",
      "  const ip = networkData.ip || 'Unknown';",
      "  const country = networkData.country || 'Unknown';",
      "  const city = networkData.city || 'Unknown';",
      "  const region = networkData.region || 'Unknown';",
      "  const isp = networkData.isp || 'Unknown';",
      "  const connectionType = networkData.connectionType || 'Unknown';",
      "  const browser = networkData.browser || 'Unknown';",
      "  const edgeLocation = networkData.edgeLocation || 'Unknown';",
      "  ",
      "  let networkHtml = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">🌐 Network Information</h3>';",
      "  networkHtml += '<div style=\"display: flex; flex-direction: column; gap: 12px;\">';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Public IP:</span> <span style=\"color: #6b7280; font-family: mono, monospace;\">' + ip + '</span></div>';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Location:</span> <span style=\"color: #6b7280;\">' + city + ', ' + country + '</span></div>';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Region:</span> <span style=\"color: #6b7280;\">' + region + '</span></div>';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">ISP:</span> <span style=\"color: #6b7280;\">' + isp + '</span></div>';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Browser:</span> <span style=\"color: #6b7280;\">' + browser + '</span></div>';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Connection:</span> <span style=\"color: #6b7280;\">' + connectionType + '</span></div>';",
      "  networkHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Edge Location:</span> <span style=\"color: #6b7280;\">' + edgeLocation + '</span></div>';",
      "  networkHtml += '</div>';",
      "  ",
      "  networkInfoEl.innerHTML = networkHtml;",
      "}",
      "",
      "function displayPostureInfo(userData) {",
      "  const postureInfoEl = document.getElementById('posture-info');",
      "  let posture = userData?.posture?.result || userData?.posture;",
      "  let postureArray = Array.isArray(posture) ? posture : (posture ? Object.values(posture).filter(check => check && typeof check === 'object') : []);",
      "  ",
      "  // Filter posture checks based on current OS",
      "  const currentOS = detectCurrentOS(userData);",
      "  const filteredPosture = filterRelevantPostureChecks(postureArray, currentOS);",
      "  ",
      "  if (filteredPosture.length > 0) {",
      "    const passCount = filteredPosture.filter(rule => rule.success).length;",
      "    const totalCount = filteredPosture.length;",
      "    const overallStatus = passCount === totalCount ? 'Compliant' : 'Non-compliant';",
      "    const overallColor = passCount === totalCount ? '#059669' : '#dc2626';",
      "    const overallBg = passCount === totalCount ? '#d1fae5' : '#fee2e2';",
      "    let statusHtml = '<div style=\"margin-bottom: 16px;\"><div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;\"><span style=\"font-weight: 600; color: #374151;\">Overall Status:</span><span style=\"background: ' + overallBg + '; color: ' + overallColor + '; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 600;\">' + overallStatus + '</span></div><div style=\"color: #6b7280; font-size: 14px; margin-bottom: 16px;\">' + passCount + ' of ' + totalCount + ' security checks passed</div></div>';",
      "    statusHtml += '<div style=\"display: flex; flex-direction: column; gap: 12px;\">';",
      "    filteredPosture.forEach(rule => {",
      "      const status = rule.success ? { text: 'Compliant', color: '#059669', bg: '#d1fae5' } : { text: 'Non-compliant', color: '#dc2626', bg: '#fee2e2' };",
      "      ",
      "      // Create descriptive names based on available data",
      "      let displayName = rule.type || 'Security Check';",
      "      let requirement = '';",
      "      ",
      "      // Use rule_name if available (most descriptive)",
      "      if (rule.rule_name) {",
      "        displayName = rule.rule_name;",
      "      }",
      "      ",
      "      // Add version/operator requirements where available",
      "      if (rule.input) {",
      "        if (rule.input.version && rule.input.operator) {",
      "          requirement = ' (' + rule.input.operator + ' ' + rule.input.version + ')';",
      "        } else if (rule.input.version) {",
      "          requirement = ' (' + rule.input.version + ')';",
      "        }",
      "      }",
      "      ",
      "      // Handle different rule types with better naming",
      "      if (rule.type === 'os_version') {",
      "        if (!rule.rule_name && rule.input && rule.input.version) {",
      "          if (rule.input.version.includes('18.4.1')) {",
      "            displayName = 'Latest version of iOS';",
      "          } else if (rule.input.version.includes('6.8.0')) {",
      "            displayName = 'Latest version of Linux Kernel';",
      "          } else if (rule.input.version.includes('10.0.26100')) {",
      "            displayName = 'Latest version of Windows';",
      "          } else if (rule.input.version.includes('15.6.1')) {",
      "            displayName = 'macOS Version Rule';",
      "          }",
      "        }",
      "      } else if (rule.type === 'disk_encryption') {",
      "        displayName = rule.rule_name || 'Disk Encryption macOS';",
      "      } else if (rule.type === 'application') {",
      "        displayName = rule.rule_name || 'Application Check';",
      "      } else if (rule.type === 'firewall') {",
      "        displayName = rule.rule_name || 'Firewall rule macOS';",
      "      }",
      "      ",
      "      const fullDisplayName = displayName + requirement;",
      "      statusHtml += '<div style=\"display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;\"><span style=\"font-weight: 500; color: #374151;\">' + fullDisplayName + ':</span><span style=\"background: ' + status.bg + '; color: ' + status.color + '; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;\">' + status.text + '</span></div>';",
      "    });",
      "    statusHtml += '</div>';",
      "    postureInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">⚖️ Device Compliance</h3>' + statusHtml;",
      "  } else {",
      "    postureInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">⚖️ Device Compliance</h3><div style=\"color: #6b7280; text-align: center; padding: 24px;\">No compliance information available</div>';",
      "  }",
      "}",
      "",
      "function displayGroupInfo(userData, envData) {",
      "  const groupInfoEl = document.getElementById('group-info');",
      "  const groups = userData?.identity?.groups || [];",
      "  const targetGroup = envData?.TARGET_GROUP;",
      "  if (groups.length > 0) {",
      "    let groupHtml = '<div style=\"display: flex; flex-direction: column; gap: 12px;\">';",
      "    groups.slice(0, 6).forEach(group => {",
      "      const isTargetGroup = group === targetGroup;",
      "      const status = isTargetGroup ? { text: 'Primary Group', color: '#059669', bg: '#d1fae5' } : { text: 'Member', color: '#6b7280', bg: '#f3f4f6' };",
      "      groupHtml += '<div style=\"display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 500; color: #374151;\">' + group + ':</span><span style=\"background: ' + status.bg + '; color: ' + status.color + '; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;\">' + status.text + '</span></div>';",
      "    });",
      "    if (groups.length > 6) {",
      "      groupHtml += '<div style=\"display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 500; color: #6b7280; font-style: italic;\">+' + (groups.length - 6) + ' more groups</span><span style=\"background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;\">...</span></div>';",
      "    }",
      "    groupHtml += '</div>';",
      "    groupInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">👥 Group Membership</h3>' + groupHtml;",
      "  } else {",
      "    groupInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">👥 Group Membership</h3><p style=\"color: #6b7280; font-style: italic;\">No group information available</p>';",
      "  }",
      "}",
      "",
      "function displayHistory(historyData) {",
      "  const historyInfoEl = document.getElementById('history-info');",
      "  const loginHistory = historyData?.loginHistory;",
      "  if (!loginHistory || loginHistory.length === 0) {",
      "    historyInfoEl.innerHTML = '<p style=\"color: #6b7280; font-style: italic; text-align: center; padding: 24px 0;\">No recent failed access attempts found.</p>';",
      "    return;",
      "  }",
      "  let historyHtml = '';",
      "  loginHistory.forEach((event, index) => {",
      "    const timestamp = new Date(event.dimensions.datetime).toLocaleString();",
      "    const isLast = index === loginHistory.length - 1;",
      "    historyHtml += '<div style=\"padding: 16px 0; ' + (!isLast ? 'border-bottom: 1px solid #e2e8f0;' : '') + '\"><div style=\"display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;\"><div style=\"flex: 1;\"><div style=\"font-weight: 600; color: #0f172a; margin-bottom: 8px;\">' + (event.applicationName || 'Unknown Application') + '</div><div style=\"color: #6b7280; font-size: 14px; line-height: 1.4;\"><div>' + timestamp + '</div><div style=\"margin-top: 4px;\">IP: ' + (event.dimensions.ipAddress || 'Unknown') + ' • ' + (event.dimensions.country || 'Unknown') + '</div></div></div><span style=\"background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; flex-shrink: 0;\">FAILED</span></div></div>';",
      "  });",
      "  historyInfoEl.innerHTML = historyHtml;",
      "}",
      "",
      "// Helper functions",
      "function detectCurrentOS(userData) {",
      "  const device = userData?.device?.result;",
      "  if (!device) return 'Unknown';",
      "  ",
      "  const model = device.model || '';",
      "  const version = device.os_version || '';",
      "  const osField = device.os || '';",
      "  ",
      "  // First, check OS version patterns (most reliable)",
      "  if (version.includes('10.0.') || version.includes('11.0.')) {",
      "    return 'Windows';",
      "  } else if (version.includes('15.') || version.includes('14.') || version.includes('13.')) {",
      "    return 'macOS';",
      "  } else if (version.includes('18.') || version.includes('17.') || version.includes('16.')) {",
      "    return 'iOS';",
      "  } else if (version.includes('6.') || version.includes('5.') || version.includes('4.')) {",
      "    return 'Linux';",
      "  }",
      "  ",
      "  // Check OS field if not virtualized",
      "  if (osField && !osField.toLowerCase().includes('vmware') && !osField.toLowerCase().includes('virtualbox')) {",
      "    return osField;",
      "  }",
      "  ",
      "  // Fallback to parsing device details",
      "  if (model.toLowerCase().includes('windows') || version.toLowerCase().includes('windows')) {",
      "    return 'Windows';",
      "  } else if (model.toLowerCase().includes('mac') || model.startsWith('Mac')) {",
      "    return 'macOS';",
      "  } else if (model.toLowerCase().includes('linux') || version.toLowerCase().includes('linux')) {",
      "    return 'Linux';",
      "  } else if (model.toLowerCase().includes('iphone') || model.toLowerCase().includes('ios')) {",
      "    return 'iOS';",
      "  } else if (model.toLowerCase().includes('android')) {",
      "    return 'Android';",
      "  }",
      "  ",
      "  return osField || model || 'Unknown';",
      "}",
      "",
      "// Filter posture checks based on current OS",
      "function filterRelevantPostureChecks(postureArray, currentOS) {",
      "  if (!Array.isArray(postureArray)) return [];",
      "  ",
      "  const osLower = currentOS.toLowerCase();",
      "  const isWindows = osLower.includes('windows');",
      "  const isMac = osLower.includes('mac') || osLower.includes('darwin');",
      "  const isLinux = osLower.includes('linux');",
      "  const isIOS = osLower.includes('ios');",
      "  const isAndroid = osLower.includes('android');",
      "  ",
      "  return postureArray.filter(check => {",
      "    if (!check || !check.type) return false;",
      "    ",
      "    const ruleName = (check.type || '').toLowerCase();",
      "    const ruleDesc = (check.description || '').toLowerCase();",
      "    const ruleNameFull = (check.rule_name || '').toLowerCase();",
      "    const ruleContent = ruleName + ' ' + ruleDesc + ' ' + ruleNameFull;",
      "    ",
      "    // Check version patterns for OS-specific rules",
      "    const version = check.input?.version || '';",
      "    const isIOSVersion = version.includes('18.4') || version.includes('17.') || version.includes('16.');",
      "    const isMacOSVersion = version.includes('15.6') || version.includes('14.') || version.includes('13.');",
      "    const isWindowsVersion = version.includes('10.0.') || version.includes('11.0.');",
      "    const isLinuxVersion = version.includes('6.8') || version.includes('5.') || version.includes('4.');",
      "    ",
      "    // Strict OS-specific filtering",
      "    if (isWindows) {",
      "      return ruleContent.includes('windows') || isWindowsVersion;",
      "    }",
      "    ",
      "    if (isMac) {",
      "      return ruleContent.includes('macos') || ruleContent.includes('timemachine') || ",
      "             ruleContent.includes('firewall') || isMacOSVersion ||",
      "             (check.type === 'disk_encryption' && !isIOSVersion && !isWindowsVersion && !isLinuxVersion);",
      "    }",
      "    ",
      "    if (isLinux) {",
      "      return ruleContent.includes('linux') || ruleContent.includes('kernel') || isLinuxVersion;",
      "    }",
      "    ",
      "    if (isIOS) {",
      "      return ruleContent.includes('ios') || isIOSVersion;",
      "    }",
      "    ",
      "    if (isAndroid) {",
      "      return ruleContent.includes('android');",
      "    }",
      "    ",
      "    // For unknown OS, only show rules that don't have specific OS indicators",
      "    return !isIOSVersion && !isMacOSVersion && !isWindowsVersion && !isLinuxVersion &&",
      "           !ruleContent.includes('windows') && !ruleContent.includes('macos') && ",
      "           !ruleContent.includes('linux') && !ruleContent.includes('ios') && !ruleContent.includes('android');",
      "  });",
      "}",
      "",
      "// Initialize the page",
      "if (document.readyState === 'loading') {",
      "  document.addEventListener('DOMContentLoaded', () => {",
      "    createAccessDeniedPage();",
      "    loadUserData();",
      "  });",
      "} else {",
      "  createAccessDeniedPage();",
      "  loadUserData();",
      "}"
    ].join('\n');

    return new Response(jsContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    return new Response("// Error loading JavaScript: " + error.message, {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
      },
    });
  }
}


// Serve inline HTML with embedded CSS and JS to bypass Access protection on static assets
async function serveInlineHTML() {
  try {
    // Read the CSS content
    const cssContent = `*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:after,:before{border:0 solid;box-sizing:border-box}:after,:before{--tw-content:""}:host,html{-webkit-text-size-adjust:100%;font-feature-settings:normal;-webkit-tap-highlight-color:transparent;font-family:Graphik,sans-serif;font-variation-settings:normal;line-height:1.5;tab-size:4}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-feature-settings:normal;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em;font-variation-settings:normal}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:initial}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-feature-settings:inherit;color:inherit;font-family:inherit;font-size:100%;font-variation-settings:inherit;font-weight:inherit;letter-spacing:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:initial;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:initial}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]:where(:not([hidden=until-found])){display:none}.container{width:100%}@media (min-width:640px){.container{max-width:640px}}@media (min-width:768px){.container{max-width:768px}}@media (min-width:1024px){.container{max-width:1024px}}@media (min-width:1280px){.container{max-width:1280px}}@media (min-width:1536px){.container{max-width:1536px}}.visible{visibility:visible}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.inset-0{inset:0}.left-0{left:0}.top-0{top:0}.z-50{z-index:50}.mx-auto{margin-left:auto;margin-right:auto}.my-4{margin-bottom:1rem;margin-top:1rem}.my-6{margin-bottom:1.5rem;margin-top:1.5rem}.mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-3{margin-bottom:.75rem}.mb-4{margin-bottom:1rem}.mb-5{margin-bottom:1.25rem}.mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.ml-14{margin-left:3.5rem}.mr-2{margin-right:.5rem}.mr-4{margin-right:1rem}.mt-2{margin-top:.5rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.inline-block{display:inline-block}.flex{display:flex}.table{display:table}.grid{display:grid}.hidden{display:none}.h-12{height:3rem}.h-40{height:10rem}.h-[4rem]{height:4rem}.h-full{height:100%}.max-h-24{max-height:6rem}.max-h-[3rem]{max-height:3rem}.min-h-[100px]{min-height:100px}.min-h-[2rem]{min-height:2rem}.min-h-screen{min-height:100vh}.w-12{width:3rem}.w-24{width:6rem}.w-40{width:10rem}.w-auto{width:auto}.w-full{width:100%}.max-w-7xl{max-width:80rem}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.table-auto{table-layout:auto}.border-collapse{border-collapse:collapse}.transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.cursor-not-allowed{cursor:not-allowed}.cursor-pointer{cursor:pointer}.list-none{list-style-type:none}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-4{gap:1rem}.space-x-2>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(.5rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(.5rem*var(--tw-space-x-reverse))}.space-x-4>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(1rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(1rem*var(--tw-space-x-reverse))}.space-x-6>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(1.5rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(1.5rem*var(--tw-space-x-reverse))}.space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(1rem*var(--tw-space-y-reverse));margin-top:calc(1rem*(1 - var(--tw-space-y-reverse)))}.overflow-hidden{overflow:hidden}.overflow-x-auto{overflow-x:auto}.rounded{border-radius:.25rem}.rounded-lg{border-radius:.5rem}.rounded-md{border-radius:.375rem}.rounded-t-md{border-top-left-radius:.375rem;border-top-right-radius:.375rem}.border{border-width:1px}.border-alert-green{--tw-border-opacity:1;border-color:#88f78c;border-color:rgb(136 247 140/var(--tw-border-opacity,1))}.border-dark-red{--tw-border-opacity:1;border-color:#b62226;border-color:rgb(182 34 38/var(--tw-border-opacity,1))}.border-gray-light{--tw-border-opacity:1;border-color:#e1e4e9;border-color:rgb(225 228 233/var(--tw-border-opacity,1))}.border-steel{--tw-border-opacity:1;border-color:#f7f7f8;border-color:rgb(247 247 248/var(--tw-border-opacity,1))}.border-warning{--tw-border-opacity:1;border-color:#8a6d3a;border-color:rgb(138 109 58/var(--tw-border-opacity,1))}.bg-alert-green{--tw-bg-opacity:1;background-color:#88f78c;background-color:rgb(136 247 140/var(--tw-bg-opacity,1))}.bg-dark-red{--tw-bg-opacity:1;background-color:#b62226;background-color:rgb(182 34 38/var(--tw-bg-opacity,1))}.bg-gray{--tw-bg-opacity:1;background-color:#e7e9ee;background-color:rgb(231 233 238/var(--tw-bg-opacity,1))}.bg-gray-light{--tw-bg-opacity:1;background-color:#e1e4e9;background-color:rgb(225 228 233/var(--tw-bg-opacity,1))}.bg-gunmetal{--tw-bg-opacity:1;background-color:#292c36;background-color:rgb(41 44 54/var(--tw-bg-opacity,1))}.bg-red{--tw-bg-opacity:1;background-color:#e72929;background-color:rgb(231 41 41/var(--tw-bg-opacity,1))}.bg-steel{--tw-bg-opacity:1;background-color:#f7f7f8;background-color:rgb(247 247 248/var(--tw-bg-opacity,1))}.bg-white{--tw-bg-opacity:1;background-color:#fff;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.bg-yellow{--tw-bg-opacity:1;background-color:#fcf8e3;background-color:rgb(252 248 227/var(--tw-bg-opacity,1))}.object-contain{object-fit:contain}.p-2{padding:.5rem}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.px-2.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.py-1{padding-bottom:.25rem;padding-top:.25rem}.py-2{padding-bottom:.5rem}.pt-2,.py-2{padding-top:.5rem}.text-center{text-align:center}.text-2xl{font-size:1.5rem;line-height:2rem}.text-4xl{font-size:2.25rem;line-height:2.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.font-bold{font-weight:700}.font-medium{font-weight:500}.font-semibold{font-weight:600}.leading-tight{line-height:1.25}.text-alert-green2{--tw-text-opacity:1;color:#3d803f;color:rgb(61 128 63/var(--tw-text-opacity,1))}.text-gray-dark{--tw-text-opacity:1;color:#273444;color:rgb(39 52 68/var(--tw-text-opacity,1))}.text-red{--tw-text-opacity:1;color:#e72929;color:rgb(231 41 41/var(--tw-text-opacity,1))}.text-roman-silver{--tw-text-opacity:1;color:#8e99ac;color:rgb(142 153 172/var(--tw-text-opacity,1))}.text-warning{--tw-text-opacity:1;color:#8a6d3a;color:rgb(138 109 58/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:#fff;color:rgb(255 255 255/var(--tw-text-opacity,1))}.underline{-webkit-text-decoration-line:underline;text-decoration-line:underline}.no-underline{-webkit-text-decoration-line:none;text-decoration-line:none}.opacity-0{opacity:0}.opacity-100{opacity:1}.opacity-50{opacity:.5}.drop-shadow-sm{--tw-drop-shadow:drop-shadow(0 1px 1px #0000000d)}.drop-shadow-sm,.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-duration:.15s;transition-property:color,background-color,border-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-text-decoration-color,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-text-decoration-color,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.transition-all{transition-duration:.15s;transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1)}.transition-opacity{transition-duration:.15s;transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1)}.duration-200{transition-duration:.2s}.duration-300{transition-duration:.3s}.duration-500{transition-duration:.5s}.ease-in-out{transition-timing-function:cubic-bezier(.4,0,.2,1)}.hover\\:bg-dark-red:hover{--tw-bg-opacity:1;background-color:#b62226;background-color:rgb(182 34 38/var(--tw-bg-opacity,1))}.hover\\:bg-white:hover{--tw-bg-opacity:1;background-color:#fff;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.hover\\:bg-opacity-20:hover{--tw-bg-opacity:0.2}.hover\\:bg-opacity-80:hover{--tw-bg-opacity:0.8}.focus\\:outline-none:focus{outline:2px solid #0000;outline-offset:2px}@media (min-width:640px){.sm\\:p-10{padding:2.5rem}}@media (min-width:768px){.md\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}.icon{display:inline-block;height:24px;margin-right:8px;vertical-align:middle;width:24px}.info-icon{background-color:grey;-webkit-mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>') no-repeat center /contain;mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>') no-repeat center /contain}.check-icon{background-color:green;-webkit-mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>') no-repeat center /contain;mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>') no-repeat center /contain}.cross-icon{background-color:red;-webkit-mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>') no-repeat center /contain;mask:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>') no-repeat center /contain}.tooltip{background-color:#fff;border-radius:4px;box-shadow:0 0 10px #0000001a;left:0;margin-top:5px;padding:8px;pointer-events:none;position:absolute;top:100%;z-index:9999}.truncate-text{display:inline-block;max-width:800px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;white-space:nowrap}.flex-container{display:flex;gap:4rem}.flex-item{align-items:stretch;display:flex;flex-direction:column;flex-grow:1;min-height:200px}.card-loading{background-color:initial;border:none;height:100%;padding:0}.card-normal{background-color:#fff;border:1px solid #d1d5db;border-radius:8px;max-height:250px;min-height:250px;overflow-y:auto}.card-error,.card-normal{box-shadow:0 2px 4px #0000001a;padding:20px}.card-error{background-color:#f6eeee;border:1px solid #ff4848;border-radius:8px;height:100%}:root{--loader-color:#3498db;--navigation-color:#2ecc71;--accent-color:#e74c3c}.loader{color:#3498db;color:var(--loader-color)}.navbar{background-color:#2ecc71;background-color:var(--navigation-color)}.accent{border-color:#e74c3c;border-color:var(--accent-color);color:#e74c3c;color:var(--accent-color)}.button:hover{background-color:#e74c3c;background-color:var(--accent-color);color:#fff}`;

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Cloudflare Access Denied - Identity Information"/><title>Access Denied - Identity Information</title><style>${cssContent}</style></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div><script id="api-js">
// API Endpoint for serving JS content without static file blocking
fetch('/api/js')
  .then(response => response.text())
  .then(jsContent => {
    const script = document.createElement('script');
    script.textContent = jsContent;
    document.head.appendChild(script);
  })
  .catch(error => {
    document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Loading Error</h1><p>Failed to load the application. Please refresh the page.</p></div>';
  });
</script></body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
    });
  } catch (error) {
    return new Response(`Error creating inline HTML: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// handle static pages
async function handleEvent(event) {
  const url = new URL(event.request.url);

  // For the main page or any unknown route, serve our inline HTML solution
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return serveInlineHTML();
  }

  // For any other route, serve inline HTML (handles all missing static assets)
  return serveInlineHTML();
}

// handle /api/userdetails + include user uuid for graphql
async function handleUserDetails(request) {
  const corsHeaders = getCorsHeaders(request);
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Step 1: Attempt to get device_id directly from the token
  let accessCookie = request.headers.get("cf-access-jwt-assertion");
  
  // If JWT assertion header is missing, try to get it from cookies
  if (!accessCookie) {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith('CF_Authorization=')) {
          accessCookie = cookie.split('=')[1];
          break;
        }
      }
    }
  }
  
  
  if (!accessCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized - JWT assertion missing" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Try to extract device_id from the token
  let device_id = getDeviceIdFromToken(accessCookie);

  if (!device_id) {
    // Fallback - fetch identity data from get-identity endpoint to retrieve device_id
    const identityResponse = await fetchIdentity(request, accessCookie);
    if (!identityResponse.ok) {
      return identityResponse;
    }

    const identityData = await identityResponse.json();
    device_id = identityData?.identity?.device_id;

    if (!device_id) {
      return new Response(
        JSON.stringify({ error: "Device ID not found in identity data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  try {
    // Proceed with the fetched or fallback device_id
    const identityResponse = await fetchIdentity(request, accessCookie);
    if (!identityResponse.ok) {
      return identityResponse;
    }

    const identityData = await identityResponse.json();


    const deviceDetailsResponse = await fetchDeviceDetails(
      identityData.gateway_account_id,
      device_id
    );

    let deviceDetailsData = {};
    if (deviceDetailsResponse.ok) {
      deviceDetailsData = await deviceDetailsResponse.json();
    }

    const devicePostureResponse = await fetchDevicePosture(
      identityData.gateway_account_id,
      device_id
    );

    let devicePostureData = {};
    if (devicePostureResponse.ok) {
      devicePostureData = await devicePostureResponse.json();
    }

    const combinedData = {
      identity: identityData,
      device: deviceDetailsData,
      posture: devicePostureData,
    };

    return new Response(JSON.stringify(combinedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Error in handleUserDetails
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// This is to assist handleUserDetails - getting the deviceid directly from the cfauth cookie
function getDeviceIdFromToken(jwt) {
  // eslint-disable-next-line
  const [header, payload, signature] = jwt.split(".");
  if (payload) {
    try {
      const decoded = JSON.parse(
        atob(payload.replace(/_/g, "/").replace(/-/g, "+"))
      );
      return decoded.device_id || null; // Return device_id or null if not found
    } catch (error) {
      // Failed to decode JWT
    }
  }
  return null;
}


// get-identity
async function fetchIdentity(request, accessToken = null, retries = 1) {
  // Use provided access token, or fallback to extracting from request
  let accessCookie = accessToken;
  if (!accessCookie) {
    accessCookie = request.headers.get("cf-access-jwt-assertion");
    
    // If JWT assertion header is missing, try to get it from cookies
    if (!accessCookie) {
      const cookieHeader = request.headers.get("Cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        for (const cookie of cookies) {
          if (cookie.startsWith('CF_Authorization=')) {
            accessCookie = cookie.split('=')[1];
            break;
          }
        }
      }
    }
  }
  
  if (!accessCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // eslint-disable-next-line
  const url = `https://${ORGANIZATION_NAME}.cloudflareaccess.com/cdn-cgi/access/get-identity`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: `CF_Authorization=${accessCookie}`,
      },
    });

    const textResponse = await response.text();

    // Check if the response is valid JSON
    try {
      const jsonResponse = JSON.parse(textResponse);
      return new Response(JSON.stringify(jsonResponse), {
        status: response.status,
      });
    } catch (e) {
      if (retries > 0) {
        return await fetchIdentity(request, retries - 1);
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to fetch identity after retrying." }),
          { status: 500 }
        );
      }
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch identity" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// api -> device information
async function fetchDeviceDetails(gateway_account_id, device_id) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${gateway_account_id}/devices/${device_id}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // eslint-disable-next-line
        Authorization: `Bearer ${BEARER_TOKEN}`,
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
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// api -> posture information
async function fetchDevicePosture(gateway_account_id, device_id) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${gateway_account_id}/devices/${device_id}/posture/check?enrich=true&_t=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        // eslint-disable-next-line
        Authorization: `Bearer ${BEARER_TOKEN}`,
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
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// graphql
// https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-access-login-events/
async function handleHistoryRequest(request) {
  const corsHeaders = getCorsHeaders(request);
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch user details to get `user_uuid` - will be used to filter
    const userDetailsResponse = await handleUserDetails(request);
    
    if (userDetailsResponse.status !== 200) {
      return new Response(JSON.stringify({ error: "Failed to get user details", status: userDetailsResponse.status }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const userDetailsData = await userDetailsResponse.json();
    const userUuid = userDetailsData.identity?.user_uuid;

    if (!userUuid) {
      return new Response(JSON.stringify({ error: "user_uuid not found", userDetailsData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* eslint-disable */

    const query = `
      query {
        viewer {
          accounts(filter: {accountTag: "${ACCOUNT_ID}"}) {
            accessLoginRequestsAdaptiveGroups(
              limit: 20,
              filter: {
                datetime_geq: "${new Date(Date.now() - 24 * 60 * 60000).toISOString()}",
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
      "https://api.cloudflare.com/client/v4/graphql",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch history data", details: errorText, status: response.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    if (data.errors && data.errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "GraphQL errors", details: data.errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const loginEvents =
      data?.data?.viewer?.accounts[0]?.accessLoginRequestsAdaptiveGroups || [];

    // Now, because we only have appId in graphQL, make another api request to get the readable name
    const appNames = await Promise.all(
      loginEvents.map(async (event) => {
        const appId = event.dimensions.appId;
        if (appId) {
          const appUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/access/apps/${appId}`;
          try {
            const appResponse = await fetch(appUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
              },
            });

            if (appResponse.ok) {
              const appData = await appResponse.json();
              return appData.result?.name || `Unknown App (${appResponse.status})`;
            } else {
              const errorText = await appResponse.text();
              return `Unknown App (${appResponse.status}: ${errorText.substring(0, 50)})`;
            }
          } catch (error) {
            return "Unknown App";
          }
        }
        return "No AppId";
      })
    );

    // Append the name to entry in the history endpoint
    const enhancedLoginEvents = loginEvents.map((event, index) => ({
      ...event,
      applicationName: appNames[index],
    }));
    /* eslint-disable */
    return new Response(JSON.stringify({ loginHistory: enhancedLoginEvents }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
