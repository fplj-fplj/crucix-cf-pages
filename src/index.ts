import { createRequestHandler } from "./api/health";
import { handleBriefingRequest } from "./api/briefing";
import { handleDeltaRequest } from "./api/delta";
import { handleMarketsRequest } from "./api/markets";
import { handleSweepRequest } from "./api/sweep";
import { handleSettingsGet, handleSettingsPut } from "./api/settings";
import { handleModelsRequest } from "./api/models";
import { handleTranslateRequest } from "./api/translate";
import { handleTelegramWebhook } from "./api/telegram/webhook";
import { handleTelegramRegister } from "./api/telegram/register";
import { handleDiscordInteraction } from "./api/discord/interaction";
import { handleDiscordRegister } from "./api/discord/register";
import { runCronSweep } from "./workers/cron-sweep";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method;

      // API Routes
      if (pathname === "/api/health") {
        return createRequestHandler()(request, env);
      }

      if (pathname === "/api/briefing") {
        return handleBriefingRequest(request, env);
      }

      if (pathname === "/api/delta") {
        return handleDeltaRequest(request, env);
      }

      if (pathname === "/api/markets") {
        return handleMarketsRequest(request, env);
      }

      if (pathname === "/api/sweep" && method === "POST") {
        return handleSweepRequest(request, env);
      }

      if (pathname === "/api/settings") {
        if (method === "PUT") {
          return handleSettingsPut(request, env);
        } else {
          return handleSettingsGet(request, env);
        }
      }

      if (pathname === "/api/models") {
        return handleModelsRequest(request, env);
      }

      if (pathname === "/api/translate" && method === "POST") {
        return handleTranslateRequest(request, env);
      }

      if (pathname === "/api/telegram/webhook" && method === "POST") {
        return handleTelegramWebhook(request, env, ctx);
      }

      if (pathname === "/api/telegram/register" && method === "POST") {
        return handleTelegramRegister(request, env);
      }

      if (pathname === "/api/discord/interaction" && method === "POST") {
        return handleDiscordInteraction(request, env);
      }

      if (pathname === "/api/discord/register" && method === "POST") {
        return handleDiscordRegister(request, env);
      }

      // Static assets from wrangler assets
      if (typeof (env as any).ASSETS?.fetch === "function") {
        return (env as any).ASSETS.fetch(request);
      }

      // Fallback for static assets
      return new Response(
        `<!DOCTYPE html><html><body><h1>Crucix Intelligence Terminal</h1></body></html>`,
        { status: 200, headers: { "content-type": "text/html" } }
      );
    } catch (error) {
      console.error("Error handling request:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },

  async scheduled(controller: any, env: Env, ctx: ExecutionContext): Promise<void> {
    await runCronSweep(env, ctx);
  },
} satisfies ExportedHandler<Env>;
