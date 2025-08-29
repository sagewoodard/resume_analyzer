// netlify/functions/server.ts
import type { Handler } from "@netlify/functions";
import { createRequestHandler } from "@react-router/node";
import * as build from "../../build/server/index.js";

// React Router gives us a Fetch handler (Request -> Response)
const fetchHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

export const handler: Handler = async (event) => {
  // Convert Netlify's event into a standard Request
  const url = new URL(event.rawUrl);

  // Netlify may pass base64-encoded bodies for some content types
  const isBase64 = event.isBase64Encoded;
  let body: BodyInit | undefined = undefined;
  if (event.body) {
    body = isBase64 ? Buffer.from(event.body, "base64") : event.body;
  }

  const request = new Request(url.toString(), {
    method: event.httpMethod,
    headers: event.headers as Record<string, string>,
    body: ["GET", "HEAD"].includes(event.httpMethod) ? undefined : (body as any),
    redirect: "manual",
  });

  // Hand off to React Router's fetch handler
  const response = await fetchHandler(request);

  // Convert Response back into Netlify Function result
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const text = await response.text();

  return {
    statusCode: response.status,
    headers,
    body: text,
  };
};