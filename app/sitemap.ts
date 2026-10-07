import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://lumen-medical.vercel.app";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/categories`, lastModified: now },
    { url: `${base}/quiz`, lastModified: now },
    { url: `${base}/papers`, lastModified: now },
    { url: `${base}/saved`, lastModified: now },
  ];
}
