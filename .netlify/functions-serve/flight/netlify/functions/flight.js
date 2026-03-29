// netlify/functions/flight.js
exports.handler = async (event) => {
  try {
    const accessKey = process.env.AVIATIONSTACK_API_KEY;
    if (!accessKey) {
      return json(500, { error: "Missing AVIATIONSTACK_API_KEY in Netlify environment variables." });
    }
    const flightIata = (event.queryStringParameters?.flight || "").trim().toUpperCase();
    if (!flightIata) {
      return json(400, { error: "Missing query parameter: flight" });
    }
    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", accessKey);
    url.searchParams.set("flight_iata", flightIata);
    url.searchParams.set("limit", "1");
    const resp = await fetch(url.toString());
    const data = await resp.json();
    if (!resp.ok || data?.error) {
      return json(502, { error: data?.error?.message || "Flight API request failed." });
    }
    const row = data?.data?.[0];
    if (!row) {
      return json(404, { error: `No flight found for ${flightIata}` });
    }
    const result = {
      flight: row.flight?.iata || flightIata,
      airline: row.airline?.name || "-",
      status: row.flight_status || "unknown",
      departure: {
        airport: row.departure?.airport || "-",
        iata: row.departure?.iata || "-",
        scheduled: row.departure?.scheduled || null,
        estimated: row.departure?.estimated || null
      },
      arrival: {
        airport: row.arrival?.airport || "-",
        iata: row.arrival?.iata || "-",
        scheduled: row.arrival?.scheduled || null,
        estimated: row.arrival?.estimated || null
      },
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      raw: row
    };
    return json(200, result);
  } catch (err) {
    return json(500, { error: err.message || "Unexpected error" });
  }
};
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
//# sourceMappingURL=flight.js.map
