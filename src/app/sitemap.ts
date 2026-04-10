import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://waslauft.in'
  const today = new Date().toISOString().split('T')[0]

  return [
    { url: base, changeFrequency: 'daily', priority: 1.0, lastModified: today },
    { url: `${base}/zuerich`, changeFrequency: 'daily', priority: 0.9, lastModified: today },
    { url: `${base}/stgallen`, changeFrequency: 'daily', priority: 0.9, lastModified: today },
    { url: `${base}/luzern`, changeFrequency: 'daily', priority: 0.9, lastModified: today },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
