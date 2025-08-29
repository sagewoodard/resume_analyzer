/* netlify/functions/server.js */

const { Buffer } = require("node:buffer");

// Lazily resolve react-router's handler in a version/interop-safe way
async function getRRHandler() {
  // Load the server build fresh on each cold start
  const build = await import("../../build/server/index.js");
  const mode = process.env.NODE_ENV;

  // Import @react-router/node safely across ESM/CJS
  const rrMod = await import("@react-router/node");

  // The handler export and its signature vary by version:
  // - Some expose `createRequestHandler(build, mode)`
  // - Others expose `createRequestHandler({ build, mode })`
  const create =
    rrMod.createRequestHandler ||
    rrMod.default?.createRequestHandler ||
    rrMod.default || // in a few cases default IS the function
    rrMod;

  if (typeof create !== "function" && typeof create !== "object") {
    throw new Error(
      "Could not resolve createRequestHandler from @react-router/node"
    );
  }

  // Try both call styles
  try {
    if (typeof create === "function") {
      // v7 often supports object *or* tuple; try object first
      try {
        return create({ build, mode });
      } catch {
        return create(build, mode);
      }
    } else if (typeof create === "object" && typeof create.createRequestHandler === "function") {
      try {
        return create.createRequestHandler({ build, mode });
      } catch {
        return create.createRequestHandler(build, mode);
      }
    }
  } catch (e) {
    // Surface a clear error
    throw new Error(
      "createRequestHandler resolved but could not be invoked with either signature: " +
        (e && e.message ? e.message : String(e))
    );
  }

  throw new Error("Unsupported @react-router/node export shape");
}

exports.handler = async (event) => {
  // Ensure we have a handler
  const fetchHandler = await getRRHandler();

  // Convert Netlify event → WHATWG Request
  const url = new URL(event.rawUrl);
  const method = event.httpMethod || "GET";
  const headers = event.headers || {};
  const isGetLike = method === "GET" || method === "HEAD";

  let body;
  if (!isGetLike && event.body) {
    body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
  }

  const req = new Request(url.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  // Let React Router render
  const res = await fetchHandler(req);

  // Copy headers
  const outHeaders = {};
  res.headers.forEach((v, k) => (outHeaders[k] = v));

  // Handle binary/text safely
  const buf = Buffer.from(await res.arrayBuffer());
  const isBinary =
    outHeaders["content-type"] &&
    !/^text\/|\/json|\/javascript|\/xml|\/svg/i.test(outHeaders["content-type"]);

  return {
    statusCode: res.status,
    headers: outHeaders,
    body: isBinary ? buf.toString("base64") : buf.toString("utf8"),
    isBase64Encoded: !!isBinary,
  };
};