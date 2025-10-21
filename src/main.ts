import { CloudflareEnv } from "./types";
import { handleRequest } from "./handlers/router";

// Event listener for fetch events
addEventListener("fetch", (event: any) => {
  event.respondWith(handleRequest(event.request, event.env as CloudflareEnv, event));
});

// Export default handler for module workers
export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },
};