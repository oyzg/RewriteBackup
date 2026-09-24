/*
 * Lovekey 1.9.0 diagnostic logger for Quantumult X
 * Logs metadata/JSON shape only. Does not modify requests or responses.
 * Sensitive headers and body values are intentionally not logged.
 */

const TAG = "[Lovekey 1.9 Debug]";
const url = ($request && $request.url) || "";
const method = ($request && $request.method) || "UNKNOWN";
const isResponse = typeof $response !== "undefined";

function log(s) { console.log(TAG + " " + s); }

function describe(value, depth) {
  depth = depth || 0;
  if (value === null) return "null";
  if (Array.isArray(value)) {
    const first = value.length ? describe(value[0], depth + 1) : "empty";
    return "array(len=" + value.length + ", first=" + first + ")";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (depth >= 2) return "object(keys=" + keys.join(",") + ")";
    return "object{" + keys.map(k => k + ":" + describe(value[k], depth + 1)).join(", ") + "}";
  }
  if (typeof value === "string") return "string(len=" + value.length + ")";
  return typeof value;
}

try {
  log((isResponse ? "RESPONSE" : "REQUEST") + " " + method + " " + url);

  if (isResponse) {
    const status = $response.statusCode || $response.status || "unknown";
    const headers = $response.headers || {};
    const ct = headers["Content-Type"] || headers["content-type"] || "unknown";
    const body = $response.body || "";
    log("status=" + status + " content-type=" + ct + " body-length=" + body.length);

    if (body) {
      try {
        const parsed = JSON.parse(body);
        log("json-shape=" + describe(parsed, 0));
      } catch (_) {
        log("body-type=non-json");
      }
    }
  } else {
    const headers = ($request && $request.headers) || {};
    const safe = {
      "content-type": headers["Content-Type"] || headers["content-type"] || "",
      "user-agent-present": !!(headers["User-Agent"] || headers["user-agent"]),
      "authorization-present": !!(headers["Authorization"] || headers["authorization"])
    };
    log("safe-headers=" + JSON.stringify(safe));
    if ($request && typeof $request.body === "string") {
      log("request-body-length=" + $request.body.length);
    }
  }
} catch (e) {
  log("ERROR " + String(e));
}

$done({});
