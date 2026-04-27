import { SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/zangochap-manager/",
          "/api/",
          "/login",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/zangochap-manager/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
