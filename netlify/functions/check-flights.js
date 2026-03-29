// Netlify Scheduled Function: check tracked flights and push alerts to LINE.
// Trigger manually: /.netlify/functions/check-flights

exports.config = {
  schedule: "*/15 * * * *", // every 15 minutes
};

exports.handler = async () => {
  try {
    const key = process.env.AVIATIONSTACK_API_KEY;
    if (!key) return json(500, { error: "Missing AVIATIONSTACK_API_KEY" });

    const tracked = (process.env.TRACKED_FLIGHTS || "").split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
    if (!tracked.length) return json(200, { ok: true, message: "No TRACKED_FLIGHTS configured" });

    const alertStatuses = new Set(
      (process.env.ALERT_STATUSES || "delayed,cancelled,diverted,incident")
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    );

    const forcePush = String(process.env.TEST_PUSH || "").trim() === "1";

    const summaries = [];
    const alerts = [];

    for (const flight of tracked) {
      const row = await fetchFlight(key, flight);
      if (!row) {
        summaries.push({ flight, found: false });
        continue;
      }

      const status = (row.flight_status || "unknown").toLowerCase();
      const summary = {
        flight: row.flight?.iata || flight,
        status,
        airline: row.airline?.name || "-",
        departure: row.departure?.iata || "-",
        arrival: row.arrival?.iata || "-",
        depEstimated: row.departure?.estimated || row.departure?.scheduled || null,
        arrEstimated: row.arrival?.estimated || row.arrival?.scheduled || null,
      };
      summaries.push(summary);

      if (alertStatuses.has(status)) alerts.push(summary);
    }

    let pushed = false;
    if (alerts.length || forcePush) {
      const message = forcePush
        ? buildTestMessage(summaries)
        : buildAlertMessage(alerts);
      await sendLine(message);
      pushed = true;
    }

    return json(200, {
      ok: true,
      tracked,
      checked: summaries.length,
      alerts: alerts.length,
      pushed,
      summaries,
    });
  } catch (err) {
    return json(500, { error: err.message || "Unexpected error" });
  }
};

async function fetchFlight(accessKey, flightIata) {
  const url = new URL("http://api.aviationstack.com/v1/flights");
  url.searchParams.set("access_key", accessKey);
  url.searchParams.set("flight_iata", flightIata);
  url.searchParams.set("limit", "1");

  const resp = await fetch(url.toString());
  const data = await resp.json();
  if (!resp.ok || data?.error) return null;
  return data?.data?.[0] || null;
}

function buildAlertMessage(items) {
  const lines = ["✈️ 航班異常提醒", ""]; 
  for (const x of items) {
    lines.push(`• ${x.flight} (${x.airline})`);
    lines.push(`  狀態: ${x.status}`);
    lines.push(`  航線: ${x.departure} → ${x.arrival}`);
    lines.push(`  預估: ${fmt(x.depEstimated)} → ${fmt(x.arrEstimated)}`);
    lines.push("");
  }
  return lines.join("\n");
}

function fmt(v) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("zh-TW", { hour12: false });
  } catch {
    return v;
  }
}

function buildTestMessage(summaries) {
  const lines = ["🧪 航班監控測試推播（TEST_PUSH=1）", ""];
  const top = summaries.slice(0, 3);
  for (const x of top) {
    if (!x || !x.flight) continue;
    lines.push(`• ${x.flight} (${x.airline || "-"})`);
    lines.push(`  狀態: ${x.status || "unknown"}`);
    lines.push(`  航線: ${x.departure || "-"} → ${x.arrival || "-"}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function sendLine(text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_TO;
  if (!token || !to) {
    throw new Error("Missing LINE_CHANNEL_ACCESS_TOKEN or LINE_TO");
  }

  const endpoint = "https://api.line.me/v2/bot/message/push";
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });

  const bodyText = await resp.text();
  if (!resp.ok) {
    throw new Error(`LINE push failed: ${resp.status} ${bodyText}`);
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}
