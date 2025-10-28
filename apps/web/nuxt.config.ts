import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  modules: ["@nuxt/ui", "@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  eslint: {
    config: {
      standalone: false,
    },
  },
  alias: {
    "@cattyshack/shared": fileURLToPath(new URL("../../packages/shared/lib", import.meta.url)),
  },
  ui: {
    theme: {
      colors: ["cattyshack-purple", "cattyshack-green", "cattyshack-dark"],
    },
  },
  nitro: {
    host: "0.0.0.0",
    port: 3000,
  },
});
