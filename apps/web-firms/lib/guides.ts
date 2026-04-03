import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides')

export type GuideFrontmatter = {
  title: string
  slug: string
  description: string
  keywords: string[]
  publishedAt: string
  updatedAt: string
  readTime: string
  category: 'guide' | 'best-of' | 'comparison' | 'location' | 'role'
  funnelStage: 'top' | 'mid' | 'bottom'
  status: 'published' | 'draft'
  ogImage?: string
  // Internal linking
  ctaLinks: {
    label: string
    href: string
  }[]
  // Schema markup
  schemaType?: 'FAQPage' | 'HowTo' | 'Article'
  faq?: { question: string; answer: string }[]
  howToSteps?: { name: string; text: string }[]
  // Table of contents
  toc: { id: string; label: string }[]
}

export type GuideEntry = {
  frontmatter: GuideFrontmatter
  content: string
  slug: string
}

export function getAllGuides(): GuideEntry[] {
  if (!fs.existsSync(GUIDES_DIR)) return []

  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.mdx'))

  return files
    .map((filename) => {
      const filePath = path.join(GUIDES_DIR, filename)
      const raw = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(raw)

      return {
        frontmatter: data as GuideFrontmatter,
        content,
        slug: filename.replace('.mdx', ''),
      }
    })
    .filter((g) => g.frontmatter.status === 'published')
    .sort((a, b) => new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime())
}

export function getGuideBySlug(slug: string): GuideEntry | null {
  const filePath = path.join(GUIDES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)

  return {
    frontmatter: data as GuideFrontmatter,
    content,
    slug,
  }
}

export function getGuideSlugs(): string[] {
  if (!fs.existsSync(GUIDES_DIR)) return []
  return fs.readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''))
}
