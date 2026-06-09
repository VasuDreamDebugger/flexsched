import app, { initializeServer } from "../src/server.js";

// Ensure DB connects on Vercel cold start.
await initializeServer();

export default app;
