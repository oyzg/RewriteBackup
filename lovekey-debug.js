/**
 App: Lovekey 1.9 Diagnostic
 Purpose: Quantumult X temporary diagnostics only.
 Logs URL/status/JSON shape. Does not modify traffic or print credentials.

[rewrite_local]
# Lovekey 1.9 account endpoint
^https:\/\/sea\.api\.lovekeyboard\.com\/v1\/device\/account\/vip2(?:\?.*)?$ url script-response-body https://raw.githubusercontent.com/oyzg/RewriteBackup/refs/heads/main/lovekey-debug.js

# Lovekey 1.9 chat endpoint - request
^https:\/\/sea\.api\.lovekeyboard\.com\/v1\/device\/bnh-stream-msg(?:\?.*)?$ url script-request-header https://raw.githubusercontent.com/oyzg/RewriteBackup/refs/heads/main/lovekey-debug.js

# Lovekey 1.9 chat endpoint - response
^https:\/\/sea\.api\.lovekeyboard\.com\/v1\/device\/bnh-stream-msg(?:\?.*)?$ url script-response-body https://raw.githubusercontent.com/oyzg/RewriteBackup/refs/heads/main/lovekey-debug.js

[mitm]
hostname = sea.api.lovekeyboard.com
**/

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
        if (/\/v1\/device\/bnh-stream-msg(?:\?|$)/i.test(url)) {
          const code = Object.prototype.hasOwnProperty.call(parsed, "code") ? parsed.code : "missing";
          const message = Object.prototype.hasOwnProperty.call(parsed, "message") ? String(parsed.message) : "missing";
          const dataKeys = parsed && parsed.data && typeof parsed.data === "object"
            ? Object.keys(parsed.data)
            : [];
          log("chat-result code=" + code + " message=" + JSON.stringify(message) + " data-keys=" + JSON.stringify(dataKeys));
        }
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
