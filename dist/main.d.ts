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
declare const _default: {
    fetch: typeof handleRequest;
};
export default _default;
//# sourceMappingURL=main.d.ts.map