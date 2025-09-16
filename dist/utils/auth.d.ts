/**
 * Authentication Utilities - JWT handling and identity fetching
 */
import type { Env } from '../types/index.js';
export declare function extractDeviceIdFromJWT(accessToken: string): string | null;
export declare function fetchIdentity(request: Request, env: Env, retries?: number): Promise<Response>;
//# sourceMappingURL=auth.d.ts.map