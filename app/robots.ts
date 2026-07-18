import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://berberbot.com";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup", "/gizlilik", "/kullanim-kosullari"],
      disallow: [
        "/dashboard/", 
        "/settings/", 
        "/customers/", 
        "/appointments/", 
        "/superadmin/",
        "/onboarding/"
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
