import { createRequestHandler } from "react-router/netlify";

// Send every request to your React Router server build
export default createRequestHandler();

// Run this Edge Function for all routes
export const config = { path: "/*" };