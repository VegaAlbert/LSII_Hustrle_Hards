// Ports of the backend and frontend started by Playwright. They differ from the usual dev servers (8080 / 5173), so
// the suite always runs against its own fresh environment.
export const BACKEND_PORT = process.env.E2E_BACKEND_PORT ?? '8081';
export const FRONTEND_PORT = process.env.E2E_FRONTEND_PORT ?? '5174';
export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
