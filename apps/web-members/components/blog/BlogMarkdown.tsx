import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function isInternalHref(href: string | undefined): href is string {
    return Boolean(href && href.startsWith('/'))
}

export function BlogMarkdown({ content }: { content: string }) {
    return (
        <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:text-slate-950 prose-a:font-semibold prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-p:leading-7 prose-li:leading-7">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children, ...props }) =>
                        isInternalHref(href) ? (
                            <Link href={href} {...props}>
                                {children}
                            </Link>
                        ) : (
                            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                            </a>
                        ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
