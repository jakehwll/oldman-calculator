import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

function pagesBase(): string {
  const path = process.env.BASE_PATH;
  if (!path) return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export default defineConfig({
  base: pagesBase(),
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
