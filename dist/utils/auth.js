/**
 * Authentication Utilities - JWT handling and identity fetching
 */
export function extractDeviceIdFromJWT(accessToken) {
    if (!accessToken)
        return null;
    try {
        // JWT tokens have three parts separated by dots
        const parts = accessToken.split('.');
        if (parts.length !== 3)
            return null;
        // The payload is the second part (index 1)
        const payload = parts[1];
        if (!payload)
            return null;
        // Add padding if needed for proper base64 decoding
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        // Decode the base64 payload
        const decodedPayload = atob(paddedPayload);
        // Parse the JSON
        const decoded = JSON.parse(decodedPayload);
        return decoded.device_id ?? null; // Return device_id or null if not found
    }
    catch (_error) {
        // Failed to decode JWT
        return null;
    }
}
export async function fetchIdentity(request, env, retries = 1) {
    // Use provided access token, or fallback to extracting from request
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401
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
            status: 401
        });
    }
    const url = `https://${env.ORGANIZATION_NAME}.cloudflareaccess.com/cdn-cgi/access/get-identity`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `CF_Authorization=${accessCookie}`
            }
        });
        const textResponse = await response.text();
        // Check if the response is valid JSON
        try {
            const jsonResponse = JSON.parse(textResponse);
            return new Response(JSON.stringify(jsonResponse), {
                status: response.status
            });
        }
        catch (_e) {
            if (retries > 0) {
                return await fetchIdentity(request, env, retries - 1);
            }
            else {
                return new Response(JSON.stringify({ error: 'Failed to fetch identity after retrying.' }), { status: 500 });
            }
        }
    }
    catch (_error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch identity' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
//# sourceMappingURL=auth.js.map