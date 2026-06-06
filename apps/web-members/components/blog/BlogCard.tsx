import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { BLOG_CATEGORIES, type BlogPost } from '@/lib/blog'

export function BlogCard({ post }: { post: BlogPost }) {
    const category = BLOG_CATEGORIES[post.category]

    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand/30 hover:shadow-md"
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                    {category.label}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                </span>
            </div>
            <h2 className="mt-4 text-xl font-bold leading-snug text-slate-950 transition group-hover:text-brand">
                {post.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{post.excerpt}</p>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-500">
                    Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 transition group-hover:text-brand">
                    Read article
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
            </div>
        </Link>
    )
}
