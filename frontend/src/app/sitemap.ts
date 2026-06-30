import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/shop", "/about", "/shipping", "/privacy"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const data = await api.products();
    productRoutes = data.results.map((p) => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes];
}
