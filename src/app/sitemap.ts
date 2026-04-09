import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://waslauft.in'
  return [
    { url: base, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/zuerich`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/stgallen`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/luzern`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
