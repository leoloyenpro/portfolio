const ADMIN_PASSWORD = "!Boulette081295";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── API ROUTES ───────────────────────────────────────────────
    if (path.startsWith("/api/")) {
      return handleAPI(request, env, path);
    }

    // ─── STATIC FILES (laisser Cloudflare Pages gérer) ───────────
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env, path) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // ─── AUTH ─────────────────────────────────────────────────────
  if (path === "/api/login") {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);
    const body = await request.json();
    if (body.password === ADMIN_PASSWORD) {
      return json({ success: true, token: btoa(ADMIN_PASSWORD + Date.now()) }, 200, headers);
    }
    return json({ error: "Mot de passe incorrect" }, 401, headers);
  }

  // ─── GET PROJETS (public) ─────────────────────────────────────
  if (path === "/api/projets" && request.method === "GET") {
    const data = await env.PORTFOLIO_PROJECTS.get("projets");
    const projets = data ? JSON.parse(data) : [];
    return json(projets, 200, headers);
  }

  // ─── ROUTES ADMIN (auth requise) ──────────────────────────────
  const auth = request.headers.get("Authorization");
  if (!auth) return json({ error: "Non autorisé" }, 401, headers);

  // ─── SAVE PROJETS ─────────────────────────────────────────────
  if (path === "/api/projets" && request.method === "POST") {
    const body = await request.json();
    await env.PORTFOLIO_PROJECTS.put("projets", JSON.stringify(body));
    return json({ success: true }, 200, headers);
  }

  return json({ error: "Not found" }, 404, headers);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}
