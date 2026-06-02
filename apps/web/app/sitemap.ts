import type { MetadataRoute } from "next";

const baseUrl = "https://cloudpulse-ai.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified },
    { url: `${baseUrl}/anomalies`, lastModified },
    { url: `${baseUrl}/connect`, lastModified },
    { url: `${baseUrl}/dashboard`, lastModified },
    { url: `${baseUrl}/login`, lastModified },
    { url: `${baseUrl}/report`, lastModified },
  ];
}
