import { corsHeaders } from "./_shared/auth.ts";

interface FunctionModule {
  handleRequest: (req: Request) => Promise<Response>;
}

const routes = new Map<string, (req: Request) => Promise<Response>>();

async function loadFunctions() {
  for await (const entry of Deno.readDir("./")) {
    if (!entry.isDirectory) continue;
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    const indexPath = `./${entry.name}/index.ts`;
    try {
      const stat = await Deno.stat(indexPath);
      if (!stat.isFile) continue;
    } catch {
      continue;
    }

    try {
      const mod: FunctionModule = await import(indexPath);
      if (typeof mod.handleRequest === "function") {
        routes.set(entry.name, mod.handleRequest);
        console.log(`[gateway] registered: ${entry.name}`);
      }
    } catch (err) {
      console.error(`[gateway] failed to load ${entry.name}:`, err);
    }
  }

  console.log(
    `[gateway] loaded ${routes.size} functions: ${[...routes.keys()].join(", ")}`,
  );
}

async function main() {
  await loadFunctions();

  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const match = url.pathname.match(
      /\/functions\/v1\/([^\/]+)/,
    ) || url.pathname.match(/^\/([^\/]+)/);

    if (!match) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const functionName = match[1];
    const handler = routes.get(functionName);

    if (!handler) {
      return new Response(
        JSON.stringify({ error: `Function '${functionName}' not found` }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return handler(req);
  });
}

if (import.meta.main) {
  await main();
}