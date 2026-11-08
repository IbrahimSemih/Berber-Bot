import { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

const PUBLIC_PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/signup", priority: 0.8, changeFrequency: "monthly" },
  { path: "/login", priority: 0.5, changeFrequency: "monthly" },
  { path: "/rehber", priority: 0.6, changeFrequency: "monthly" },
  { path: "/hakkimizda", priority: 0.5, changeFrequency: "yearly" },
  { path: "/iletisim", priority: 0.5, changeFrequency: "yearly" },
  { path: "/kullanim-kosullari", priority: 0.3, changeFrequency: "yearly" },
  { path: "/gizlilik", priority: 0.3, changeFrequency: "yearly" },
  { path: "/aydinlatma-metni", priority: 0.3, changeFrequency: "yearly" },
  { path: "/mesafeli-satis-sozlesmesi", priority: 0.3, changeFrequency: "yearly" },
  { path: "/on-bilgilendirme-formu", priority: 0.3, changeFrequency: "yearly" },
  { path: "/iptal-ve-iade", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PAGES.map((p) => ({
    url: `${SITE.url}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
