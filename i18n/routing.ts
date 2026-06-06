import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pl", "ro", "bg"],
  defaultLocale: "en",
  localeDetection: false,
});
