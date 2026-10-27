const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization"
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (url.pathname === "/" && request.method === "GET") {
      return json({ ok: true, service: "FiberKZ API", version: "0.1.1", routes: ["/api/health", "/api/jobs"] });
    }
    try {
      if (url.pathname === "/api/health") return json({ ok: true, service: "FiberKZ API", version: "0.1.1" });
      if (url.pathname === "/api/jobs" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT id,address,work_type,technology,status,assigned_to,created_at FROM jobs ORDER BY created_at DESC LIMIT 100").all();
        return json({ jobs: result.results });
      }
      if (url.pathname === "/api/jobs" && request.method === "POST") {
        const body = await request.json();
        if (!body.address || !body.work_type) return json({ error: "address and work_type are required" }, 400);
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO jobs(id,address,work_type,technology,status,created_at) VALUES(?,?,?,?,?,datetime('now'))").bind(id, body.address, body.work_type, body.technology || "GPON", "new").run();
        return json({ id, status: "new" }, 201);
      }
      return json({ error: "Not found", path: url.pathname }, 404);
    } catch (error) {
      console.error("FiberKZ API error", error);
      return json({ error: "API request failed", detail: error instanceof Error ? error.message : String(error), hint: "Check D1 binding and apply schema.sql in the D1 Console." }, 500);
    }
  }
};
