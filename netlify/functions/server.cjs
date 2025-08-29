/* netlify/functions/server.cjs */

const { Buffer } = require("node:buffer");

// Resolve React Router's handler across ESM/CJS + signature variants
async function getRRHandler() {
  const build = await import("../../build/server/index.js");
  const mode = process.env.NODE_ENV;

  const rrMod = await import("@react-router/node");

  const create =
    rrMod.createRequestHandler ||
    rrMod.default?.createRequestHandler ||
    rrMod.default ||
    rrMod;

  if (typeof create !== "function" && typeof create !== "object") {
    throw new Error("Could not resolve createRequestHandler from @react-router/node");
  }

  try {
    if (typeof create === "function") {
      try {
        return create({ build, mode });
      } catch {
        return create(build, mode);
      }
    } else if (typeof create.createRequestHandler === "function") {
      try {
        return create.createRequestHandler({ build, mode });
      } catch {
        return create.createRequestHandler(build, mode);
      }
    }
  } catch (e) {
    throw new Error(
      "createRequestHandler resolved but couldn’t be invoked: " +
        (e && e.message ? e.message : String(e))
    );
  }

  throw new Error("Unsupported @react-router/node export shape");
}

exports.handler = async (event) => {
  const fetchHandler = await getRRHandler();

  const url = new URL(event.rawUrl);
  const method = event.httpMethod || "GET";
  const headers = event.headers || {};
  const isGetLike = method === "GET" || method === "HEAD";

  let body;
  if (!isGetLike && event.body) {
    body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
  }

  const req = new Request(url.toString(), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const res = await fetchHandler(req);

  const outHeaders = {};
  res.headers.forEach((v, k) => (outHeaders[k] = v));

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