/**
 * CORS Utilities - Centralized CORS header management
 */
export function getCorsHeaders(request, env) {
    const origin = request.headers.get('Origin');
    // For same-origin requests (no Origin header), don't set CORS headers
    if (!origin) {
        return {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, cf-access-jwt-assertion, Cookie',
            'Access-Control-Allow-Credentials': 'true'
        };
    }
    // Build allowed domains dynamically from environment
    const organizationDomain = env?.ORGANIZATION_DOMAIN ?? 'example.com';
    const accessDomain = env?.ACCESS_DOMAIN;
    const corsOrigin = env?.CORS_ORIGIN;
    const allowedDomains = [
        `.${organizationDomain}`,
        `https://${organizationDomain}`
    ];
    // Add specific access domain if configured
    if (accessDomain && !allowedDomains.includes(`https://${accessDomain}`)) {
        allowedDomains.push(`https://${accessDomain}`);
    }
    // Add CORS_ORIGIN if configured and different
    if (corsOrigin && !allowedDomains.includes(corsOrigin)) {
        allowedDomains.push(corsOrigin);
    }
    const isAllowedDomain = allowedDomains.some(domain => domain.startsWith('.') ? origin.endsWith(domain) : origin === domain);
    if (isAllowedDomain) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, cf-access-jwt-assertion, Cookie',
            'Access-Control-Allow-Credentials': 'true'
        };
    }
    // For any other origin, use the configured CORS_ORIGIN or fallback
    return {
        'Access-Control-Allow-Origin': corsOrigin ?? '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, cf-access-jwt-assertion, Cookie',
        'Access-Control-Allow-Credentials': 'true'
    };
}
//# sourceMappingURL=cors.js.map