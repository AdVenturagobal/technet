const DEFAULT_PIXEL_ID = "1458255249041584";
const META_ACCESS_TOKEN =
  "EAAKlLZCwfU2wBQxkzCieUF8rs0W3hMRTRdlxsjaPZCbWxRt2QNmZC56q3zU6ZB1SMHu2ZCubvFQ0E11ZABhurL5nXousBEjK4ZAFWDwB3rCFMNgXKcL09z65mdluJryVf4qTj4tR3sRKCTSQEZBhsOGQo72fWdOkwMAi3KKEFACbshW2M05Ob7p9q9t6QHxbkhtAjQZDZD";

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "";
}

function sanitizeCustomData(input) {
  if (!input || typeof input !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).json({ ok: false, error: "Invalid JSON body" });
    return;
  }
  const eventName = body.eventName;
  const eventId = body.eventId;
  const pixelId = body.pixelId || DEFAULT_PIXEL_ID;
  const eventSourceUrl = body.eventSourceUrl || "";
  const customData = sanitizeCustomData(body.customData);

  if (!eventName || !eventId) {
    res.status(400).json({ ok: false, error: "Missing eventName or eventId" });
    return;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: eventId,
        event_source_url: eventSourceUrl,
        user_data: {
          client_ip_address: getClientIp(req),
          client_user_agent: req.headers["user-agent"] || ""
        },
        custom_data: customData
      }
    ],
    access_token: META_ACCESS_TOKEN
  };

  try {
    const apiResp = await fetch(`https://graph.facebook.com/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await apiResp.json();
    if (!apiResp.ok) {
      res.status(apiResp.status).json({ ok: false, meta: result });
      return;
    }

    res.status(200).json({ ok: true, meta: result });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Failed to send CAPI event",
      message: err instanceof Error ? err.message : "Unknown error"
    });
  }
};
