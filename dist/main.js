/**
 * Cloudflare Access Denied Page - Refactored Main Entry Point
 *
 * This file has been significantly refactored for better maintainability:
 * - Separated concerns into modules
 * - Proper template system instead of string concatenation
 * - Clean routing with dedicated handlers
 * - TypeScript for type safety
 */
import { handleRequest } from './handlers/router.js';
// Main event listener for Cloudflare Workers
addEventListener('fetch', (event) => {
    // Handle the request through our router with environment context
    event.respondWith(handleRequest(event));
});
// Export for TypeScript compatibility
export default {
    fetch: handleRequest
};
//# sourceMappingURL=main.js.map