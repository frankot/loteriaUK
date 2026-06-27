import type { MetadataRoute } from "next";

const locales = ["en", "pl", "ro", "bg"];

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    ...locales.flatMap((locale) => [
      `/${locale}/admin/`,
      `/${locale}/login/verify`,
      `/${locale}/register`,
      `/${locale}/profile/`,
      `/${locale}/competitions/*/verify`,
      `/${locale}/competitions/*/success`,
    ]),
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
      crawlDelay: 10,
    },
  };
}
