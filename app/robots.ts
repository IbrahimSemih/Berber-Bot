import { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/r/",
        "/dashboard",
        "/analytics",
        "/appointments",
        "/customers",
        "/staff",
        "/notifications",
        "/settings",
        "/profile",
        "/onboarding",
        "/superadmin",
        "/banned",
        "/reset-password",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
