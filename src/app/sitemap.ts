import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hear-that.vercel.app",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
  ];
}
