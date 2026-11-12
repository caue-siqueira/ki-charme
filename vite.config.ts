import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// O Vite expõe VITE_* ao navegador; as funções de servidor usam process.env.
const env = loadEnv(
  process.env["NODE_ENV"] === "production" ? "production" : "development",
  process.cwd(),
  "",
);
for (const name of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (process.env[name] === undefined && env[name] !== undefined) process.env[name] = env[name];
}

// O wrapper já inclui React, Tailwind, TanStack Start e Nitro.
export default defineConfig({
  nitro: {
    preset: process.env["NITRO_PRESET"] ?? (process.env["VERCEL"] ? "vercel" : "node-server"),
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
    },
  },
});
